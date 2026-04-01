import { isChallengeEmailInFlight } from "@/lib/challenge-email-delivery";
import { rotateContactChallengeEmailCode } from "@/lib/contacts-db";
import { sendEmailMessage } from "@/lib/email-sender";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { challengeToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const challengeToken = (body.challengeToken || "").trim();
  if (!challengeToken) {
    return NextResponse.json({ error: "Нет challengeToken" }, { status: 400 });
  }

  if (isChallengeEmailInFlight(challengeToken)) {
    return NextResponse.json(
      {
        error:
          "Первая отправка письма ещё идёт (до ~2 мин). Подождите и проверьте «Спам», затем нажмите снова."
      },
      { status: 409 }
    );
  }

  const rotated = rotateContactChallengeEmailCode(challengeToken);
  if (!rotated.ok) {
    if (rotated.error === "cooldown") {
      return NextResponse.json(
        { error: `Подождите ${rotated.retryAfterSec ?? 45} с перед следующей отправкой.` },
        { status: 429 }
      );
    }
    if (rotated.error === "expired") {
      return NextResponse.json({ error: "Сессия истекла. Запросите коды заново." }, { status: 410 });
    }
    return NextResponse.json({ error: "Запрос не найден. Запросите коды заново." }, { status: 404 });
  }

  const text = `Код подтверждения TrueWeb: ${rotated.emailCode}\n\nКод действителен 15 минут. Если вы не запрашивали код, проигнорируйте письмо.`;
  const emailResult = await sendEmailMessage(rotated.email, "Код подтверждения TrueWeb", text);
  if (!emailResult.ok) {
    return NextResponse.json({ error: `Email: ${emailResult.error}` }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
