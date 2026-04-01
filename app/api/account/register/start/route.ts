import { isValidPhone, normalizePhone, startContactPhoneOnlyRegistrationWithKnownSmsCode } from "@/lib/contacts-db";
import { requestSmsRuCallCode } from "@/lib/sms-sender";
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

  const call = await requestSmsRuCallCode(normalizePhone(phone), "-1");
  if (!call.ok) {
    return NextResponse.json({ error: `Звонок: ${call.error}` }, { status: 503 });
  }

  const started = startContactPhoneOnlyRegistrationWithKnownSmsCode(phone, call.code);
  if (!started.ok) {
    return NextResponse.json({ error: "Не удалось создать профиль" }, { status: 500 });
  }

  return NextResponse.json({
    challengeToken: started.challengeToken,
    smsHint: "Сейчас вам поступит звонок. Введите последние 4 цифры номера, который позвонит."
  });
}

