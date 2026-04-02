import { isValidPhone, normalizePhone, startContactPhoneOnlyRegistrationWithKnownSmsCode } from "@/lib/contacts-db";
import { generateOtpDigits } from "@/lib/fixed-otp";
import { requestSmsRuCallCode } from "@/lib/sms-sender";
import { sendSmsCode } from "@/lib/sms-sender";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const phone = (body.phone || "").trim();
  if (!phone) {
    return NextResponse.json({ error: "Укажите телефон" }, { status: 400 });
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "Укажите полный номер в формате +7 (___) ___-__-__" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);
  const call = await requestSmsRuCallCode(normalizedPhone, "-1");
  const code = call.ok ? call.code : generateOtpDigits(4);
  const smsHint = call.ok
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

  const started = startContactPhoneOnlyRegistrationWithKnownSmsCode(phone, code);
  if (!started.ok) {
    return NextResponse.json({ error: "Не удалось создать профиль" }, { status: 500 });
  }

  return NextResponse.json({
    challengeToken: started.challengeToken,
    smsHint
  });
}

