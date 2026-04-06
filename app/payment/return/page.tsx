"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useMemo } from "react";

const CHECKOUT_CONTACT_KEY = "truweb-checkout-contact-v1";

type CheckoutSnapshot = {
  phone?: string;
  email?: string;
  hasTelegram?: boolean;
  orderSummary?: Array<{ title: string; quantity: number; lineTotalRub: number }>;
  totalRub?: number;
};

export default function PaymentReturnPage() {
  const snapshot: CheckoutSnapshot | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(CHECKOUT_CONTACT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as CheckoutSnapshot;
    } catch {
      return null;
    }
  }, []);

  const managerPhoneRaw = process.env.NEXT_PUBLIC_TELEGRAM_MANAGER_PHONE || "16822936330";
  const managerPhone = managerPhoneRaw.replace(/\D/g, "");
  const orderLines = snapshot?.orderSummary?.length
    ? snapshot.orderSummary.map((item) => `- ${item.title} x${item.quantity}`).join("\n")
    : "- (состав заказа уточнить у клиента)";

  const preparedText = [
    "Здравствуйте!",
    "Я оплатил заказ на сайте TrueWeb.",
    "",
    "Что я заказал:",
    orderLines,
    snapshot?.totalRub ? `Итого: ${snapshot.totalRub.toLocaleString("ru-RU")} RUB` : "",
    "",
    "Мой телефон:",
    snapshot?.phone || "не указан",
    "",
    "Мой email:",
    snapshot?.email || "не указан",
    "",
    "Я хотел бы с вами обсудить условия по выбранным услугам."
  ]
    .filter(Boolean)
    .join("\n");

  const telegramHref = `tg://resolve?phone=${managerPhone}&text=${encodeURIComponent(preparedText)}`;

  return (
    <>
      <Header />
      <main className="min-h-screen px-4 pb-20 pt-28">
      <div className="site-container mx-auto max-w-lg">
        <div className="glass-card p-8 text-center">
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Спасибо!</h1>
          <p className="mt-4 text-base opacity-90">
            Если оплата прошла успешно, мы увидим её в личном кабинете ЮKassa. При необходимости свяжемся с вами по
            контактам с сайта.
          </p>
          <p className="mt-4 text-sm font-semibold">
            Оплата прошла успешно? Напишите нам в Telegram — там мы передадим сайт и доступы.
          </p>
          <p className="mt-2 text-xs opacity-75">Контакт в Telegram: +{managerPhone}</p>
          <p className="mt-2 text-sm opacity-75">Статус платежа в платёжном кабинете может обновиться с небольшой задержкой.</p>
          <div className="mt-8 flex justify-center">
            <a
              href={telegramHref}
              className="inline-flex justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-glass"
            >
              Написать в Telegram
            </a>
          </div>
        </div>
      </div>
    </main>
      <Footer />
    </>
  );
}
