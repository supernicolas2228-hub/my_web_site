"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tw_signup_prompt_v1";

export default function SignupPrompt() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"form" | "codes">("form");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [smsHint, setSmsHint] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "dismissed") return;
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const start = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email })
      });
      const data = (await res.json()) as {
        error?: string;
        challengeToken?: string;
        emailHint?: string;
        smsHint?: string;
      };
      if (!res.ok) {
        setError(data.error || "Не удалось начать регистрацию");
        return;
      }
      if (!data.challengeToken) {
        setError("Неожиданный ответ сервера");
        return;
      }
      setChallengeToken(data.challengeToken);
      setEmailHint(data.emailHint || null);
      setSmsHint(data.smsHint || null);
      setPhase("codes");
      setSmsCode("");
      setEmailCode("");
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!challengeToken) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, smsCode, emailCode })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Не удалось подтвердить");
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, "dismissed");
      } catch {
        /* ignore */
      }
      setOpen(false);
      window.location.assign("/account");
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center"
      onClick={dismiss}
    >
      <div className="glass-card w-full max-w-lg rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Создать аккаунт?</h2>
            <p className="mt-1 text-sm opacity-80">
              Аккаунт нужен, чтобы видеть переписку и статус заказа в личном кабинете.
            </p>
          </div>
        </div>

        {phase === "form" ? (
          <div className="mt-5 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">Телефон</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="79XXXXXXXXX"
                className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
              />
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={() => void start()}
              disabled={loading || !phone.trim() || !email.trim()}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Отправляем…" : "Продолжить"}
            </button>
            <button
              onClick={dismiss}
              className="w-full rounded-lg border border-white/25 py-2 text-sm opacity-80 hover:bg-white/10"
            >
              Не сейчас
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-sm opacity-80">
              {smsHint || "Сейчас вам поступит звонок. Введите последние 4 цифры номера, который позвонит."}
              <br />
              Код из письма придёт на {emailHint || "ваш email"}.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block opacity-80">Код из звонка</span>
                <input
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="0000"
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 font-mono text-lg tracking-widest outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block opacity-80">Код из email</span>
                <input
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="0000"
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 font-mono text-lg tracking-widest outline-none focus:border-indigo-400"
                />
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={() => void verify()}
              disabled={loading || smsCode.length < 4 || emailCode.length < 4}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Проверяем…" : "Создать аккаунт"}
            </button>
            <button
              onClick={dismiss}
              className="w-full rounded-lg border border-white/25 py-2 text-sm opacity-80 hover:bg-white/10"
            >
              Отказаться
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

