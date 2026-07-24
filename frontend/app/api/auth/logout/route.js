import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Next.js API route handler to safely clear httpOnly cookies in the browser.
 * Because the client-side JavaScript cannot access httpOnly cookies, this server-side
 * proxy endpoint is required to instruct the browser to delete the 'token' and
 * 'refreshToken' cookies. It also forwards the logout request to the backend.
 */
export async function POST(request) {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    // Extract incoming auth token from cookie jar
    const token = request.cookies.get("token")?.value;

    // Instruct browser to delete authentication cookies by setting expired dates
    response.cookies.delete("token");
    response.cookies.delete("refreshToken");

    // Proxy call to backend to invalidate session in DB
    if (process.env.BACKEND_API_URL) {
      try {
        await fetch(`${process.env.BACKEND_API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } catch (err) {
        // Soft fail if backend logout endpoint has network/other issues
        console.warn("[Logout Route] Optional backend logout failed:", err.message);
      }
    }

    return response;
  } catch (err) {
    console.error("[Logout Route] Error clearing session cookies:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error during logout" },
      { status: 500 }
    );
  }
}
