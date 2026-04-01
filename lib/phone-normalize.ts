/** Без зависимостей от БД — можно импортировать в client components. */

export function normalizePhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("9")) digits = `7${digits}`;
  return digits.slice(0, 11);
}

export function isValidPhone(input: string) {
  const normalized = normalizePhone(input);
  return normalized.length === 11 && normalized.startsWith("7");
}

/** Маска +7 (XXX) XXX-XX-XX по мере ввода. */
export function formatRuPhoneMask(input: string): string {
  const d = normalizePhone(input);
  if (!d.length) return "";
  const body = d.startsWith("7") ? d.slice(1) : d;
  const a = body.slice(0, 3);
  const b = body.slice(3, 6);
  const c = body.slice(6, 8);
  const e = body.slice(8, 10);
  let out = "+7";
  if (a.length > 0) {
    out += ` (${a}`;
    if (a.length === 3) out += ")";
  }
  if (b.length > 0) {
    if (a.length === 3) out += " ";
    out += b;
  }
  if (c.length > 0) out += `-${c}`;
  if (e.length > 0) out += `-${e}`;
  return out;
}
