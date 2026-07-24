/**
 * middleware.ts
 *
 * Next.js Edge Middleware — runs on the server before every matched page
 * request, before layout.tsx executes.
 *
 * Single responsibility: ensure the httpOnly `token` cookie is always fresh
 * when layout.tsx runs its `decodeSessionToken()` call. If the access token
 * has expired but a valid `refreshToken` cookie exists, this middleware
 * silently obtains a new access token from the backend and sets it as a
 * cookie on the response — all before the browser receives a single byte
 * of HTML.
 *
 * Why middleware and not layout.tsx?
 *   layout.tsx (Server Component) can READ cookies but CANNOT SET them.
 *   Middleware is part of the real request/response pipeline and can both
 *   read and write cookies on the outgoing response.
 *
 * Runtime: Edge (not Node.js)
 *   - Node.js built-ins (e.g. `crypto`) are NOT available here.
 *   - JWT expiry is checked by decoding the payload with `atob()` (Web API).
 *   - Full cryptographic HS256 verification is still done in layout.tsx
 *     (Node.js runtime) — so security is never compromised.
 *
 * Flow:
 *   token valid          → NextResponse.next()  (no-op, pass through)
 *   token expired/missing
 *     refreshToken missing → NextResponse.next()  (guest)
 *     refreshToken present → POST backend /api/auth/refresh
 *       success            → set new token cookie → NextResponse.next()
 *       failure            → clear both cookies   → NextResponse.next() (guest)
 */

import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Helper — token expiry check (Edge-compatible, no Node crypto needed)
// ---------------------------------------------------------------------------

/**
 * isTokenExpiredOrMissing
 *
 * Returns true if the token is absent, malformed, or its `exp` claim is in
 * the past. Does NOT verify the JWT signature — that is layout.tsx's job.
 * Here we only need to decide "should we attempt a refresh?".
 *
 * Uses `atob()` which is part of the Web API and works in Edge Runtime.
 *
 * @param token — raw JWT string from the cookie, or undefined
 */
function isTokenExpiredOrMissing(token: string | undefined): boolean {
  if (!token) return true;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    // Convert base64url → base64 → decode to JSON string
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadStr = atob(base64);
    const payload = JSON.parse(payloadStr) as { exp?: number };

    // exp is Unix epoch seconds — compare against current time
    const now = Math.floor(Date.now() / 1000);
    return !payload.exp || payload.exp < now;
  } catch {
    // Malformed token — treat as expired
    return true;
  }
}

// ---------------------------------------------------------------------------
// Middleware handler
// ---------------------------------------------------------------------------

/**
 * middleware
 *
 * Entry point called by Next.js for every request that matches the `config`
 * matcher below. Handles silent token refresh transparently so layout.tsx
 * always finds a valid `token` cookie when one can be obtained.
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  // ── Fast path: token is present and not expired ──────────────────────────
  if (!isTokenExpiredOrMissing(token)) {
    // Nothing to do — layout.tsx will decode this token successfully.
    return NextResponse.next();
  }

  // ── Token is missing or expired — attempt silent refresh ─────────────────

  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    // No refresh token either — the visitor is a genuine guest.
    // Pass through; layout.tsx will return initialUser = null.
    return NextResponse.next();
  }

  // ── refreshToken exists — call the backend refresh endpoint ──────────────

  const backendUrl = process.env.BACKEND_API_URL;

  if (!backendUrl) {
    console.error(
      "[Middleware] BACKEND_API_URL is not set in frontend/.env — " +
        "cannot attempt token refresh."
    );
    return NextResponse.next();
  }

  try {
    /**
     * Call the Express backend directly (server-to-server).
     * The backend's refreshController accepts the refresh token from the
     * request body: `req.body?.refreshToken` — no cookie forwarding needed.
     *
     * We do NOT call the Next.js proxy route (/api/auth/refresh) here because
     * that route's Set-Cookie header would go back to this middleware as a
     * fetch response header — not to the browser. Calling the backend directly
     * and setting the cookie ourselves on NextResponse is the correct pattern.
     */
    const refreshRes = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      /**
       * Refresh failed — possible reasons:
       *   - refresh token was revoked (logout from another device)
       *   - refresh token JWT itself expired (> 7 days since last login)
       *   - user account was deleted
       *
       * Clear both cookies so the browser is in a clean guest state and
       * the user is not shown a broken half-authenticated UI.
       */
      console.warn(
        `[Middleware] Refresh attempt failed with status ${refreshRes.status} — clearing session cookies.`
      );
      const response = NextResponse.next();
      response.cookies.delete("token");
      response.cookies.delete("refreshToken");
      return response;
    }

    const data = (await refreshRes.json()) as { accessToken?: string };
    const newAccessToken = data.accessToken;

    if (!newAccessToken) {
      // Unexpected: backend returned 200 but no accessToken in the body.
      console.error("[Middleware] Backend refresh returned no accessToken.");
      return NextResponse.next();
    }

    /**
     * Refresh succeeded — attach the new access token as an httpOnly cookie
     * on the outgoing response. The browser will store it, and layout.tsx will
     * find it when it calls cookies() a few milliseconds later.
     *
     * Cookie settings mirror those in /api/auth/login/route.js and
     * /api/auth/refresh/route.js so behaviour is consistent across all
     * token-issuing paths.
     */
    const response = NextResponse.next();
    response.cookies.set("token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15, // 15 minutes — matches the access token lifetime
    });

    return response;
  } catch (err) {
    // Network error, backend down, JSON parse error, etc.
    // Fail gracefully — show guest UI rather than crashing.
    console.error("[Middleware] Unexpected error during token refresh:", err);
    return NextResponse.next();
  }
}

// ---------------------------------------------------------------------------
// Route matcher — controls which requests trigger this middleware
// ---------------------------------------------------------------------------

export const config = {
  /**
   * Run on all routes EXCEPT:
   *   /api/*          — API route handlers have their own auth via fetchWithAuth()
   *   /_next/static/* — compiled JS/CSS bundles, no auth needed
   *   /_next/image/*  — Next.js image optimisation, no auth needed
   *   /favicon.ico    — browser default icon fetch, no auth needed
   *
   * The negative lookahead `(?!...)` excludes these prefixes so the middleware
   * only fires on real page navigations where layout.tsx will run.
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
