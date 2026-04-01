import { rotateAdminChallengeEmailCode } from "@/lib/admin-db";
import { isAdmin2faEmailInFlight } from "@/lib/challenge-email-delivery";
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

  if (isAdmin2faEmailInFlight(challengeToken)) {
    return NextResponse.json(
      {
        error:
          "Первая отправка письма ещё идёт (до ~2 мин). Подождите и проверьте «Спам», затем нажмите снова."
      },
      { status: 409 }
    );
  }

  const rotated = rotateAdminChallengeEmailCode(challengeToken);
  if (!rotated.ok) {
    if (rotated.error === "cooldown") {
      return NextResponse.json(
        { error: `Подождите ${rotated.retryAfterSec ?? 45} с перед следующей отправкой.` },
        { status: 429 }
      );
    }
    if (rotated.error === "expired") {
      return NextResponse.json({ error: "Сессия подтверждения истекла. Введите пароль заново." }, { status: 410 });
    }
    return NextResponse.json({ error: "Запрос не найден. Введите пароль заново." }, { status: 404 });
  }

  const text = `Ваш код для входа в админ-панель: ${rotated.emailCode}\n\nКод действителен 10 минут. Если это не вы, смените пароль.`;
  const emailResult = await sendEmailMessage(rotated.email, "Код входа в админку", text);
  if (!emailResult.ok) {
    return NextResponse.json({ error: `Не удалось отправить код на email: ${emailResult.error}` }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
