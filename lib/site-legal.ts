/**
 * Публичный URL сайта (env).
 * Номер телефона на сайте — только для чата в Telegram (ссылка t.me), не для звонков.
 */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://truewebwork.ru").replace(/\/+$/, "");
}

/** Номер для отображения и ссылки в Telegram (NEXT_PUBLIC_CONTACT_PHONE_*). */
export function getPublicPhone(): { display: string; tel: string } {
  const raw = (process.env.NEXT_PUBLIC_CONTACT_PHONE_TEL || "+16822936330").replace(/\s/g, "");
  const tel = raw ? (raw.startsWith("+") ? raw : `+${raw}`) : "+16822936330";
  const display =
    (process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY || "").trim() || "+1 682 293 6330";
  return { display, tel };
}

/** Открыть чат Telegram по номеру (не tel: — входящие звонки на номер не доставляются). */
export function getTelegramPhoneUrl(tel: string): string {
  const t = tel.replace(/\s/g, "");
  const withPlus = t.startsWith("+") ? t : `+${t}`;
  return `https://t.me/${withPlus}`;
}
