import { NextResponse } from "next/server";

/**
 * GET /api/alerts/nearby
 *
 * Next.js API route to proxy nearby alerts radius queries to the Express backend.
 * Appends query parameters forwardly.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius") || "50";

    if (!lat || !lng) {
      return NextResponse.json(
        { message: "Latitude and Longitude query parameters are required." },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      return NextResponse.json({ message: "Backend API URL not set" }, { status: 500 });
    }

    const backendRes = await fetch(
      `${backendUrl}/api/alerts/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch nearby alerts." },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[Nearby Alerts Proxy Route] Error querying nearby alerts:", err);
    return NextResponse.json(
      { message: "Internal server error during nearby alerts query" },
      { status: 500 }
    );
  }
}
