import Link from "next/link";

export default function About() {
  return (
    <section id="about" className="section-space relative px-3 sm:px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="about-gradient mx-auto mt-10 h-64 w-[90%] max-w-5xl rounded-full" />
      </div>
      <div className="site-container relative max-w-5xl">
        <div className="glass-card px-6 py-10 md:px-10 md:py-12">
          <h2 className="font-heading text-3xl font-bold dark:text-white md:text-4xl">О нас</h2>
          <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-slate-800 dark:text-white md:text-lg">
            {[
              "TrueWeb — это команда, которая создаёт не просто красивые сайты, а продуманные цифровые решения, помогающие бизнесу расти 🚀",
              "Мы специализируемся на веб-дизайне и UX-дизайне, уделяя внимание не только визуалу, но и удобству пользователей, логике взаимодействия и реальным бизнес-результатам.",
              "Наша философия — честное и долгосрочное сотрудничество 🤝",
              "Мы не исчезаем после запуска проекта, остаёмся на связи и поддерживаем клиентов на каждом этапе развития их продукта. Нам важно, чтобы ваш сайт или сервис продолжал работать эффективно и приносил пользу.",
              "Мы придерживаемся прозрачного подхода к работе 💼",
              "— не завышаем стоимость без причины\n— заранее обсуждаем объём задач и сроки\n— соблюдаем договорённости\n— открыто объясняем каждое решение",
              "Для нас репутация важнее быстрых сделок ⭐",
              "Поэтому мы строим отношения на доверии, ответственности и реальных результатах. TrueWeb — это партнёр, на которого можно положиться."
            ].join("\n\n")}
          </div>
          <div className="mt-10 flex justify-center md:justify-start">
            <Link
              href="/about"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 text-base font-semibold text-white shadow-glass transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Подробнее
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
