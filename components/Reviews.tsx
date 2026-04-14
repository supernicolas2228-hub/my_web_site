"use client";

import Reveal from "@/components/motion/Reveal";
import {
  PORTFOLIO_GOOGLE_DRIVE_URL,
  PORTFOLIO_YANDEX_DISK_URL
} from "@/lib/portfolio-links";
import type { ReviewRecord } from "@/lib/review-types";
import { REVIEWS_CAROUSEL_MAX } from "@/lib/review-types";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

function visibleColumns(width: number): 1 | 2 | 3 {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

function reviewsWord(n: number): string {
  if (n === 0) return "отзывов";
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "отзывов";
  const m10 = n % 10;
  if (m10 === 1) return "отзыв";
  if (m10 >= 2 && m10 <= 4) return "отзыва";
  return "отзывов";
}

export default function Reviews({
  carousel,
  total
}: {
  carousel: ReviewRecord[];
  total: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(0);
  const [gap, setGap] = useState(16);
  const [cols, setCols] = useState<1 | 2 | 3>(1);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const c = visibleColumns(window.innerWidth);
    const g = window.innerWidth >= 768 ? 16 : 12;
    setCols(c);
    setGap(g);
    const usable = w - g * (c - 1);
    setItemWidth(Math.max(240, usable / c));
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = viewportRef.current;
    if (!el || !itemWidth || carousel.length === 0) return;
    const step = itemWidth + gap;
    const maxIndex = Math.max(0, carousel.length - cols);
    const rawIndex = step > 0 ? el.scrollLeft / step : 0;
    const currentIndex = Math.round(rawIndex);
    let nextIndex = currentIndex + dir;

    if (nextIndex > maxIndex) nextIndex = 0;
    if (nextIndex < 0) nextIndex = maxIndex;

    el.scrollTo({ left: nextIndex * step, behavior: "smooth" });
  };

  const hasCards = carousel.length > 0;

  return (
    <section id="reviews" className="section-space px-3 sm:px-4">
      <div className="site-container">
        <Reveal>
          <h2 className="font-heading text-3xl font-bold text-black dark:text-white md:text-4xl">Наши отзывы</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="mt-3 max-w-3xl text-base text-black/85 dark:text-white/90 md:text-lg">
            На данный момент у нас{" "}
            <span className="font-semibold text-indigo-700 dark:text-indigo-300">
              {total === 0 ? "ещё нет загруженных отзывов" : `${total} ${reviewsWord(total)}`}
            </span>
            {total === 0
              ? " — добавьте текстовые файлы в папку отзывов в проекте."
              : " — те же формулировки, что в папке «Отзывы» внутри нашего портфолио на Яндекс.Диске и Google Drive."}{" "}
            <a
              href={PORTFOLIO_YANDEX_DISK_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo-600 underline decoration-indigo-400/60 underline-offset-2 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Яндекс.Диск
            </a>
            {" · "}
            <a
              href={PORTFOLIO_GOOGLE_DRIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo-600 underline decoration-indigo-400/60 underline-offset-2 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Google Drive
            </a>
            .
          </p>
        </Reveal>
        {total > REVIEWS_CAROUSEL_MAX ? (
          <Reveal delay={0.08}>
            <p className="mt-2 text-sm text-black/70 dark:text-white/75">
              В карусели показываем до {REVIEWS_CAROUSEL_MAX} отзывов; набор обновляется при каждой загрузке страницы.
            </p>
          </Reveal>
        ) : null}
        <Reveal delay={0.1}>
          <p className="mt-2 text-sm font-medium text-black/80 dark:text-slate-300">
            Листайте влево и вправо — как блок «Наши продукты».
          </p>
        </Reveal>

        {hasCards ? (
          <div className="relative mt-8">
            <button
              type="button"
              aria-label="Предыдущий отзыв"
              onClick={() => scrollByDir(-1)}
              className="group absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 shadow-md backdrop-blur-sm hover:bg-white md:h-12 md:w-12 dark:border-white/20 dark:bg-black/50 dark:hover:bg-black/65"
            >
              <ChevronLeft className="h-5 w-5 transition-transform duration-200 ease-out group-hover:scale-125 group-active:scale-90 md:h-6 md:w-6" />
            </button>
            <button
              type="button"
              aria-label="Следующий отзыв"
              onClick={() => scrollByDir(1)}
              className="group absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 shadow-md backdrop-blur-sm hover:bg-white md:h-12 md:w-12 dark:border-white/20 dark:bg-black/50 dark:hover:bg-black/65"
            >
              <ChevronRight className="h-5 w-5 transition-transform duration-200 ease-out group-hover:scale-125 group-active:scale-90 md:h-6 md:w-6" />
            </button>

            <div
              ref={viewportRef}
              className="reviews-carousel-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 pt-1 md:gap-4 md:px-12"
              style={{
                scrollbarWidth: "thin",
                WebkitOverflowScrolling: "touch"
              }}
            >
              {carousel.map((item, index) => (
                <article
                  key={item.id}
                  className="glass-card flex shrink-0 snap-start snap-always flex-col justify-between rounded-2xl border border-white/25 bg-white/50 p-6 shadow-glass dark:border-white/15 dark:bg-black/25"
                  style={{
                    width: itemWidth ? `${itemWidth}px` : "100%",
                    scrollSnapAlign: "start",
                    animationDelay: `${Math.min(index * 70, 280)}ms`
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                      {item.author}
                    </p>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-black/90 dark:text-white/90 md:text-base">
                      {item.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-2 text-center text-sm opacity-75 md:hidden">Свайпните влево / вправо</p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-indigo-400/40 bg-indigo-500/5 px-6 py-10 text-center text-sm text-black/75 dark:text-white/80">
            Отзывы появятся здесь после добавления файлов в{" "}
            <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">content/reviews</code> (см.
            README в этой папке).
          </div>
        )}

        <Reveal delay={0.12}>
          <div className="mt-14 flex flex-col items-center gap-3">
            <p className="max-w-xl text-center text-base text-black/85 dark:text-white/90">
              Ниже — наше портфолио: загляните в примеры работ или откройте полные материалы на Диске.
            </p>
            <a
              href="#portfolio"
              className="group inline-flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              <span>К портфолио</span>
              <ChevronDown className="h-6 w-6 animate-bounce motion-reduce:animate-none" aria-hidden />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
