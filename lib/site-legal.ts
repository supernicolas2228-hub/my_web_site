/**
 * Публичный URL сайта (env).
 * Номер телефона на сайте — только для чата в Telegram (ссылка t.me), не для звонков.
 */
/** Публичный канонический хост в проде — совпадает с рабочим DNS у мобильных клиентов. */
export const DEFAULT_PUBLIC_SITE_URL = "https://www.truewebwork.ru";

/** Имя хоста без www (редирект на канонический URL в middleware и в клиентском fallback). */
export const APEX_PUBLIC_HOST = "truewebwork.ru";

/** Канонический хост с www (без схемы). */
export const CANONICAL_WWW_HOST = "www.truewebwork.ru";

const LEGACY_APEX_PUBLIC_URL = "https://truewebwork.ru";

export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL).replace(/\/+$/, "");
  if (raw === LEGACY_APEX_PUBLIC_URL) return DEFAULT_PUBLIC_SITE_URL;
  return raw;
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
