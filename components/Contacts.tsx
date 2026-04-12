"use client";

import { TELEGRAM_BOT_LABEL, TELEGRAM_BOT_URL } from "@/lib/public-contact";
import { getPublicPhone, getTelegramPhoneUrl } from "@/lib/site-legal";
import { MessageCircle, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function Contacts() {
  const phone = getPublicPhone();

  return (
    <section id="contacts" className="section-space relative px-3 sm:px-4">
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-4xl rounded-full bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 blur-3xl" />
      <div className="site-container relative max-w-3xl">
        <div className="glass-card p-8 text-center md:p-10">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Контакты</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-80">
            Свяжитесь с нами в Telegram — ответим на вопросы по услугам и срокам.
          </p>

          <a
            href={getTelegramPhoneUrl(phone.tel)}
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-6 inline-flex min-h-11 items-center gap-3 rounded-xl px-4 py-2 text-lg font-semibold hover:bg-white/10"
          >
            <Phone size={20} aria-hidden />
            <span>
              {phone.display}
              <span className="ml-2 text-base font-medium opacity-90">— в Telegram</span>
            </span>
          </a>
          <p className="mx-auto mt-2 max-w-md text-xs leading-snug opacity-75">
            Виртуальный номер: звонки не принимаются, писать можно только в Telegram по ссылке выше.
          </p>

          <motion.a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99,102,241,0.4)" }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="mx-auto mt-8 inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 font-semibold text-white shadow-glass"
          >
            Написать в Telegram
          </motion.a>

          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 font-semibold hover:bg-white/10"
          >
            <MessageCircle size={18} />
            Бот: {TELEGRAM_BOT_LABEL}
          </a>
        </div>
      </div>
    </section>
  );
}
