import { NextRequest, NextResponse } from "next/server";
import { parseAdminTokenFromCookieHeader } from "@/lib/admin-session-cookie";

/** Edge-safe gate: session is validated on API routes (SQLite). */
function hasPlausibleSessionToken(cookieHeader: string | null) {
  const token = parseAdminTokenFromCookieHeader(cookieHeader);
  return Boolean(token && /^[a-f0-9]{64}$/i.test(token));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Единый канонический протокол для SEO и стабильной доступности в браузерах.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") || "";
  if (host.includes("truewebwork.ru") && forwardedProto === "http") {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  if (!hasPlausibleSessionToken(request.headers.get("cookie"))) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};

