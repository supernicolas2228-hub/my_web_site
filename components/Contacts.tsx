"use client";

import { MessageCircle, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function Contacts() {
  return (
    <section id="contacts" className="section-space relative px-3 sm:px-4">
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-4xl rounded-full bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 blur-3xl" />
      <div className="site-container relative max-w-3xl">
        <div className="glass-card p-8 text-center md:p-10">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Контакты</h2>
          <a
            href="tel:+16822936330"
            className="mx-auto mt-6 inline-flex min-h-11 items-center gap-3 rounded-xl px-4 py-2 text-lg font-semibold hover:bg-white/10"
          >
            <Phone size={20} />
            +1 682 293 6330
          </a>

          <motion.a
            href="https://t.me/Site_and_Bot_Lab_bot"
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99,102,241,0.4)" }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="mx-auto mt-8 inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 font-semibold text-white shadow-glass"
          >
            Связаться с нами в телеграме
          </motion.a>

          <a
            href="https://t.me/Site_and_Bot_Lab_bot"
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 font-semibold hover:bg-white/10"
          >
            <MessageCircle size={18} />
            Наш бот: @Site_and_Bot_Lab_bot
          </a>

        </div>
      </div>
    </section>
  );
}
