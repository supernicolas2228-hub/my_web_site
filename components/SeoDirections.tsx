import Reveal from "@/components/motion/Reveal";
import Link from "next/link";

const cards = [
  {
    href: "/sozdanie-sajtov",
    title: "Создание сайтов",
    text: "Лендинги, многостраничные сайты и интернет‑магазины под ключ: проектирование, вёрстка, запуск и сопровождение."
  },
  {
    href: "/telegram-boty",
    title: "Боты в Telegram",
    text: "Разработка Telegram‑ботов: заявки, оплаты, рассылки, интеграции с CRM и вашими сервисами."
  }
] as const;

export default function SeoDirections() {
  return (
    <section id="directions" className="section-space px-3 sm:px-4">
      <div className="site-container max-w-5xl">
        <Reveal>
          <h2 className="font-heading text-center text-3xl font-bold dark:text-white md:text-4xl">Направления</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-slate-700 dark:text-white/85 md:text-lg">
            Отдельные страницы с подробностями — удобно и людям, и поиску.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <Reveal key={c.href} y={14}>
              <Link
                href={c.href}
                className="glass-card group flex h-full flex-col px-6 py-8 transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(99,102,241,0.14)] dark:hover:shadow-[0_12px_40px_rgba(129,140,248,0.12)] md:px-8 md:py-10"
              >
                <h3 className="font-heading text-xl font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300 md:text-2xl">
                  {c.title}
                </h3>
                <p className="mt-4 flex-1 text-base leading-relaxed text-slate-700 dark:text-white/80">{c.text}</p>
                <span className="mt-6 inline-flex text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                  Подробнее →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
