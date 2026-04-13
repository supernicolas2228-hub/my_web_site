import { FAQ_ENTRIES } from "@/lib/faq-content";

export default function Faq() {
  return (
    <section id="faq" className="section-space px-3 sm:px-4">
      <div className="site-container max-w-3xl">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">
          Часто задаваемые вопросы
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-300 md:text-lg">
          Здесь — ответы простым языком: без канцеляризма, как будто объясняем другу или ребёнку, но
          по делу. Раскройте любой вопрос ниже.
        </p>

        <div className="mt-10 flex flex-col gap-4">
          {FAQ_ENTRIES.map((item) => (
            <details
              key={item.id}
              id={item.id}
              className="group glass-card overflow-hidden rounded-2xl border border-white/15 open:border-indigo-400/40 open:shadow-lg open:shadow-indigo-500/10 dark:open:border-indigo-400/35"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-5 py-4 text-left text-base font-semibold leading-snug text-slate-900 marker:content-none dark:text-white md:px-6 md:py-5 md:text-lg [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">{item.question}</span>
                <span
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[0.65rem] leading-none text-indigo-600 transition duration-200 group-open:rotate-180 dark:border-white/15 dark:bg-white/5 dark:text-indigo-300"
                  aria-hidden
                >
                  &#9660;
                </span>
              </summary>
              <div className="border-t border-white/15 px-5 pb-5 pt-2 dark:border-white/10 md:px-6 md:pb-6">
                <div className="space-y-4 text-base leading-relaxed text-slate-800 dark:text-slate-200 md:text-[1.05rem]">
                  {item.answer.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Не нашли ответ?{" "}
          <a href="/#contacts" className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300">
            Напишите нам в Telegram
          </a>
          — подскажем.
        </p>
      </div>
    </section>
  );
}
