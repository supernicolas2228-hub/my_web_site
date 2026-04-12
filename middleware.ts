import { NextRequest, NextResponse } from "next/server";
import { parseAdminTokenFromCookieHeader } from "@/lib/admin-session-cookie";

/** Edge-safe gate: session is validated on API routes (SQLite). */
function hasPlausibleSessionToken(cookieHeader: string | null) {
  const token = parseAdminTokenFromCookieHeader(cookieHeader);
  return Boolean(token && /^[a-f0-9]{64}$/i.test(token));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Редирект HTTP→HTTPS не делаем здесь: за прокси (Cloudflare/Nginx) часто приходит
  // X-Forwarded-Proto: http даже при открытом в браузере https — получался бесконечный редирект
  // на мобильных. HTTPS настраивается в Nginx (listen 443 + редирект с :80).

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
  matcher: [
    /*
     * Статику Next и API не трогаем — иначе в dev иногда не подхватываются CSS/чанки («только текст»).
     * См. https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
     */
    "/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico).*)"
  ]
};

