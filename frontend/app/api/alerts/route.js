import { NextResponse } from "next/server";

/**
 * GET /api/alerts
 *
 * Next.js API route to proxy national alerts requests to the Express backend.
 */
export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      return NextResponse.json({ message: "Backend API URL not set" }, { status: 500 });
    }

    const backendRes = await fetch(`${backendUrl}/api/alerts`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch active alerts." },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[Alerts Proxy Route] Error fetching national alerts:", err);
    return NextResponse.json(
      { message: "Internal server error during alerts retrieval" },
      { status: 500 }
    );
  }
}
