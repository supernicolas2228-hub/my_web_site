import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Message = { role: "user" | "assistant"; text: string };

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

  const system =
    "Ты AI-консультант веб-студии TrueWeb. Кратко и по делу отвечай по-русски, помогай сформировать ТЗ и оценивай стоимость проекта в рублях.";
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
      temperature: 0.4
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

