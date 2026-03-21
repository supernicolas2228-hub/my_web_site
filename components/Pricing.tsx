"use client";

import { motion } from "framer-motion";

const pricingItems = [
  {
    title: "Создание сайтов любой сложности",
    description: "Лендинги, многостраничники, интернет-магазины.",
    price: "от 5 000 руб."
  },
  {
    title: "Разработка любых ботов",
    description: "Telegram, WhatsApp, Viber и др.: парсеры, калькуляторы, музыка, воронки продаж.",
    price: "от 5 000 руб."
  },
  {
    title: "Доработка и \"реанимация\"",
    description:
      "Исправлю чужие баги, допишу функционал, если прошлый разработчик пропал или не справился.",
    price: "от 2 000 руб."
  },
  {
    title: "Сложные интеграции",
    description: "Подключение ЮKassa для вашего бота или сайта.",
    price: "цена по запросу"
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="section-space px-3 sm:px-4">
      <div className="site-container">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">Услуги и цены</h2>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {pricingItems.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              whileHover={{ y: -8, boxShadow: "0 12px 36px rgba(99,102,241,0.25)" }}
              className="glass-card flex h-full flex-col p-6"
            >
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-slate-700 dark:text-white">{item.description}</p>
              <p className="mt-5 text-lg font-bold text-indigo-600 dark:text-white">{item.price}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
