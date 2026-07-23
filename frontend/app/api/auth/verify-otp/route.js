import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const backendRes = await fetch(
      `${process.env.BACKEND_API_URL}/api/auth/verify-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Invalid or expired code" },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data); // { resetToken }
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
