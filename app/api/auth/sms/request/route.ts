import {
  isValidEmail,
  isValidPhone,
  normalizePhone,
  requestVerificationCodeWithKnownCode,
  upsertContact
} from "@/lib/contacts-db";
import { generateOtpDigits } from "@/lib/fixed-otp";
import { requestSmsRuCallCode } from "@/lib/sms-sender";
import { sendSmsCode } from "@/lib/sms-sender";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  phone?: string;
  email?: string;
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = body.phone?.trim() || "";
  const email = body.email?.trim() || "";
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "Укажите корректный номер телефона" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
  }

  upsertContact(phone, email);
  const normalizedPhone = normalizePhone(phone);
  const call = await requestSmsRuCallCode(normalizedPhone, "-1");
  const code = call.ok ? call.code : generateOtpDigits(4);
  const hint = call.ok
    ? "Сейчас вам поступит звонок. Введите последние 4 цифры номера, который позвонит."
    : "Звонок не прошел. Мы отправили SMS с 4-значным кодом подтверждения.";
  if (!call.ok) {
    const smsFallback = await sendSmsCode(normalizedPhone, code);
    if (!smsFallback.ok) {
      return NextResponse.json(
        {
          error: `Не удалось отправить код ни звонком, ни SMS. Звонок: ${call.error}. SMS: ${smsFallback.error}`
        },
        { status: 503 }
      );
    }
  }

  const stored = requestVerificationCodeWithKnownCode(phone, code);
  if (!stored.ok) {
    if ("waitSeconds" in stored) {
      return NextResponse.json({ error: `Повторная попытка доступна через ${stored.waitSeconds} сек.` }, { status: 429 });
    }
    return NextResponse.json({ error: "Не удалось сохранить код подтверждения" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    expiresAt: stored.expiresAt,
    hint
  });
}

