import {
  adminVerifyPasswordFor2fa,
  issueAdmin2faChallengeWithCodes,
  persistAdminPhoneIfNeeded,
  resolveAdminPhoneFromEnv
} from "@/lib/admin-db";
import { generateOtpDigits, USE_FIXED_OTP_EVERYWHERE, FIXED_OTP_DIGITS } from "@/lib/fixed-otp";
import { isSmsProviderReal, requestSmsRuCallCode } from "@/lib/sms-sender";
import { normalizePhone } from "@/lib/contacts-db";
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

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
        ? "Неверный email — пользователь с таким адресом не найден"
        : check.reason === "wrong_password"
          ? "Неверный пароль"
          : check.reason === "invalid_phone"
            ? "Телефон должен быть в формате 79XXXXXXXXX"
            : "Неверный телефон для этого администратора";
    return NextResponse.json({ error }, { status: 401 });
  }

  let phone = normalizePhone(check.phone);
  if (!phone || phone.length !== 11 || !phone.startsWith("7")) {
    phone = resolveAdminPhoneFromEnv();
    if (phone) {
      persistAdminPhoneIfNeeded(check.adminUserId, phone);
    }
  }
  if (!phone || phone.length !== 11 || !phone.startsWith("7")) {
    return NextResponse.json(
      {
        error:
          "Не удаётся отправить код по SMS: в настройках сервера нет номера. Добавьте ADMIN_PHONE=79XXXXXXXXX или ORDER_NOTIFY_PHONES с вашим номером и выполните деплой / перезапуск PM2."
      },
      { status: 503 }
    );
  }

  const isProd = process.env.NODE_ENV === "production";
  const allowSmsMock =
    process.env.ADMIN_2FA_ALLOW_SMS_MOCK === "1" || process.env.ADMIN_2FA_ALLOW_SMS_MOCK === "true";
  if (isProd && !isSmsProviderReal() && !allowSmsMock) {
    return NextResponse.json(
      {
        error:
          "Не настроена отправка звонка/SMS (в production нужен реальный SMS_PROVIDER). Временно для отладки можно задать ADMIN_2FA_ALLOW_SMS_MOCK=1."
      },
      { status: 503 }
    );
  }

  // Телефонный код: подтверждение звонком (последние 4 цифры номера, который позвонит)
  const call = await requestSmsRuCallCode(phone, "-1");
  if (!call.ok) {
    return NextResponse.json({ error: `Звонок: ${call.error}` }, { status: 503 });
  }

  // emailCode сохраняется как техполе совместимости, фактически не проверяется
  const emailCode = generateOtpDigits(4);
  const challengeToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(challengeToken.toLowerCase()).digest("hex");
  const challenge = issueAdmin2faChallengeWithCodes(check.adminUserId, tokenHash, challengeToken, emailCode, call.code);

  return NextResponse.json({
    requires2fa: true,
    challengeToken: challenge.challengeToken,
    ...(USE_FIXED_OTP_EVERYWHERE
      ? {
          twoFactorHint: `Введите ${FIXED_OTP_DIGITS} в поле кода звонка (фиксированный OTP, см. lib/fixed-otp.ts).`
        }
      : {})
  });
}
