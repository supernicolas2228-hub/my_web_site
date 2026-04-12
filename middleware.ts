import { NextRequest, NextResponse } from "next/server";
import { parseAdminTokenFromCookieHeader } from "@/lib/admin-session-cookie";

/** Edge-safe gate: session is validated on API routes (SQLite). */
function hasPlausibleSessionToken(cookieHeader: string | null) {
  const token = parseAdminTokenFromCookieHeader(cookieHeader);
  return Boolean(token && /^[a-f0-9]{64}$/i.test(token));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Только /admin: не гоняем публичные страницы, RSC и чанки через Edge — быстрее заход
  // из поиска, с VPN и через прокси (меньше задержек и сбоев).

  if (pathname === "/admin/login") return NextResponse.next();

  if (!hasPlausibleSessionToken(request.headers.get("cookie"))) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"]
};

