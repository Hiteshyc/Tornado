/**
 * layout.tsx
 *
 * Root layout for the Next.js App Router.
 *
 * Responsibilities:
 *   1. Import global CSS (design tokens, fonts, animations).
 *   2. Decode the httpOnly 'token' cookie server-side and pass session data
 *      to <Providers> so AuthContext is pre-populated on the first render.
 *   3. Wrap the entire app in <Providers> (AuthContext + ThemeContext).
 *   4. Render <Navbar> above every page so it is always visible.
 *   5. Set document-level metadata (title, description).
 *
 * Why this is the right place to decode the JWT (Approach B — RSC):
 *   layout.tsx is a Server Component. It runs on the server before any HTML
 *   is sent to the browser, giving it access to:
 *     - next/headers cookies() — can read httpOnly cookies that JS cannot.
 *     - Node.js built-ins (crypto) — to verify the HS256 signature.
 *   The decoded { id, role } is passed as a plain prop to <Providers>, which
 *   threads it to AuthContext so the entire client tree sees the correct user
 *   on the very first paint — no API round-trip, no guest flash.
 */

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import crypto from "crypto";
import "./globals.css";
import Providers from "./providers";
import Navbar from "./components/Navbar";

// ---------------------------------------------------------------------------
// Font configuration
// ---------------------------------------------------------------------------

/**
 * inter — Primary sans-serif font.
 * `variable` exposes it as --font-inter for use in globals.css @theme block.
 * Optical sizing (opsz) and weight range match the reference design.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * jetbrainsMono — Monospaced font used for code-style labels (role badge,
 * coordinates, agency abbreviation, severity codes, etc.).
 */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

// ---------------------------------------------------------------------------
// JWT session helper
// ---------------------------------------------------------------------------

/**
 * SessionPayload — the fields we extract from the decoded JWT.
 * Matches what generateAccessToken() puts into the token payload:
 *   { id: userId, role, issuedAt, exp }
 */
interface SessionPayload {
  id: string;
  role: "user" | "officer" | "admin";
  exp?: number;
}

/**
 * decodeSessionToken
 *
 * Reads the httpOnly 'token' cookie and verifies + decodes it.
 * Uses Node.js built-in `crypto` (HS256) — no extra npm package needed.
 *
 * Returns { id, role } on success, or null if:
 *   - No token cookie present (visitor is a guest)
 *   - JWT_SECRET is missing from .env
 *   - Signature is invalid (tampered token)
 *   - Token has expired (exp < now)
 *   - Any unexpected parsing error
 *
 * @returns SessionPayload | null
 */
async function decodeSessionToken(): Promise<any | null> {
  try {
    // 1. Read the cookie store (server-side only — httpOnly cookies are
    //    invisible to browser JS but fully accessible here).
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    // 2. Ensure the secret is configured.
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error(
        "[layout] JWT_SECRET is not set in frontend/.env — cannot verify session cookie."
      );
      return null;
    }

    // 3. Split the token into its three base64url parts.
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    // 4. Verify HS256 signature using Node's crypto module.
    //    HMAC-SHA256 over "header.payload" must match the token's signature.
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${headerB64}.${payloadB64}`);
    const expectedSig = hmac.digest("base64url");

    if (signatureB64 !== expectedSig) {
      console.warn("[layout] JWT signature mismatch — possible tampering.");
      return null;
    }

    // 5. Decode the payload (base64url → JSON).
    const raw = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(raw) as SessionPayload;

    // 6. Check token expiry (exp is Unix epoch seconds).
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Token has expired — treat as guest; the refresh flow will handle renewal.
      return null;
    }

    // 7. Validate required fields.
    if (!payload.id || !payload.role) return null;

    // 8. Fetch full profile details directly from backend (server-to-server)
    try {
      const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000";
      const profileRes = await fetch(`${backendUrl}/api/user/${payload.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (profileRes.ok) {
        const profileData = (await profileRes.json()) as { user?: any };
        if (profileData && profileData.user) {
          return profileData.user;
        }
      }
    } catch (err: any) { }

    // Fallback: return basic info decoded from the token payload
    return { id: payload.id, role: payload.role };
  } catch {
    // Catches malformed JSON, Buffer errors, etc.
    return null;
  }
}

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

/**
 * metadata — Next.js static metadata exported from any layout or page.
 * This populates <title> and <meta name="description"> in the HTML head.
 */
export const metadata: Metadata = {
  title: "Coastal Hazard Prevention | NDMA Emergency Response",
  description:
    "Real-time coastal hazard monitoring, early warning alerts, and emergency response coordination powered by NDMA.",
};

// ---------------------------------------------------------------------------
// Root layout component
// ---------------------------------------------------------------------------

/**
 * RootLayout
 *
 * Every page in the app is rendered as `children` inside this layout.
 * This is an async Server Component so it can await cookies() and perform
 * JWT decoding before streaming any HTML to the browser.
 *
 * Data flow:
 *   1. decodeSessionToken() — reads + verifies the httpOnly cookie.
 *   2. initialUser — { id, role } passed to <Providers> as a plain prop.
 *   3. <Providers> threads it to <AuthProvider>.
 *   4. AuthProvider initialises useState with initialUser (not null).
 *   5. Every client component calls useAuth() and gets the real user.
 *
 * DOM structure:
 *   <html lang="en" class="dark | ''">
 *     <body>
 *       <Providers initialUser={initialUser}>
 *         <Navbar />
 *         <main>{children}</main>
 *       </Providers>
 *     </body>
 *   </html>
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  /**
   * Decode the JWT cookie server-side.
   * Returns null if the visitor is a guest or the token is invalid/expired.
   */
  const initialUser = await decodeSessionToken();
  return (
    <html
      lang="en"
      /**
       * Font CSS variables are applied here so they cascade to every element.
       * `antialiased` enables subpixel font smoothing on macOS/retina screens.
       * `h-full` ensures the html element fills the viewport height — required
       * by the flex-column layout that pushes the footer to the bottom.
       */
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        /**
         * `flex flex-col min-h-full` lets children fill the remaining vertical
         * space (e.g. the map can use `flex-1` to expand below the navbar).
         * Background and text colour come from CSS vars set by globals.css
         * so they switch automatically when the "dark" class is toggled.
         */
        className="flex flex-col min-h-full"
        style={{ background: "var(--bg)", color: "var(--fg)" }}
      >
        {/*
         * Providers wraps all children with ThemeContext and AuthContext.
         * It is a Client Component but the layout remains an RSC because
         * the "use client" boundary is inside providers.tsx, not here.
         */}
        <Providers initialUser={initialUser}>
          {/*
           * Navbar is always rendered at the top of the page.
           * It reads from AuthContext (user/role) and ThemeContext (theme)
           * to show the correct avatar, menu items, and theme toggle icon.
           */}
          <Navbar />

          {/*
           * Page content — each route's page.tsx renders as children.
           * `flex-1` makes the content area fill the remaining vertical space
           * so the layout works correctly for both short and tall pages.
           */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
