"use client";

import { formatRuPhoneMask, isValidPhone } from "@/lib/phone-normalize";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const ADMIN_2FA_STORAGE = "admin_2fa_pending";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"password" | "2fa">("password");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [twoFactorHint, setTwoFactorHint] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ADMIN_2FA_STORAGE);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { challengeToken?: string; twoFactorHint?: string; savedAt?: number };
      if (!parsed.challengeToken || typeof parsed.savedAt !== "number") {
        sessionStorage.removeItem(ADMIN_2FA_STORAGE);
        return;
      }
      if (Date.now() - parsed.savedAt > 12 * 60 * 1000) {
        sessionStorage.removeItem(ADMIN_2FA_STORAGE);
        return;
      }
      setChallengeToken(parsed.challengeToken);
      setTwoFactorHint(parsed.twoFactorHint ?? null);
      setStep("2fa");
    } catch {
      sessionStorage.removeItem(ADMIN_2FA_STORAGE);
    }
  }, []);

  const logoutToStep1 = () => {
    sessionStorage.removeItem(ADMIN_2FA_STORAGE);
    setStep("password");
    setChallengeToken(null);
    setTwoFactorHint(null);
    setSmsCode("");
    setError(null);
  };

  const onSubmitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    let timeout: ReturnType<typeof setTimeout> | null = null;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, phone }),
        signal: controller.signal
      });
      const data = (await res.json()) as { error?: string; requires2fa?: boolean; challengeToken?: string; twoFactorHint?: string };
      if (!res.ok) {
        setError(data.error || "Ошибка входа");
        return;
      }
      if (data.requires2fa && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        setTwoFactorHint(data.twoFactorHint || null);
        try {
          sessionStorage.setItem(
            ADMIN_2FA_STORAGE,
            JSON.stringify({
              challengeToken: data.challengeToken,
              twoFactorHint: data.twoFactorHint ?? null,
              savedAt: Date.now()
            })
          );
        } catch {
          /* private mode */
        }
        setStep("2fa");
        return;
      }
      setError("Неожиданный ответ сервера");
    } catch {
      setError("Сервис звонков долго отвечает. Попробуйте еще раз.");
    } finally {
      if (timeout) clearTimeout(timeout);
      setLoading(false);
    }
  };

  const onSubmit2fa = async (event: FormEvent) => {
    event.preventDefault();
    if (!challengeToken) {
      setError("Сессия подтверждения сброшена. Введите email, пароль и телефон заново.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, smsCode })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Ошибка подтверждения");
        return;
      }
      try {
        sessionStorage.removeItem(ADMIN_2FA_STORAGE);
      } catch {
        /* ignore */
      }
      const next = searchParams.get("next") || "/admin";
      router.push(next);
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-20">
      <div className="site-container mx-auto max-w-md">
        <div className="glass-card rounded-2xl p-6">
          {step === "password" ? (
            <>
              <h1 className="text-2xl font-bold">Вход в админку</h1>
              <p className="mt-2 text-sm opacity-75">Введите email, пароль и телефон. Подтверждение — только кодом из звонка.</p>
              <form onSubmit={onSubmitPassword} className="mt-6 space-y-4">
                <label className="block text-sm">
                  <span className="mb-1 block opacity-80">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                  />
                </label>
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
                <div className="block text-sm">
                  <span className="mb-1 block opacity-80">Пароль</span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-white/20 bg-transparent py-2 pl-3 pr-11 outline-none focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 opacity-70 hover:bg-white/10 hover:opacity-100"
                      aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !isValidPhone(phone)}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
                >
                  {loading ? "Проверяем…" : "Далее"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Подтверждение входа</h1>
              <p className="mt-2 text-sm opacity-75">
                {twoFactorHint ? (
                  <span className="font-medium text-amber-200/90">{twoFactorHint}</span>
                ) : (
                  <>Введите последние 4 цифры номера, с которого поступит звонок.</>
                )}
              </p>
              <form onSubmit={onSubmit2fa} className="mt-6 space-y-4">
                <label className="block text-sm">
                  <span className="mb-1 block opacity-80">Код из звонка</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    required
                    placeholder="0000"
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
                  onClick={logoutToStep1}
                  className="w-full rounded-lg border border-white/25 py-2 text-sm opacity-80 hover:bg-white/10"
                >
                  Назад
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
