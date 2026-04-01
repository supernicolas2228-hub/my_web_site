import { CUSTOM_QUOTE_MAX_RUB, CUSTOM_QUOTE_MIN_RUB } from "@/lib/cart-lines";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; text: string };

function extractJsonObject(text: string): Record<string, unknown> | null {
  const t = text.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { messages?: ChatMessage[] } | null;
  const messages = Array.isArray(body?.messages) ? body!.messages : [];

  if (messages.length < 2) {
    return NextResponse.json({ error: "Недостаточно сообщений для разбора заказа." }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "ИИ временно недоступен." }, { status: 503 });
  }

  const transcript = messages
    .map((m) => `${m.role === "user" ? "Клиент" : "Консультант"}: ${m.text}`)
    .join("\n\n");

  const system = `Ты служебный парсер переписки TrueWeb. Клиент написал, что хочет оплатить согласованный с консультантом вариант.

По истории чата определи:
1) title — короткое название позиции для чека (до 120 символов), по сути заказа
2) amountRub — ИТОГОВУЮ сумму в рублях ЦЕЛЫМ ЧИСЛОМ: последняя явно названная консультантом цифра как «итого/примерно/ориентир». Если только диапазон без явного итога — возьми НИЖНЮЮ границу диапазона (честнее для клиента).
3) summary — одна строка (до 500 символов): что входит / договорённости

Жёсткие правила:
— amountRub только целое число от ${CUSTOM_QUOTE_MIN_RUB} до ${CUSTOM_QUOTE_MAX_RUB}.
— Если сумму нельзя однозначно извлечь, верни JSON с полем "error" (строка на русском), без title/amountRub.
— Ответь ТОЛЬКО одним JSON-объектом, без markdown и без текста вокруг. Формат успеха: {"title":"...","amountRub":12345,"summary":"..."}`;

  const resp = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: `История:\n${transcript}` }
      ],
      temperature: 0.1,
      max_tokens: 500
    })
  });

  const data = (await resp.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
    | null;

  if (!resp.ok) {
    return NextResponse.json(
      { error: data?.error?.message || "Ошибка ИИ при разборе заказа." },
      { status: resp.status >= 400 ? resp.status : 502 }
    );
  }

  const raw = data?.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    return NextResponse.json({ error: "Пустой ответ ИИ." }, { status: 502 });
  }

  const obj = extractJsonObject(raw);
  if (!obj) {
    return NextResponse.json({ error: "Не удалось разобрать ответ ИИ. Уточните сумму в чате и снова напишите «оплатить»." }, { status: 422 });
  }

  if (typeof obj.error === "string" && obj.error.trim()) {
    return NextResponse.json({ error: obj.error.trim() }, { status: 422 });
  }

  const title = typeof obj.title === "string" ? obj.title.trim().slice(0, 200) : "";
  const summary = typeof obj.summary === "string" ? obj.summary.trim().slice(0, 2000) : "";
  const amountRub = Number(obj.amountRub);

  if (!title) {
    return NextResponse.json({ error: "Не удалось определить название заказа." }, { status: 422 });
  }
  if (!Number.isInteger(amountRub) || amountRub < CUSTOM_QUOTE_MIN_RUB || amountRub > CUSTOM_QUOTE_MAX_RUB) {
    return NextResponse.json(
      {
        error: `Сумма должна быть целым числом от ${CUSTOM_QUOTE_MIN_RUB.toLocaleString("ru-RU")} до ${CUSTOM_QUOTE_MAX_RUB.toLocaleString("ru-RU")} ₽. Уточните в чате итог и снова напишите «оплатить».`
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    title,
    amountRub,
    summary: summary || "Согласование через ИИ-чат TrueWeb."
  });
}
