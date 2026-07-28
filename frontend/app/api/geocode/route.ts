import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode?q=<query>
 *
 * Server-side proxy for the OSM Nominatim geocoding API.
 * The browser cannot call Nominatim directly from localhost due to CORS.
 * This route runs on the Next.js server, which has no CORS restrictions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    q
  )}&countrycodes=in&limit=5`;

  const res = await fetch(nominatimUrl, {
    headers: {
      // Nominatim requires a valid User-Agent identifying the application
      "User-Agent": "SIHCoastalHazardAlert/1.0 (contact: admin@sih.in)",
      "Accept-Language": "en",
    },
    // Cache results for 60 seconds to avoid hammering the public API
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Geocoding service unavailable" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
