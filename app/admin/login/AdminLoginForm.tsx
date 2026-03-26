"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const ADMIN_2FA_STORAGE = "admin_2fa_pending";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"password" | "2fa">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [twoFactorHint, setTwoFactorHint] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ADMIN_2FA_STORAGE);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        challengeToken?: string;
        emailHint?: string;
        twoFactorHint?: string;
        savedAt?: number;
      };
      if (!parsed.challengeToken || typeof parsed.savedAt !== "number") {
        sessionStorage.removeItem(ADMIN_2FA_STORAGE);
        return;
      }
      if (Date.now() - parsed.savedAt > 12 * 60 * 1000) {
        sessionStorage.removeItem(ADMIN_2FA_STORAGE);
        return;
      }
      setChallengeToken(parsed.challengeToken);
      setEmailHint(parsed.emailHint ?? null);
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
    setEmailHint(null);
    setTwoFactorHint(null);
    setEmailCode("");
    setSmsCode("");
    setError(null);
  };

  const onSubmitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = (await res.json()) as {
        error?: string;
        requires2fa?: boolean;
        challengeToken?: string;
        emailHint?: string;
        twoFactorHint?: string;
      };
      if (!res.ok) {
        setError(data.error || "Ошибка входа");
        return;
      }
      if (data.requires2fa && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        setEmailHint(data.emailHint || null);
        setTwoFactorHint(data.twoFactorHint || null);
        try {
          sessionStorage.setItem(
            ADMIN_2FA_STORAGE,
            JSON.stringify({
              challengeToken: data.challengeToken,
              emailHint: data.emailHint ?? null,
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
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit2fa = async (event: FormEvent) => {
    event.preventDefault();
    if (!challengeToken) {
      setError("Сессия подтверждения сброшена (например, после обновления страницы). Введите пароль ещё раз.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, emailCode, smsCode })
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
              <p className="mt-2 text-sm opacity-75">
                Сначала email и пароль администратора, затем коды на почту и в SMS (двухфакторный вход).
              </p>
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
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs opacity-80">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded border-white/30"
                    />
                    Показать пароль
                  </label>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
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
                  <>
                    Введите 4-значные коды из письма на{" "}
                    <span className="font-medium opacity-90">{emailHint || "ваш email"}</span> и из SMS на номер,
                    который задан для входа в админку (или первый номер из списка уведомлений о заказах).
                  </>
                )}
              </p>
              <form onSubmit={onSubmit2fa} className="mt-6 space-y-4">
                <label className="block text-sm">
                  <span className="mb-1 block opacity-80">Код из email</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    required
                    placeholder="000000"
                    className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 font-mono text-lg tracking-widest outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block opacity-80">Код из SMS</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    required
                    placeholder="000000"
                    className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 font-mono text-lg tracking-widest outline-none focus:border-indigo-400"
                  />
                </label>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || emailCode.length < 4 || smsCode.length < 4}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
                >
                  {loading ? "Входим…" : "Войти"}
                </button>
                <button
                  type="button"
                  onClick={logoutToStep1}
                  className="w-full rounded-lg border border-white/25 py-2 text-sm opacity-80 hover:bg-white/10"
                >
                  Назад к паролю
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
