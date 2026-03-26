"use client";

import Link from "next/link";
import { useState } from "react";

type ChatMessage = { role: "user" | "assistant"; text: string };

export default function AiChatPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Привет! Я AI-консультант TrueWeb. Опишите проект, и я помогу с оценкой сроков и стоимости."
    }
  ]);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    const next = [...messages, { role: "user" as const, text: prompt }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok || !data.answer) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.error || "Не удалось получить ответ от ИИ." }
        ]);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer as string }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Ошибка сети при обращении к ИИ." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen px-3 pb-10 pt-24 sm:px-4">
      <div className="site-container max-w-4xl">
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">AI-чат по расчёту сайта</h1>
            <Link
              href="/"
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm opacity-85 transition hover:bg-white/10"
            >
              На главную
            </Link>
          </div>

          <div className="h-[55vh] space-y-3 overflow-y-auto rounded-xl border border-white/20 bg-white/5 p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[92%] rounded-xl px-3 py-2 text-sm sm:max-w-[85%] ${
                  m.role === "user"
                    ? "ml-auto bg-indigo-500/30 text-slate-900 dark:text-white"
                    : "mr-auto bg-white/15 text-slate-900 dark:text-white"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && <p className="text-sm opacity-70">ИИ думает...</p>}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Например: нужен сайт для клиники на 10 страниц..."
              className="w-full rounded-xl border border-white/25 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              Отправить
            </button>
          </div>
          <p className="mt-2 text-xs opacity-70">
            После того как вы дадите токен DeepSeek, чат будет отвечать реальными ответами модели.
          </p>
        </div>
      </div>
    </main>
  );
}

