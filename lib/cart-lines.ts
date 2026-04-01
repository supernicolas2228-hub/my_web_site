import type { ServiceId } from "@/lib/services-catalog";
import { isValidServiceId } from "@/lib/services-catalog";

export type CatalogCartLine = {
  kind: "catalog";
  serviceId: ServiceId;
  quantity: number;
};

export type CustomCartLine = {
  kind: "custom";
  clientLineId: string;
  title: string;
  amountRub: number;
  summary: string;
  quantity: number;
};

export type CartLine = CatalogCartLine | CustomCartLine;

/** Лимиты для позиции из чата ИИ (сервер дублирует проверку). */
export const CUSTOM_QUOTE_MIN_RUB = 5_000;
export const CUSTOM_QUOTE_MAX_RUB = 2_000_000;

export function isCatalogLine(x: CartLine): x is CatalogCartLine {
  return x.kind === "catalog";
}

export function isCustomLine(x: CartLine): x is CustomCartLine {
  return x.kind === "custom";
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

/** Нормализация строки из localStorage (в т.ч. старый формат без kind). */
export function parseCartLine(raw: unknown): CartLine | null {
  if (!isRecord(raw)) return null;
  if (raw.kind === "catalog" && typeof raw.serviceId === "string" && isValidServiceId(raw.serviceId)) {
    const q = Number(raw.quantity);
    if (!Number.isInteger(q) || q < 1 || q > 99) return null;
    return { kind: "catalog", serviceId: raw.serviceId, quantity: q };
  }
  if (raw.kind === "custom") {
    const id = typeof raw.clientLineId === "string" ? raw.clientLineId.trim() : "";
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
    const amountRub = Number(raw.amountRub);
    const q = Number(raw.quantity);
    if (!id || !title || title.length > 200) return null;
    if (!Number.isInteger(amountRub) || amountRub < CUSTOM_QUOTE_MIN_RUB || amountRub > CUSTOM_QUOTE_MAX_RUB) return null;
    if (!Number.isInteger(q) || q < 1 || q > 99) return null;
    if (summary.length > 2000) return null;
    return { kind: "custom", clientLineId: id, title, amountRub, summary, quantity: q };
  }
  // Миграция: { serviceId, quantity }
  if (typeof raw.serviceId === "string" && isValidServiceId(raw.serviceId) && !raw.kind) {
    const q = Number(raw.quantity);
    if (!Number.isInteger(q) || q < 1 || q > 99) return null;
    return { kind: "catalog", serviceId: raw.serviceId, quantity: q };
  }
  return null;
}

export function lineStableKey(line: CartLine): string {
  return line.kind === "catalog" ? `c:${line.serviceId}` : `u:${line.clientLineId}`;
}
