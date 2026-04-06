"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

type ChatMessage = { role: "user" | "assistant"; text: string };

function isPayCommand(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (t === "оплатить") return true;
  return /^оплатить[.!?…]*$/i.test(text.trim());
}

export default function AiChatPage() {
  const { addCustomQuote } = useCart();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Здравствуйте! 👋 Я ИИ-консультант TrueWeb — помогаю с расчётом стоимости сайта или бота 💰\n\nНапишите, что вы хотите на сайте (или какой нужен Telegram-бот), и я подскажу ориентировочную цену в рублях ✨ Можно коротко: ниша, количество страниц, нужен ли магазин, формы, бот и т.д.\n\nКогда согласуем сумму, для оплаты напишите в чат слово «оплатить» — в корзину добавится позиция с этой суммой 🛒"
    }
  ]);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    const next = [...messages, { role: "user" as const, text: prompt }];
    setMessages(next);
    setInput("");
    setLoading(true);

    if (isPayCommand(prompt)) {
      try {
        const res = await fetch("/api/ai/parse-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next })
        });
        const data = (await res.json()) as {
          title?: string;
          amountRub?: number;
          summary?: string;
          error?: string;
        };
        const rub = data.amountRub;
        const quoteTitle = typeof data.title === "string" ? data.title.trim() : "";
        if (!res.ok || typeof rub !== "number" || !quoteTitle) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: data.error || "Не удалось добавить оплату в корзину. Уточните в переписке итоговую сумму и снова напишите «оплатить»."
            }
          ]);
          return;
        }
        addCustomQuote({
          title: quoteTitle,
          amountRub: rub,
          summary: data.summary || "Заказ из ИИ-чата TrueWeb."
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Готово! 🛒 В корзину добавлено: «${quoteTitle}» — ${rub.toLocaleString("ru-RU")} ₽.\n\nОткройте корзину и нажмите «Оплатить» 💳 Если сумма не та — напишите в чат уточнение и снова «оплатить».`
          }
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Ошибка сети при добавлении в корзину. Попробуйте ещё раз." }
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

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
        <div className="glass-card rounded-2xl p-5 text-black dark:text-white sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-black dark:text-white">Расчёт с ИИ</h1>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/cart"
                className="rounded-lg border border-black/20 bg-black/5 px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-black/10 dark:border-indigo-400/50 dark:bg-indigo-500/15 dark:text-white dark:hover:bg-indigo-500/25"
              >
                Корзина
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-black/20 px-3 py-1.5 text-sm text-black/85 transition hover:bg-black/5 dark:border-white/25 dark:text-white dark:opacity-85 dark:hover:bg-white/10"
              >
                На главную
              </Link>
            </div>
          </div>

          <div className="h-[55vh] space-y-3 overflow-y-auto rounded-xl border border-white/20 bg-white/5 p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[92%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm sm:max-w-[85%] ${
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
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Опишите проект или напишите «оплатить» после согласования суммы"
              className="w-full rounded-xl border border-black/20 bg-transparent px-3 py-2 text-black outline-none placeholder:text-black/45 focus:border-indigo-500 dark:border-white/25 dark:text-white dark:placeholder:text-white/45"
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
          <p className="mt-2 text-xs text-black/65 dark:opacity-70">
            Ответы ИИ с учётом цен минимальных пакетов TrueWeb. Слово «оплатить» добавляет в корзину позицию по
            переписке; банк списывает сумму через ЮKassa. Точная смета по договору — после ТЗ.
          </p>
        </div>
      </div>
    </main>
  );
}
