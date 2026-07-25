import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  // Forward cookies so the backend's protect middleware can verify the JWT
  const cookieHeader = request.headers.get("cookie") || "";

  const res = await fetch(`${BACKEND}/api/user/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
