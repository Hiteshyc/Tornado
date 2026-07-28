import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const cookieHeader = request.headers.get("cookie") || "";
  const formData = await request.formData();

  const res = await fetch(`${BACKEND}/api/user/${userId}/profile-image`, {
    method: "PATCH",
    headers: {
      cookie: cookieHeader,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
