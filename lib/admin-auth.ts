import { NextRequest } from "next/server";
import { getAdminFromToken } from "@/lib/admin-db";
import { ADMIN_COOKIE, parseAdminTokenFromCookieHeader } from "@/lib/admin-session-cookie";

export { ADMIN_COOKIE, parseAdminTokenFromCookieHeader };

export function getAdminFromRequest(request: NextRequest | Request) {
  const token = parseAdminTokenFromCookieHeader(request.headers.get("cookie"));
  if (!token) return null;
  return getAdminFromToken(token);
}

