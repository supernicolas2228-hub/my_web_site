import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { completeAdmin2faLoginByPhone } from "@/lib/admin-db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { challengeToken?: string; smsCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const challengeToken = (body.challengeToken || "").trim();
  const smsCode = (body.smsCode || "").trim();

  if (!challengeToken || !smsCode) {
    return NextResponse.json({ error: "Укажите challengeToken и код из звонка" }, { status: 400 });
  }

  const result = completeAdmin2faLoginByPhone(challengeToken, smsCode);
  if (!result.ok) {
    const map = {
      not_found: "Сессия подтверждения не найдена. Войдите заново",
      expired: "Коды истекли. Запросите вход снова",
      max_attempts: "Слишком много неверных попыток. Войдите заново",
      invalid_codes: "Неверный код из звонка"
    } as const;
    return NextResponse.json({ error: map[result.reason] }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, email: result.email });
  response.cookies.set(ADMIN_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(result.expiresAt)
  });
  return response;
}
