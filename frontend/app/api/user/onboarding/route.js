import { NextResponse } from "next/server";

/**
 * PATCH /api/user/onboarding
 *
 * Next.js proxy route handler to submit onboarding details to the Express backend.
 * Extracts the user's browser token cookie and forwards it as a Bearer authorization header.
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication session expired. Please log in again." },
        { status: 401 }
      );
    }

    const backendRes = await fetch(
      `${process.env.BACKEND_API_URL}/api/user/onboarding`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to submit onboarding form." },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[Onboarding API Proxy] Error submitting onboarding:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
