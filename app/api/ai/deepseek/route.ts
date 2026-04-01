import { buildPricingBriefForAi } from "@/lib/ai-pricing-brief";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Message = { role: "user" | "assistant"; text: string };

function buildSystemPrompt(): string {
  const pricing = buildPricingBriefForAi();
  return `Ты дружелюбный AI-консультант веб-студии TrueWeb (truewebwork.ru). Твоя задача — помогать клиентам по-русски с расчётом ориентировочной стоимости сайта или Telegram-бота.

ОБЯЗАТЕЛЬНО используй в каждом ответе несколько уместных эмодзи (1–4 штуки): приветствие, акценты, итог — чтобы текст был живым, но не перегружай ими каждую строку.

Ниже — актуальные цены МИНИМАЛЬНЫХ пакетов с сайта TrueWeb (в рублях). Это официальные ориентиры: опирайся на них, когда клиент спрашивает «сколько стоит» базовый вариант. Если запрос сложнее (много страниц, уникальный дизайн, интеграции, CRM, магазин и т.д.) — честно скажи, что итог выше минимума и дай разумный диапазон или «от N ₽», объясни из чего сложится цена.

${pricing}

Правила ответов:
— Пиши кратко, по делу, без воды; при необходимости списком.
— Цены называй в рублях (₽), форматируй крупные числа как на сайте (например 14 990 ₽).
— Если не хватает данных — задай 1–2 уточняющих вопроса.
— Не выдумывай другие цены и скидки: только логика вокруг указанных пакетов + обоснованная надбавка за доп. работы.
— Не обещай точный договор без ТЗ; формулировки вроде «ориентировочно», «минимальный пакет на сайте стоит …».
— Студия: TrueWeb, разработка сайтов и ботов под ключ.

ОПЛАТА ИЗ ЧАТА:
Если в ответе ты называешь конкретную сумму, итог «в районе X ₽», согласованный диапазон с понятным итогом или явно фиксируешь стоимость с клиентом — в САМОМ КОНЦЕ сообщения отдельным коротким абзацем добавь дословно смысл:
💳 Чтобы перейти к оплате этой сметы, напишите в чат одно слово: оплатить
(Клиенту добавится позиция в корзину по переписке; итог уточняется при оформлении.)`;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { messages?: Message[] } | null;
  const messages = Array.isArray(body?.messages) ? body!.messages : [];

  if (!messages.length) {
    return NextResponse.json({ error: "Пустой запрос." }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "DeepSeek ещё не подключён. Добавьте DEEPSEEK_API_KEY в .env." },
      { status: 503 }
    );
  }

  const system = buildSystemPrompt();
  const upstreamMessages = [
    { role: "system", content: system },
    ...messages.map((m) => ({ role: m.role, content: m.text }))
  ];

  const resp = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: upstreamMessages,
      temperature: 0.55,
      max_tokens: 1200
    })
  });

  const data = (await resp.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
    | null;

  if (!resp.ok) {
    return NextResponse.json(
      { error: data?.error?.message || "Ошибка DeepSeek API." },
      { status: resp.status || 502 }
    );
  }

  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    return NextResponse.json({ error: "Пустой ответ от DeepSeek." }, { status: 502 });
  }

  return NextResponse.json({ answer });
}

