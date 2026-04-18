/**
 * Публичная ссылка на Telegram-бота (кнопки на сайте).
 * При смене бота: задайте NEXT_PUBLIC_TELEGRAM_BOT_URL и NEXT_PUBLIC_TELEGRAM_BOT_LABEL в .env и пересоберите.
 */
const DEFAULT_TELEGRAM_BOT_URL = "https://t.me/TrueWebWork_bot";
const DEFAULT_TELEGRAM_BOT_LABEL = "@TrueWebWork_bot";

function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

export const TELEGRAM_BOT_URL = trimTrailingSlashes(
  (process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "").trim() || DEFAULT_TELEGRAM_BOT_URL
);

export const TELEGRAM_BOT_LABEL =
  (process.env.NEXT_PUBLIC_TELEGRAM_BOT_LABEL || "").trim() || DEFAULT_TELEGRAM_BOT_LABEL;
