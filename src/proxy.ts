import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intl = createMiddleware(routing);

function barePath(pathname: string): { path: string; prefix: string } {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return { path: pathname.slice(3) || "/", prefix: "/en" };
  }
  return { path: pathname, prefix: "" };
}

const PUBLIC = [/^\/login$/, /^\/signup$/, /^\/verify$/, /^\/forgot$/, /^\/s(\/|$)/];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) return NextResponse.next();
  const { path, prefix } = barePath(pathname);
  const isPublic = path === "/" || PUBLIC.some((pattern) => pattern.test(path));
  const session = request.cookies.get("aadai_session")?.value;

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}/login`;
    return NextResponse.redirect(url);
  }
  if (session && /^\/(login|signup|verify|forgot)$/.test(path)) {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}/dashboard`;
    return NextResponse.redirect(url);
  }
  return intl(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
