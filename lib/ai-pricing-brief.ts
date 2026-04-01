import { SERVICES_CATALOG } from "@/lib/services-catalog";

/** Текст для system prompt DeepSeek: официальные цены и состав минимальных пакетов. */
export function buildPricingBriefForAi(): string {
  const blocks = SERVICES_CATALOG.map((s) => {
    return `### ${s.title}\nЦена минимального пакета на сайте: ${s.priceLabel} ₽ (${s.priceRub} руб.).\nЧто входит (кратко из описания услуги):\n${s.hint}`;
  });
  return blocks.join("\n\n");
}
