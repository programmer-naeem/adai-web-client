import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Real mode: the httpOnly refresh cookie is exchanged with the API. Mock sessions refresh in the client. */
export async function POST() {
  if (process.env.NEXT_PUBLIC_API_MODE !== "real") {
    return NextResponse.json({ code: "USE_CLIENT_REFRESH" }, { status: 401 });
  }
  const jar = await cookies();
  const refresh = jar.get("aadai_refresh")?.value;
  if (!refresh) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.aadai.app/api/v1";
  const response = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  const payload = (await response.json().catch(() => null)) as { refreshToken?: string } | null;
  if (!response.ok || !payload) return NextResponse.json(payload ?? { code: "UNAUTHORIZED" }, { status: response.status });
  if (payload.refreshToken) {
    jar.set("aadai_refresh", payload.refreshToken, { httpOnly: true, sameSite: "lax", path: "/api/auth" });
  }
  return NextResponse.json(payload);
}
