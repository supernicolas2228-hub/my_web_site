"use client";

import type { ServiceId } from "@/lib/services-catalog";
import { isValidServiceId, SERVICES_CATALOG } from "@/lib/services-catalog";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "truweb-cart-v1";

export type CartLine = {
  serviceId: ServiceId;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  addLine: (serviceId: ServiceId) => void;
  setQuantity: (serviceId: ServiceId, quantity: number) => void;
  removeLine: (serviceId: ServiceId) => void;
  clearCart: () => void;
  totalRub: number;
  totalCount: number;
  resolvedLines: Array<{
    serviceId: ServiceId;
    title: string;
    unitPriceRub: number;
    quantity: number;
    lineTotalRub: number;
  }>;
  /** После добавления — показать выбор */
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
    return parsed.filter(
      (x): x is CartLine =>
        x &&
        typeof x === "object" &&
        typeof (x as CartLine).serviceId === "string" &&
        isValidServiceId((x as CartLine).serviceId) &&
        typeof (x as CartLine).quantity === "number" &&
        (x as CartLine).quantity > 0
    );
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
    return lines
      .map((line) => {
        const s = map[line.serviceId];
        if (!s) return null;
        return {
          serviceId: line.serviceId,
          title: s.title,
          unitPriceRub: s.priceRub,
          quantity: line.quantity,
          lineTotalRub: s.priceRub * line.quantity
        };
      })
      .filter(Boolean) as CartContextValue["resolvedLines"];
  }, [lines]);

  const totalRub = useMemo(() => resolvedLines.reduce((sum, l) => sum + l.lineTotalRub, 0), [resolvedLines]);
  const totalCount = useMemo(() => resolvedLines.reduce((sum, l) => sum + l.quantity, 0), [resolvedLines]);

  const addLine = useCallback((serviceId: ServiceId) => {
    const title = SERVICES_CATALOG.find((s) => s.id === serviceId)?.title ?? "Услуга";
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.serviceId === serviceId);
      if (idx === -1) return [...prev, { serviceId, quantity: 1 }];
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
      return next;
    });
    setChoiceModal({ open: true, title });
  }, []);

  const setQuantity = useCallback((serviceId: ServiceId, quantity: number) => {
    setLines((prev) => {
      if (quantity < 1) return prev.filter((l) => l.serviceId !== serviceId);
      return prev.map((l) => (l.serviceId === serviceId ? { ...l, quantity } : l));
    });
  }, []);

  const removeLine = useCallback((serviceId: ServiceId) => {
    setLines((prev) => prev.filter((l) => l.serviceId !== serviceId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const closeChoiceModal = useCallback(() => {
    setChoiceModal((m) => ({ ...m, open: false }));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      addLine,
      setQuantity,
      removeLine,
      clearCart,
      totalRub,
      totalCount,
      resolvedLines,
      choiceModal,
      closeChoiceModal
    }),
    [lines, addLine, setQuantity, removeLine, clearCart, totalRub, totalCount, resolvedLines, choiceModal, closeChoiceModal]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {choiceModal.open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-choice-title"
          onClick={closeChoiceModal}
        >
          <div className="glass-card max-w-md rounded-2xl p-6 shadow-glass" onClick={(e) => e.stopPropagation()}>
            <h2 id="cart-choice-title" className="text-xl font-bold">
              Добавлено в корзину
            </h2>
            <p className="mt-2 text-sm opacity-90">&laquo;{choiceModal.title}&raquo;</p>
            <p className="mt-4 text-sm opacity-80">Что дальше?</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={closeChoiceModal}
                className="flex-1 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20"
              >
                Продолжить покупки
              </button>
              <Link
                href="/cart"
                onClick={closeChoiceModal}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-glass transition hover:opacity-95"
              >
                В корзину и оплатить
              </Link>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
