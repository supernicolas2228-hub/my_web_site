"use client";

import { formatRuPhoneMask, isValidPhone } from "@/lib/phone-normalize";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type MeContact = {
  id: number;
  phone: string;
  email: string;
  phone_verified: boolean;
  email_verified: boolean;
};

type ChatMessage = {
  id: number;
  channel: string;
  direction: string;
  message_text: string;
  status: string;
  created_at: string;
};

function channelLabel(ch: string) {
  if (ch === "email") return "Email";
  if (ch === "sms") return "SMS";
  return "Чат";
}

export default function AccountClient() {
  const [phase, setPhase] = useState<"check" | "login" | "codes" | "chat">("check");
  const [phone, setPhone] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [smsHint, setSmsHint] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState("");
  const [me, setMe] = useState<MeContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const readApiError = async (res: Response, fallback: string) => {
    const raw = await res.text();
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      return parsed.error || fallback;
    } catch {
      return `${fallback} (код ${res.status})`;
    }
  };

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/account/me");
    if (res.ok) {
      const data = (await res.json()) as { contact: MeContact };
      setMe(data.contact);
      setPhase("chat");
      return true;
    }
    setMe(null);
    return false;
  }, []);

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/account/messages");
    if (!res.ok) return;
    const data = (await res.json()) as { messages: ChatMessage[] };
    setMessages(data.messages || []);
  }, []);

  useEffect(() => {
    void (async () => {
      const ok = await loadMe();
      if (!ok) setPhase("login");
    })();
  }, [loadMe]);

  useEffect(() => {
    if (phase !== "chat") return;
    void loadMessages();
  }, [phase, loadMessages]);

  useEffect(() => {
    if (phase !== "chat") return;
    const t = setInterval(() => void loadMessages(), 10000);
    return () => clearInterval(t);
  }, [phase, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    let timeout: ReturnType<typeof setTimeout> | null = null;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch("/api/account/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
        signal: controller.signal
      });
      if (!res.ok) {
        setError(await readApiError(res, "Не удалось отправить коды"));
        return;
      }
      const data = (await res.json()) as { error?: string; challengeToken?: string; smsHint?: string };
      if (data.challengeToken) {
        setChallengeToken(data.challengeToken);
        setSmsHint(data.smsHint || null);
        setPhase("codes");
        setSmsCode("");
      }
    } catch {
      setError("Сервис звонков долго отвечает. Попробуйте еще раз.");
    } finally {
      if (timeout) clearTimeout(timeout);
      setLoading(false);
    }
  };

  const verifyCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, smsCode })
      });
      if (!res.ok) {
        setError(await readApiError(res, "Не удалось выполнить вход"));
        return;
      }
      await loadMe();
      await loadMessages();
      setPhase("chat");
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!res.ok) {
        setError(await readApiError(res, "Не удалось отправить сообщение"));
        return;
      }
      setDraft("");
      await loadMessages();
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/account/logout", { method: "POST" });
    setMe(null);
    setMessages([]);
    setChallengeToken(null);
    setPhase("login");
  };

  if (phase === "check") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 pt-24">
        <p className="text-sm opacity-70">Загрузка…</p>
      </main>
    );
  }

  if (phase === "login") {
    return (
      <main className="min-h-screen px-4 pb-24 pt-24">
        <div className="site-container mx-auto max-w-md">
          <div className="glass-card rounded-2xl p-6">
            <h1 className="text-2xl font-bold">Личный кабинет</h1>
            <p className="mt-2 text-sm opacity-75">
              Чат с менеджером. Введите телефон, как при заказе. Для входа нужен только код из звонка.
            </p>
            <form onSubmit={startLogin} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block opacity-80">Телефон</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatRuPhoneMask(e.target.value))}
                  required
                  placeholder="+7 (999) 123-45-67"
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                />
              </label>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !isValidPhone(phone)}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Запрашиваем звонок…" : "Получить код по звонку"}
              </button>
            </form>
            <p className="mt-4 text-center text-xs opacity-60">
              <Link href="/" className="underline hover:opacity-100">
                На главную
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "codes") {
    return (
      <main className="min-h-screen px-4 pb-24 pt-24">
        <div className="site-container mx-auto max-w-md">
          <div className="glass-card rounded-2xl p-6">
            <h1 className="text-2xl font-bold">Подтверждение</h1>
            <p className="mt-2 text-sm opacity-75">
              {smsHint ? smsHint : "Сейчас вам поступит звонок. Введите последние 4 цифры номера, который позвонит."}
            </p>
            <form onSubmit={verifyCodes} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block opacity-80">Код из звонка</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  required
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 font-mono text-lg tracking-widest outline-none focus:border-indigo-400"
                />
              </label>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || smsCode.length < 4}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Входим…" : "Войти"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase("login");
                  setChallengeToken(null);
                  setError(null);
                }}
                className="w-full rounded-lg border border-white/25 py-2 text-sm opacity-80 hover:bg-white/10"
              >
                Назад
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col px-2 pb-4 pt-20 sm:px-4">
      <div className="site-container mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-2xl border border-white/15 bg-black/20 shadow-xl backdrop-blur-md">
        <header className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold">Чат с TrueWeb</h1>
            {me && (
              <p className="text-xs opacity-65">
                +{me.phone} · {me.email}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/" className="rounded-lg border border-white/25 px-3 py-1.5 text-xs hover:bg-white/10">
              На сайт
            </Link>
            <button type="button" onClick={() => void logout()} className="rounded-lg border border-white/25 px-3 py-1.5 text-xs hover:bg-white/10">
              Выйти
            </button>
          </div>
        </header>

        {error && <p className="flex-shrink-0 px-4 py-2 text-sm text-red-400">{error}</p>}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {messages.length === 0 && <p className="text-center text-sm opacity-50">Пока нет сообщений</p>}
          {messages.map((m) => {
            const fromMe = m.direction === "inbound";
            return (
              <div key={m.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[min(100%,22rem)] rounded-2xl px-3 py-2 text-sm ${
                    fromMe
                      ? "rounded-tr-sm bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white"
                      : "rounded-tl-sm border border-white/15 bg-white/10"
                  }`}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
                    {fromMe ? "Вы" : "Менеджер"} · {channelLabel(m.channel)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{m.message_text}</p>
                  <p className="mt-1 text-[10px] opacity-60">{new Date(m.created_at).toLocaleString("ru-RU")}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex-shrink-0 border-t border-white/10 p-3">
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="Напишите сообщение…"
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button
              type="button"
              disabled={loading || !draft.trim()}
              onClick={() => void sendMessage()}
              className="self-end rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
