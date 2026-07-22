import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: "No refresh token available" },
        { status: 401 }
      );
    }

    const backendRes = await fetch(
      `${process.env.BACKEND_API_URL}/api/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      const response = NextResponse.json(
        { message: data.message || "Session expired. Please log in again." },
        { status: backendRes.status }
      );
      // Clear cookies if refresh failed
      response.cookies.delete("token");
      response.cookies.delete("refreshToken");
      return response;
    }

    const response = NextResponse.json({ token: data.accessToken });

    if (data.accessToken) {
      response.cookies.set("token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15, // 15 minutes access token cookie
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
