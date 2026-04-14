import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { adminVerifyPasswordFor2fa, createAdminSession } from "@/lib/admin-db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: string; password?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const email = body.email?.trim() || "";
  const password = body.password?.trim() || "";
  const phoneInput = body.phone?.trim() || "";
  if (!email || !password || !phoneInput) {
    return NextResponse.json(
      {
        error:
          !email && !password && !phoneInput
            ? "Укажите email, пароль и телефон"
            : !email
              ? "Укажите email"
              : !password
                ? "Укажите пароль"
                : "Укажите телефон"
      },
      { status: 400 }
    );
  }

  const check = adminVerifyPasswordFor2fa(email, password, phoneInput);
  if (!check.ok) {
    const error =
      check.reason === "unknown_email"
        ? "Неверные данные для входа"
        : check.reason === "wrong_password"
          ? "Неверные данные для входа"
          : "Неверные данные для входа";
    return NextResponse.json({ error }, { status: 401 });
  }

  const session = createAdminSession(check.adminUserId);
  const response = NextResponse.json({ ok: true, email: check.email });
  response.cookies.set(ADMIN_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt)
  });
  return response;
}
