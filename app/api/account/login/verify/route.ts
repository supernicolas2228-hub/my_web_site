import { CONTACT_COOKIE } from "@/lib/contact-auth";
import { completeContactCabinetLogin } from "@/lib/contacts-db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { challengeToken?: string; smsCode?: string; emailCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const challengeToken = (body.challengeToken || "").trim();
  const smsCode = (body.smsCode || "").trim();
  const emailCode = (body.emailCode || "").trim();
  if (!challengeToken || !smsCode || !emailCode) {
    return NextResponse.json({ error: "Укажите токен и оба кода" }, { status: 400 });
  }

  const result = completeContactCabinetLogin(challengeToken, smsCode, emailCode);
  if (!result.ok) {
    const map = {
      not_found: "Сессия входа не найдена. Запросите коды снова",
      expired: "Коды истекли. Запросите вход заново",
      max_attempts: "Слишком много попыток. Запросите вход заново",
      invalid_codes: "Неверный код из SMS или из письма"
    } as const;
    return NextResponse.json({ error: map[result.reason] }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CONTACT_COOKIE, result.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(result.expiresAt)
  });
  return response;
}
