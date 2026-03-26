import { ADMIN_COOKIE, parseAdminTokenFromCookieHeader } from "@/lib/admin-auth";
import { adminLogout } from "@/lib/admin-db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = parseAdminTokenFromCookieHeader(request.headers.get("cookie"));
  if (token) adminLogout(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });
  return response;
}

