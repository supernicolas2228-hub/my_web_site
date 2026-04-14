"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    let timeout: ReturnType<typeof setTimeout> | null = null;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, phone }),
        signal: controller.signal
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error || "Ошибка входа");
        return;
      }
      const next = searchParams.get("next") || "/admin";
      router.push(next);
      router.refresh();
    } catch {
      setError("Нет связи с сервером или долгий ответ.");
    } finally {
      if (timeout) clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-20">
      <div className="site-container mx-auto max-w-md">
        <div className="glass-card rounded-2xl p-6">
          <h1 className="text-2xl font-bold">Вход в админку</h1>
          <p className="mt-2 text-sm opacity-75">
            Введите три строки точно так, как заданы в настройках сервера (ADMIN_EMAIL, телефон из .env, пароль). Формат
            не проверяется — важно полное совпадение символов.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">Строка email</span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">Строка «телефон» (как в .env)</span>
              <input
                type="text"
                autoComplete="off"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
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
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Входим…" : "Войти"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
