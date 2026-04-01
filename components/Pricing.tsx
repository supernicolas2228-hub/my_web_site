"use client";

import {
  serviceIdToProjectType,
  useCalculator,
  type OpenCalculatorOptions
} from "@/context/CalculatorContext";
import { useCart } from "@/context/CartContext";
import type { ServiceId } from "@/lib/services-catalog";
import { SERVICES_CATALOG } from "@/lib/services-catalog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Портал на body: inline-цвета, чтобы не бороться с глобальным CSS и кэшем. */
function PricingDetailModalBody({
  serviceId,
  onClose,
  openCalculator
}: {
  serviceId: ServiceId;
  onClose: () => void;
  openCalculator: (opts?: OpenCalculatorOptions) => void;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const ink = isDark ? "#f1f5f9" : "#0f172a";
  const inkMuted = isDark ? "#94a3b8" : "#475569";
  const footerInk = isDark ? "#ffffff" : "#0f172a";
  const panelBg = isDark ? "rgba(15, 23, 42, 0.97)" : "rgba(255, 255, 255, 0.97)";
  const panelBorder = isDark ? "rgba(129, 140, 248, 0.45)" : "rgba(15, 23, 42, 0.18)";
  const closeBorder = isDark ? "rgba(241, 245, 249, 0.35)" : "rgba(15, 23, 42, 0.28)";

  const svc = SERVICES_CATALOG.find((s) => s.id === serviceId);
  if (!svc) return null;

  return (
    <div
      className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-2 p-6 shadow-2xl backdrop-blur-xl"
      style={{
        color: ink,
        backgroundColor: panelBg,
        borderColor: panelBorder
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="pricing-detail-title" className="text-xl font-bold" style={{ color: ink }}>
            {svc.title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: inkMuted }}>
            Минимальный пакет
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{
            color: ink,
            borderColor: closeBorder,
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
          }}
        >
          Закрыть
        </button>
      </div>
      <p className="mt-2 text-lg font-bold" style={{ color: ink }}>
        {svc.priceLabel} ₽
      </p>
      <button
        type="button"
        onClick={() => {
          onClose();
          window.setTimeout(() => openCalculator({ presetProjectType: serviceIdToProjectType(svc.id) }), 0);
        }}
        className="mt-4 w-full rounded-xl px-4 py-4 text-center text-base font-bold shadow-lg transition hover:opacity-95 active:scale-[0.99]"
        style={{ backgroundColor: "#4f46e5", color: "#ffffff" }}
      >
        Расчёт стоимости
      </button>
      <p className="mt-2 text-center text-xs" style={{ color: inkMuted }}>
        Быстрый тест или чат с ИИ — ориентировочная цена.
      </p>
      <div className="mt-5 whitespace-pre-line text-sm leading-relaxed" style={{ color: ink }}>
        {svc.hint}
      </div>
      <p className="mt-6 text-center text-sm font-medium" style={{ color: footerInk }}>
        Если вы хотите больше — расширенный функционал, уникальный дизайн или интеграции — рассчитаем стоимость в
        калькуляторе.
      </p>
    </div>
  );
}

function visibleColumns(width: number): 1 | 2 | 3 {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

export default function Pricing() {
  const { addLine } = useCart();
  const { openCalculator } = useCalculator();
  const [detailId, setDetailId] = useState<ServiceId | null>(null);
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
    const maxIndex = Math.max(0, SERVICES_CATALOG.length - cols);
    const rawIndex = step > 0 ? el.scrollLeft / step : 0;
    const currentIndex = Math.round(rawIndex);
    let nextIndex = currentIndex + dir;

    // Кольцевая навигация: вправо с конца -> в начало, влево с начала -> в конец.
    if (nextIndex > maxIndex) nextIndex = 0;
    if (nextIndex < 0) nextIndex = maxIndex;

    el.scrollTo({ left: nextIndex * step, behavior: "smooth" });
  };

  return (
    <section id="pricing" className="section-space px-3 sm:px-4">
      <div className="site-container">
        <h2 className="font-heading text-3xl font-bold text-black dark:text-white md:text-4xl">Наши продукты</h2>
        <p className="mt-2 text-sm font-medium text-black/80 dark:text-slate-300">
          Цены ниже — за минимальный пакет: базовый объём работ и функций по каждой услуге. Подробности — в карточке по
          кнопке «Подробнее» (под «Добавить в корзину»).
        </p>
        <p className="mt-3 max-w-2xl text-base text-black opacity-90 dark:text-white md:text-lg">
          Листайте влево и вправо — видно {cols === 1 ? "одну" : cols === 2 ? "две" : "три"} услуги, остальные рядом.
          Добавляйте услуги в корзину и оплачивайте через ЮKassa. В карточке «Подробнее» можно открыть{" "}
          <span className="font-semibold dark:text-indigo-200">расчёт стоимости</span>.
        </p>

        <div className="relative mt-8">
          <button
            type="button"
            aria-label="Предыдущие услуги"
            onClick={() => scrollByDir(-1)}
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 shadow-md backdrop-blur-sm transition hover:bg-white md:h-12 md:w-12 dark:border-white/20 dark:bg-black/50 dark:hover:bg-black/65"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            type="button"
            aria-label="Следующие услуги"
            onClick={() => scrollByDir(1)}
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 shadow-md backdrop-blur-sm transition hover:bg-white md:h-12 md:w-12 dark:border-white/20 dark:bg-black/50 dark:hover:bg-black/65"
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
            {SERVICES_CATALOG.map((item) => (
              <article
                key={item.id}
                className="glass-card flex shrink-0 snap-start snap-always flex-col justify-between rounded-2xl p-6 opacity-100 shadow-glass"
                style={{
                  width: itemWidth ? `${itemWidth}px` : "100%",
                  scrollSnapAlign: "start"
                }}
              >
                <div>
                  <h3 className="text-xl font-semibold leading-snug text-black dark:text-white">{item.title}</h3>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black/85 dark:opacity-90 md:text-base dark:text-white">
                    {item.hint}
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  <p className="text-lg font-bold text-black dark:text-white">{item.priceLabel}</p>
                  <button
                    type="button"
                    onClick={() => addLine(item.id)}
                    className="w-full rounded-xl border border-indigo-400/80 bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-500/25 transition hover:shadow-xl hover:shadow-indigo-500/50 hover:brightness-105 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf5] active:scale-[0.99] dark:border-white/20 dark:from-indigo-500 dark:to-fuchsia-500 dark:shadow-indigo-950/50 dark:ring-white/10 dark:focus-visible:ring-offset-gray-900"
                  >
                    Добавить в корзину
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailId(item.id)}
                    className="w-full rounded-xl border-2 border-black/20 bg-transparent px-4 py-3 text-sm font-semibold text-black transition hover:bg-black/5 dark:border-indigo-400/50 dark:text-indigo-200 dark:hover:bg-white/10"
                  >
                    Подробнее
                  </button>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-2 text-center text-sm opacity-75 md:hidden">Свайпните влево / вправо, чтобы увидеть все услуги</p>
        </div>

        {typeof document !== "undefined" &&
          detailId &&
          createPortal(
            <div
              id="tw-pricing-detail-overlay"
              className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 p-4 sm:items-center"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pricing-detail-title"
              onClick={() => setDetailId(null)}
            >
              <PricingDetailModalBody
                serviceId={detailId}
                onClose={() => setDetailId(null)}
                openCalculator={openCalculator}
              />
            </div>,
            document.body
          )}
      </div>
    </section>
  );
}
