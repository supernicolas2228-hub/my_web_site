import { randomInt } from "crypto";

/**
 * Пока включено: один код 111111 для админки (email+SMS), личного кабинета и SMS в корзине.
 * Перед открытым продом выставьте false и задеплойте.
 */
export const USE_FIXED_OTP_EVERYWHERE = false;

export const FIXED_OTP_DIGITS = "1111";

export function generateOtpDigits(length: 4 | 6 = 4): string {
  if (USE_FIXED_OTP_EVERYWHERE) return FIXED_OTP_DIGITS;
  if (length === 4) return randomInt(0, 10000).toString().padStart(4, "0");
  return randomInt(0, 1000000).toString().padStart(6, "0");
}
