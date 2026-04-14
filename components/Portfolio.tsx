import Reveal from "@/components/motion/Reveal";
import { PORTFOLIO_GOOGLE_DRIVE_URL, PORTFOLIO_YANDEX_DISK_URL } from "@/lib/portfolio-links";

export default function Portfolio() {
  const linkClass =
    "glass-card group relative inline-flex min-h-16 w-full items-center justify-center overflow-hidden rounded-2xl px-8 py-5 text-center text-lg font-semibold transition-all duration-300 will-change-transform hover:scale-[1.02] hover:border-indigo-400/35 hover:shadow-[0_0_32px_rgba(99,102,241,0.35)] active:scale-[0.98] md:text-xl";

  const reviewsJumpClass =
    "glass-card group relative inline-flex min-h-14 w-full max-w-md items-center justify-center overflow-hidden rounded-2xl border-2 border-indigo-400/40 px-6 py-4 text-center text-base font-bold text-indigo-800 shadow-[0_0_24px_rgba(99,102,241,0.2)] transition-all duration-300 will-change-transform hover:scale-[1.02] hover:border-indigo-400/60 hover:shadow-[0_0_32px_rgba(99,102,241,0.35)] active:scale-[0.98] dark:border-indigo-400/35 dark:text-indigo-100 dark:shadow-indigo-950/40 md:text-lg";

  return (
    <section id="portfolio" className="section-space px-3 sm:px-4">
      <div className="site-container">
        <Reveal>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Портфолио</h2>
        </Reveal>
        <Reveal delay={0.04}>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-black/80 dark:text-white/85 md:text-lg">
            Здесь можно открыть полные материалы: скриншоты, описания проектов и папку с отзывами — на Яндекс.Диске и
            Google Drive.
          </p>
        </Reveal>
        <div className="mt-8 flex justify-center">
          <Reveal delay={0.06}>
            <a href="#reviews" className={reviewsJumpClass}>
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-sky-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="relative">↑ К отзывам клиентов</span>
            </a>
          </Reveal>
        </div>
        <div className="mt-10 flex justify-center">
          <div className="flex w-full max-w-3xl flex-col items-stretch justify-center gap-4 sm:gap-5">
            <Reveal delay={0.08}>
              <a
                href={PORTFOLIO_YANDEX_DISK_URL}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/[0.07] to-fuchsia-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100" />
                <span className="relative px-1">Портфолио на Яндекс Диск</span>
              </a>
            </Reveal>
            <Reveal delay={0.14}>
              <a
                href={PORTFOLIO_GOOGLE_DRIVE_URL}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-sky-500/[0.08] to-fuchsia-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100" />
                <span className="relative px-1">Портфолио на Google Drive</span>
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
