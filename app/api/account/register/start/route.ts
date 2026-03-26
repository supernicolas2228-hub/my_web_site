import { startContactRegistrationWithKnownSmsCode } from "@/lib/contacts-db";
import { sendEmailMessage } from "@/lib/email-sender";
import { requestSmsRuCallCode } from "@/lib/sms-sender";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { phone?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();
  if (!phone || !email) {
    return NextResponse.json({ error: "Укажите телефон и email" }, { status: 400 });
  }

  const call = await requestSmsRuCallCode(phone.replace(/\D/g, ""), "-1");
  if (!call.ok) {
    return NextResponse.json({ error: `Звонок: ${call.error}` }, { status: 503 });
  }

  const started = startContactRegistrationWithKnownSmsCode(phone, email, call.code);
  if (!started.ok) {
    return NextResponse.json({ error: "Не удалось создать профиль" }, { status: 500 });
  }

  const emailBody = `Код для подтверждения email на TrueWeb: ${started.emailCode}\n\nКод действителен 15 минут.`;
  const emailResult = await sendEmailMessage(started.email, "Подтверждение email", emailBody);
  if (!emailResult.ok) {
    return NextResponse.json({ error: `Email: ${emailResult.error}` }, { status: 503 });
  }

  const emailHint = started.email.replace(/(^.).*(@.*$)/, "$1***$2");
  return NextResponse.json({
    challengeToken: started.challengeToken,
    emailHint,
    smsHint: "Сейчас вам поступит звонок. Введите последние 4 цифры номера, который позвонит."
  });
}

