import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const WEEK = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { refreshToken?: string };
  const jar = await cookies();
  jar.set("aadai_session", "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: WEEK });
  if (body.refreshToken && process.env.NEXT_PUBLIC_API_MODE === "real") {
    jar.set("aadai_refresh", body.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: WEEK,
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete("aadai_session");
  jar.delete("aadai_refresh");
  return NextResponse.json({ ok: true });
}
