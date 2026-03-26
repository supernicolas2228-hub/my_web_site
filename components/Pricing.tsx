"use client";

import { useCart } from "@/context/CartContext";
import { SERVICES_CATALOG } from "@/lib/services-catalog";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

function visibleColumns(width: number): 1 | 2 | 3 {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

export default function Pricing() {
  const { addLine } = useCart();
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
    setItemWidth(Math.max(200, usable / c));
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
    if (!el || !itemWidth) return;
    const step = itemWidth + gap;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section id="pricing" className="section-space px-3 sm:px-4">
      <div className="site-container">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">Услуги и оплата</h2>
        <p className="mt-3 max-w-2xl text-base opacity-90 md:text-lg">
          Листайте влево и вправо — видно {cols === 1 ? "одну" : cols === 2 ? "две" : "три"} услуги, остальные рядом.
          Добавляйте услуги в корзину и оплачивайте через ЮKassa.
        </p>

        <div className="relative mt-8">
          <button
            type="button"
            aria-label="Предыдущие услуги"
            onClick={() => scrollByDir(-1)}
            className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 rounded-full border border-white/30 bg-white/90 p-2 shadow-md backdrop-blur-sm transition hover:bg-white md:p-2.5 dark:border-white/20 dark:bg-black/50 dark:hover:bg-black/65"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            type="button"
            aria-label="Следующие услуги"
            onClick={() => scrollByDir(1)}
            className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 rounded-full border border-white/30 bg-white/90 p-2 shadow-md backdrop-blur-sm transition hover:bg-white md:p-2.5 dark:border-white/20 dark:bg-black/50 dark:hover:bg-black/65"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          <div
            ref={viewportRef}
            className="pricing-carousel-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 pt-1 md:gap-4 md:px-12"
            style={{
              scrollbarWidth: "thin",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {SERVICES_CATALOG.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="glass-card flex shrink-0 snap-start snap-always flex-col justify-between rounded-2xl p-6 shadow-glass"
                style={{
                  width: itemWidth ? `${itemWidth}px` : "100%",
                  scrollSnapAlign: "start"
                }}
              >
                <div>
                  <h3 className="text-xl font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed opacity-90 md:text-base">{item.hint}</p>
                </div>
                <div className="mt-6 space-y-3">
                  <p className="text-lg font-bold text-indigo-600 dark:text-white">{item.priceLabel}</p>
                  <button
                    type="button"
                    onClick={() => addLine(item.id)}
                    className="w-full rounded-xl border border-indigo-400/80 bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-500/25 transition hover:shadow-xl hover:shadow-indigo-500/50 hover:brightness-105 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf5] active:scale-[0.99] dark:border-white/20 dark:from-indigo-500 dark:to-fuchsia-500 dark:shadow-indigo-950/50 dark:ring-white/10 dark:focus-visible:ring-offset-gray-900"
                  >
                    Добавить в корзину
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          <p className="mt-2 text-center text-sm opacity-75 md:hidden">Свайпните влево / вправо, чтобы увидеть все услуги</p>
        </div>
      </div>
    </section>
  );
}
