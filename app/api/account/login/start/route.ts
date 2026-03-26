import {
  deleteContactLoginChallengesForContact,
  startContactCabinetLoginWithKnownSmsCode
} from "@/lib/contacts-db";
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

  // Сначала получаем 4 цифры для подтверждения звонком (они же будут проверяться на шаге verify)
  const call = await requestSmsRuCallCode(phone.replace(/\D/g, ""), "-1");
  if (!call.ok) {
    return NextResponse.json({ error: `Звонок: ${call.error}` }, { status: 503 });
  }

  const started = startContactCabinetLoginWithKnownSmsCode(phone, email, call.code);
  if (!started.ok) {
    if (started.error === "email_mismatch") {
      return NextResponse.json(
        { error: "Этот email не совпадает с данными заказа для указанного телефона" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error:
          "Профиль не найден. Сначала оформите заказ на сайте и укажите тот же телефон и email, что в корзине."
      },
      { status: 404 }
    );
  }

  const emailBody = `Код для входа в личный кабинет TrueWeb: ${started.emailCode}\n\nКод действителен 15 минут.`;
  const emailResult = await sendEmailMessage(started.email, "Код входа в личный кабинет", emailBody);
  if (!emailResult.ok) {
    deleteContactLoginChallengesForContact(started.contactId);
    return NextResponse.json({ error: `Email: ${emailResult.error}` }, { status: 503 });
  }

  const emailHint = started.email.replace(/(^.).*(@.*$)/, "$1***$2");
  return NextResponse.json({
    challengeToken: started.challengeToken,
    emailHint,
    smsHint: "Сейчас вам поступит звонок. Введите последние 4 цифры номера, который позвонит."
  });
}
