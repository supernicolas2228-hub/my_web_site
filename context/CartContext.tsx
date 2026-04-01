"use client";

import type { ServiceId } from "@/lib/services-catalog";
import { SERVICES_CATALOG } from "@/lib/services-catalog";
import type { CartLine, CustomCartLine } from "@/lib/cart-lines";
import { CUSTOM_QUOTE_MAX_RUB, CUSTOM_QUOTE_MIN_RUB, lineStableKey, parseCartLine } from "@/lib/cart-lines";
import Link from "next/link";
import { useTheme } from "next-themes";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

function CartAddedDialog({ title, onClose }: { title: string; onClose: () => void }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const ui = useMemo(() => {
    return {
      overlay: isDark ? "bg-black/55" : "bg-black/40",
      panel:
        "max-w-md rounded-2xl border p-6 shadow-glass backdrop-blur-xl " +
        (isDark
          ? "border-white/15 bg-slate-950/95 text-white"
          : "border-slate-200/90 bg-white/[0.96] text-slate-900"),
      h2: "text-xl font-bold " + (isDark ? "text-white" : "text-slate-900"),
      line: "mt-2 text-sm " + (isDark ? "text-slate-200" : "text-slate-700"),
      next: "mt-4 text-sm " + (isDark ? "text-slate-300" : "text-slate-600"),
      secondary: isDark
        ? "flex-1 rounded-xl border-2 border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
        : "flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50",
      primary:
        "flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-glass ring-2 ring-indigo-500/30 transition hover:opacity-95"
    };
  }, [isDark]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm ${ui.overlay}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-choice-title"
      onClick={onClose}
    >
      <div className={ui.panel} onClick={(e) => e.stopPropagation()}>
        <h2 id="cart-choice-title" className={ui.h2}>
          Добавлено в корзину
        </h2>
        <p className={ui.line}>&laquo;{title}&raquo;</p>
        <p className={ui.next}>Что дальше?</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={onClose} className={ui.secondary}>
            Продолжить покупки
          </button>
          <Link href="/cart" onClick={onClose} className={ui.primary}>
            В корзину и оплатить
          </Link>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "truweb-cart-v1";

export type ResolvedCartLine =
  | {
      kind: "catalog";
      lineKey: string;
      serviceId: ServiceId;
      title: string;
      unitPriceRub: number;
      quantity: number;
      lineTotalRub: number;
      summary?: string;
    }
  | {
      kind: "custom";
      lineKey: string;
      clientLineId: string;
      title: string;
      summary: string;
      unitPriceRub: number;
      quantity: number;
      lineTotalRub: number;
    };

type CartContextValue = {
  lines: CartLine[];
  addLine: (serviceId: ServiceId) => void;
  addCustomQuote: (payload: { title: string; amountRub: number; summary: string }) => void;
  setQuantity: (lineKey: string, quantity: number) => void;
  removeLine: (lineKey: string) => void;
  clearCart: () => void;
  totalRub: number;
  totalCount: number;
  resolvedLines: ResolvedCartLine[];
  choiceModal: { open: boolean; title: string };
  closeChoiceModal: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadFromStorage(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: CartLine[] = [];
    for (const item of parsed) {
      const line = parseCartLine(item);
      if (line) out.push(line);
    }
    return out;
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [choiceModal, setChoiceModal] = useState<{ open: boolean; title: string }>({ open: false, title: "" });

  useEffect(() => {
    setLines(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const resolvedLines = useMemo(() => {
    const map = Object.fromEntries(SERVICES_CATALOG.map((s) => [s.id, s]));
    const result: ResolvedCartLine[] = [];
    for (const line of lines) {
      if (line.kind === "catalog") {
        const s = map[line.serviceId];
        if (!s) continue;
        result.push({
          kind: "catalog",
          lineKey: lineStableKey(line),
          serviceId: line.serviceId,
          title: s.title,
          unitPriceRub: s.priceRub,
          quantity: line.quantity,
          lineTotalRub: s.priceRub * line.quantity
        });
      } else {
        result.push({
          kind: "custom",
          lineKey: lineStableKey(line),
          clientLineId: line.clientLineId,
          title: line.title,
          summary: line.summary,
          unitPriceRub: line.amountRub,
          quantity: line.quantity,
          lineTotalRub: line.amountRub * line.quantity
        });
      }
    }
    return result;
  }, [lines]);

  const totalRub = useMemo(() => resolvedLines.reduce((sum, l) => sum + l.lineTotalRub, 0), [resolvedLines]);
  const totalCount = useMemo(() => resolvedLines.reduce((sum, l) => sum + l.quantity, 0), [resolvedLines]);

  const addLine = useCallback((serviceId: ServiceId) => {
    const title = SERVICES_CATALOG.find((s) => s.id === serviceId)?.title ?? "Услуга";
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.kind === "catalog" && l.serviceId === serviceId);
      if (idx === -1) return [...prev, { kind: "catalog", serviceId, quantity: 1 }];
      const next = [...prev];
      const cur = next[idx] as Extract<CartLine, { kind: "catalog" }>;
      next[idx] = { ...cur, quantity: cur.quantity + 1 };
      return next;
    });
    setChoiceModal({ open: true, title });
  }, []);

  const addCustomQuote = useCallback((payload: { title: string; amountRub: number; summary: string }) => {
    const amountRub = Math.round(payload.amountRub);
    if (amountRub < CUSTOM_QUOTE_MIN_RUB || amountRub > CUSTOM_QUOTE_MAX_RUB) return;
    const title = payload.title.trim().slice(0, 200) || "Проект по договорённости с ИИ";
    const summary = payload.summary.trim().slice(0, 2000);
    const clientLineId =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `q-${Date.now()}`;
    const line: CustomCartLine = {
      kind: "custom",
      clientLineId,
      title,
      amountRub,
      summary,
      quantity: 1
    };
    setLines((prev) => [...prev, line]);
    setChoiceModal({ open: true, title: `${title} — ${amountRub.toLocaleString("ru-RU")} ₽` });
  }, []);

  const setQuantity = useCallback((lineKey: string, quantity: number) => {
    setLines((prev) => {
      if (quantity < 1) return prev.filter((l) => lineStableKey(l) !== lineKey);
      return prev.map((l) => (lineStableKey(l) === lineKey ? { ...l, quantity } : l));
    });
  }, []);

  const removeLine = useCallback((lineKey: string) => {
    setLines((prev) => prev.filter((l) => lineStableKey(l) !== lineKey));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const closeChoiceModal = useCallback(() => {
    setChoiceModal((m) => ({ ...m, open: false }));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      addLine,
      addCustomQuote,
      setQuantity,
      removeLine,
      clearCart,
      totalRub,
      totalCount,
      resolvedLines,
      choiceModal,
      closeChoiceModal
    }),
    [
      lines,
      addLine,
      addCustomQuote,
      setQuantity,
      removeLine,
      clearCart,
      totalRub,
      totalCount,
      resolvedLines,
      choiceModal,
      closeChoiceModal
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {choiceModal.open && <CartAddedDialog title={choiceModal.title} onClose={closeChoiceModal} />}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
