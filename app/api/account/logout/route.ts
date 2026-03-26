import { CONTACT_COOKIE, parseContactTokenFromCookieHeader } from "@/lib/contact-session-cookie";
import { contactLogout } from "@/lib/contacts-db";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = parseContactTokenFromCookieHeader(request.headers.get("cookie"));
  if (token) contactLogout(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CONTACT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
