import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST /api/reports
// Proxies multipart/form-data (with files) to the Express backend
export async function POST(request) {
  try {
    // ── Read auth cookies using next/headers (most reliable in App Router) ──
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    // ── Forward the FormData as-is to the backend ───────────────────────────
    const formData = await request.formData();

    const backendRes = await fetch(
      `${process.env.BACKEND_API_URL}/api/reports`,
      {
        method: "POST",
        headers: {
          // Forward all cookies (token + refreshToken) so backend can identify the user
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          // Do NOT set Content-Type — fetch sets multipart/form-data with boundary automatically
        },
        body: formData,
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
    console.error("[/api/reports] Error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
