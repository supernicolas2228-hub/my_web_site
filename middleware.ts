import { NextRequest, NextResponse } from "next/server";
import { parseAdminTokenFromCookieHeader } from "@/lib/admin-session-cookie";

const APEX_HOST = "truewebwork.ru";
const CANONICAL_WWW_HOST = "www.truewebwork.ru";

/** Edge-safe gate: session is validated on API routes (SQLite). */
function hasPlausibleSessionToken(cookieHeader: string | null) {
  const token = parseAdminTokenFromCookieHeader(cookieHeader);
  return Boolean(token && /^[a-f0-9]{64}$/i.test(token));
}

function primaryHost(hostHeader: string | null) {
  if (!hostHeader) return "";
  // RFC 1035: FQDN может приходить с завершающей точкой; без нормализации редирект apex → www не сработает.
  return hostHeader.split(":")[0].trim().toLowerCase().replace(/\.$/, "");
}

export function middleware(request: NextRequest) {
  const host = primaryHost(request.headers.get("host"));

  if (host === APEX_HOST) {
    const dest = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      `https://${CANONICAL_WWW_HOST}`
    );
    return NextResponse.redirect(dest, 301);
  }

  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") return NextResponse.next();

  if (!hasPlausibleSessionToken(request.headers.get("cookie"))) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|woff2?)$).*)"
  ]
};

