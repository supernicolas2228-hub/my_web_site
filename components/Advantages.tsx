"use client";

import { motion } from "framer-motion";

const advantages = [
  {
    title: "Кроссплатформенность",
    description: "Создаю решения, которые одинаково круто работают и в вебе, и в мессенджерах."
  },
  {
    title: "Доведение до идеала",
    description:
      "Моя специализация — исправлять то, что не смогли другие. Ваш проект будет работать стабильно."
  },
  {
    title: "Прозрачность",
    description: "Фиксированная цена на старте и соблюдение дедлайнов."
  },
  {
    title: "Поддержка и запуск",
    description: "Не просто отдаю код, а помогаю с хостингом, регистрацией и настройкой под ключ."
  }
];

export default function Advantages() {
  return (
    <section id="advantages" className="section-space px-3 sm:px-4">
      <div className="site-container">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">Почему выбирают нас</h2>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {advantages.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              whileHover={{ y: -8, boxShadow: "0 12px 36px rgba(99,102,241,0.25)" }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-slate-700 dark:text-white">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
