import {
  adminVerifyPasswordFor2fa,
  deleteAdmin2faChallengesForUser,
  isAdmin2faSkipDelivery,
  issueAdmin2faChallengeWithCodes,
  persistAdminPhoneIfNeeded,
  resolveAdminPhoneFromEnv
} from "@/lib/admin-db";
import { generateOtpDigits, USE_FIXED_OTP_EVERYWHERE, FIXED_OTP_DIGITS } from "@/lib/fixed-otp";
import { isSmtpConfigured, sendEmailMessage } from "@/lib/email-sender";
import { isSmsProviderReal, requestSmsRuCallCode } from "@/lib/sms-sender";
import { normalizePhone } from "@/lib/contacts-db";
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const email = body.email?.trim() || "";
  const password = body.password?.trim() || "";
  if (!email || !password) {
    return NextResponse.json(
      { error: !email && !password ? "Укажите email и пароль" : !email ? "Укажите email" : "Укажите пароль" },
      { status: 400 }
    );
  }

  const check = adminVerifyPasswordFor2fa(email, password);
  if (!check.ok) {
    const error =
      check.reason === "unknown_email"
        ? "Неверный email — пользователь с таким адресом не найден"
        : "Неверный пароль";
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
  const skipDelivery = isAdmin2faSkipDelivery();
  const allowSmsMock =
    process.env.ADMIN_2FA_ALLOW_SMS_MOCK === "1" || process.env.ADMIN_2FA_ALLOW_SMS_MOCK === "true";
  const allowEmailMock =
    process.env.ADMIN_2FA_ALLOW_EMAIL_MOCK === "1" || process.env.ADMIN_2FA_ALLOW_EMAIL_MOCK === "true";

  if (!skipDelivery) {
    if (isProd && !isSmtpConfigured() && !allowEmailMock) {
      return NextResponse.json(
        {
          error:
            "Не настроена почта для кода входа (SMTP). Настройте SMTP или временно ADMIN_2FA_ALLOW_EMAIL_MOCK=1 — код из письма будет в логах PM2."
        },
        { status: 503 }
      );
    }
    if (isProd && !isSmsProviderReal() && !allowSmsMock) {
      return NextResponse.json(
        {
          error:
            "Не настроена отправка SMS (в production нужен реальный SMS_PROVIDER). Временно для отладки можно задать ADMIN_2FA_ALLOW_SMS_MOCK=1 — код SMS будет только в логах PM2."
        },
        { status: 503 }
      );
    }
  }

  // Телефонный код: подтверждение звонком (последние 4 цифры номера, который позвонит)
  const call = await requestSmsRuCallCode(phone, "-1");
  if (!call.ok) {
    return NextResponse.json({ error: `Звонок: ${call.error}` }, { status: 503 });
  }

  // Email-код: 4 цифры
  const emailCode = generateOtpDigits(4);
  const challengeToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(challengeToken.toLowerCase()).digest("hex");
  const challenge = issueAdmin2faChallengeWithCodes(check.adminUserId, tokenHash, challengeToken, emailCode, call.code);

  if (!skipDelivery) {
    const emailBody = `Ваш код для входа в админ-панель: ${challenge.emailCode}\n\nКод действителен 10 минут. Если это не вы, смените пароль.`;
    const emailResult = await sendEmailMessage(check.email, "Код входа в админку", emailBody);
    if (!emailResult.ok) {
      deleteAdmin2faChallengesForUser(check.adminUserId);
      return NextResponse.json(
        { error: `Не удалось отправить код на email: ${emailResult.error}` },
        { status: 503 }
      );
    }

  }

  return NextResponse.json({
    requires2fa: true,
    challengeToken: challenge.challengeToken,
    emailHint: check.email.replace(/(^.).*(@.*$)/, "$1***$2"),
    ...(USE_FIXED_OTP_EVERYWHERE
      ? {
          twoFactorHint: `Введите ${FIXED_OTP_DIGITS} в оба поля (сейчас везде фиксированный код, см. lib/fixed-otp.ts).`
        }
      : {})
  });
}
