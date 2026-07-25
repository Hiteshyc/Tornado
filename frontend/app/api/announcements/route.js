import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const backendRes = await fetch(
      `${process.env.BACKEND_API_URL}/api/announcements`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch announcements" },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
