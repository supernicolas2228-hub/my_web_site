"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useMemo, useState } from "react";

const CHECKOUT_CONTACT_KEY = "truweb-checkout-contact-v1";

export default function CartPage() {
  const { resolvedLines, totalRub, setQuantity, removeLine, clearCart, lines } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [hasTelegram, setHasTelegram] = useState<"yes" | "no" | "">("");
  const [smsCode, setSmsCode] = useState("");
  const [smsRequested, setSmsRequested] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const orderSummary = useMemo(
    () =>
      resolvedLines.map((line) => ({
        title: line.title,
        quantity: line.quantity,
        lineTotalRub: line.lineTotalRub
      })),
    [resolvedLines]
  );

  const validateRegistration = () => {
    const phoneTrimmed = phone.trim();
    const emailTrimmed = email.trim();
    const phoneDigits = phoneTrimmed.replace(/\D/g, "");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);

    if (phoneDigits.length < 10) {
      return "Укажите корректный номер телефона";
    }
    if (!emailOk) {
      return "Укажите корректный email";
    }
    if (!hasTelegram) {
      return "Выберите, есть ли у вас Telegram";
    }
    return null;
  };

  const requestSmsCode = async () => {
    setError(null);
    setInfo(null);
    const registrationError = validateRegistration();
    if (registrationError) {
      setError(registrationError);
      return;
    }
    setSmsLoading(true);
    try {
      const res = await fetch("/api/auth/sms/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          email: email.trim()
        })
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; debugCode?: string };
      if (!res.ok) {
        setError(data.error || "Не удалось отправить код");
        return;
      }
      setSmsRequested(true);
      setPhoneVerified(false);
      setInfo(data.debugCode ? `Код (тест): ${data.debugCode}` : "Код отправлен на телефон");
    } catch {
      setError("Ошибка сети при отправке кода");
    } finally {
      setSmsLoading(false);
    }
  };

  const verifySmsCode = async () => {
    setError(null);
    setInfo(null);
    if (!smsRequested) {
      setError("Сначала запросите SMS-код");
      return;
    }
    if (!/^\d{4}$/.test(smsCode.trim())) {
      setError("Введите 4-значный код");
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          code: smsCode.trim()
        })
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Не удалось подтвердить код");
        return;
      }
      setPhoneVerified(true);
      setInfo("Номер подтвержден. Теперь можно переходить к оплате.");
    } catch {
      setError("Ошибка сети при подтверждении кода");
    } finally {
      setVerifyLoading(false);
    }
  };

  const pay = async () => {
    setError(null);
    setInfo(null);
    if (lines.length === 0) return;
    const registrationError = validateRegistration();
    if (registrationError) {
      setError(registrationError);
      return;
    }
    if (!phoneVerified) {
      setError("Подтвердите номер телефона через SMS перед оплатой");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/yookassa/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ serviceId: l.serviceId, quantity: l.quantity })),
          customer: {
            phone: phone.trim(),
            email: email.trim(),
            hasTelegram: hasTelegram === "yes"
          }
        })
      });
      const data = (await res.json()) as { confirmationUrl?: string; error?: string; hint?: string };
      if (!res.ok) {
        setError(data.hint || data.error || "Не удалось создать платёж");
        setLoading(false);
        return;
      }
      if (data.confirmationUrl) {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            CHECKOUT_CONTACT_KEY,
            JSON.stringify({
              phone: phone.trim(),
              email: email.trim(),
              hasTelegram: hasTelegram === "yes",
              orderSummary,
              totalRub
            })
          );
        }
        window.location.href = data.confirmationUrl;
        return;
      }
      setError("Нет ссылки на оплату");
    } catch {
      setError("Ошибка сети");
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen px-3 pb-20 pt-24 sm:px-4">
        <div className="site-container max-w-3xl">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">Корзина</h1>
          <p className="mt-2 text-sm opacity-80 md:text-base">Проверьте услуги и сумму, затем оплатите через ЮKassa.</p>

          {resolvedLines.length === 0 ? (
            <div className="glass-card mt-8 p-8 text-center">
              <p className="text-lg">Корзина пуста</p>
              <Link
                href="/#pricing"
                className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 font-semibold text-white"
              >
                К услугам
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              <ul className="space-y-3">
                {resolvedLines.map((line) => (
                  <li key={line.serviceId} className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{line.title}</p>
                      <p className="text-sm opacity-75">
                        {line.unitPriceRub.toLocaleString("ru-RU")} × {line.quantity}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 rounded-lg border border-white/20 px-2 py-1">
                        <button
                          type="button"
                          aria-label="Меньше"
                          className="rounded px-2 py-1 hover:bg-white/10"
                          onClick={() => setQuantity(line.serviceId, line.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-[2ch] text-center">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label="Больше"
                          className="rounded px-2 py-1 hover:bg-white/10"
                          onClick={() => setQuantity(line.serviceId, line.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="min-w-[100px] text-right font-bold">{line.lineTotalRub.toLocaleString("ru-RU")}</p>
                      <button
                        type="button"
                        onClick={() => removeLine(line.serviceId)}
                        className="text-sm text-red-500 underline-offset-2 hover:underline dark:text-red-400"
                      >
                        Удалить
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="glass-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm opacity-80">Итого</p>
                  <p className="text-2xl font-bold">{totalRub.toLocaleString("ru-RU")}</p>
                </div>
                <div className="flex w-full max-w-xl flex-col gap-4 sm:items-end">
                  <div className="w-full rounded-xl border border-white/20 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Перед оплатой заполните данные</p>
                    <div className="mt-3 grid gap-3">
                      <label className="text-sm">
                        <span className="mb-1 block opacity-80">Телефон *</span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            setSmsRequested(false);
                            setSmsCode("");
                            setPhoneVerified(false);
                          }}
                          placeholder="+7 (999) 123-45-67"
                          className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none transition focus:border-indigo-400"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block opacity-80">Email *</span>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none transition focus:border-indigo-400"
                        />
                      </label>
                      <fieldset className="text-sm">
                        <legend className="mb-1 opacity-80">Есть ли у вас Telegram? *</legend>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="hasTelegram"
                              value="yes"
                              checked={hasTelegram === "yes"}
                              onChange={() => setHasTelegram("yes")}
                            />
                            <span>Да</span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="hasTelegram"
                              value="no"
                              checked={hasTelegram === "no"}
                              onChange={() => setHasTelegram("no")}
                            />
                            <span>Нет</span>
                          </label>
                        </div>
                      </fieldset>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={requestSmsCode}
                          disabled={smsLoading}
                          className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-60"
                        >
                          {smsLoading ? "Отправка..." : "Отправить SMS-код"}
                        </button>
                        {smsRequested && (
                          <span className="self-center text-xs opacity-70">Код отправлен, проверьте телефон</span>
                        )}
                      </div>
                      {smsRequested && (
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                          <label className="text-sm">
                            <span className="mb-1 block opacity-80">Код из SMS *</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={smsCode}
                              onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                              placeholder="123456"
                              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none transition focus:border-indigo-400"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={verifySmsCode}
                            disabled={verifyLoading}
                            className="h-10 rounded-lg bg-white/15 px-4 text-sm font-semibold transition hover:bg-white/25 disabled:opacity-60"
                          >
                            {verifyLoading ? "Проверка..." : "Подтвердить код"}
                          </button>
                        </div>
                      )}
                      {phoneVerified && <p className="text-sm text-emerald-400">Номер подтвержден</p>}
                    </div>
                  </div>
                  {info && <p className="text-sm text-emerald-500 dark:text-emerald-400">{info}</p>}
                  {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                  <button
                    type="button"
                    disabled={loading || !phoneVerified}
                    onClick={pay}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 font-semibold text-white shadow-glass disabled:opacity-60"
                  >
                    {loading ? "Переход к оплате…" : "Оплатить через ЮKassa"}
                  </button>
                  <button type="button" onClick={clearCart} className="text-sm opacity-70 hover:underline">
                    Очистить корзину
                  </button>
                </div>
              </div>

              <p className="text-xs opacity-60">
                Оплата обрабатывается ЮKassa. Укажите в .env ключи магазина и публичный URL сайта — см. .env.example.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
