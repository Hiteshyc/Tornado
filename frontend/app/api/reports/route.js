import { NextResponse } from "next/server";

// POST /api/reports
// Proxies the report submission to the Express backend
export async function POST(request) {
  try {
    const body = await request.json();

    const backendRes = await fetch(
      `${process.env.BACKEND_API_URL}/api/reports`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward the token cookie from the browser to the backend
          ...(request.headers.get("cookie")
            ? { Cookie: request.headers.get("cookie") }
            : {}),
        },
        body: JSON.stringify(body),
      },
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to submit report" },
        { status: backendRes.status },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
