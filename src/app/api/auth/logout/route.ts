import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const jar = await cookies();
  jar.delete("aadai_session");
  jar.delete("aadai_refresh");
  return NextResponse.json({ ok: true });
}
