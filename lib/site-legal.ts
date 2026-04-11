/**
 * Публичный URL сайта (env). Юридические и контактные поля на страницах не выводятся — см. lib/public-contact.ts.
 */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://truewebwork.ru").replace(/\/+$/, "");
}
