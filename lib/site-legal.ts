/**
 * Публичные реквизиты и контакты для сайта, ЮKassa и Robokassa.
 * Совпадение с анкетой — через переменные NEXT_PUBLIC_* на продакшене.
 */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://truewebwork.ru").replace(/\/+$/, "");
}

export type SiteLegal = {
  brandName: string;
  soleProprietorFio: string;
  inn: string;
  ogrnip: string;
  legalAddress: string;
  email: string;
  phoneDisplay: string;
  phoneTel: string;
};

export function getSiteLegal(): SiteLegal {
  const phoneTel = (process.env.NEXT_PUBLIC_CONTACT_PHONE_TEL || "+16822936330").replace(/\s/g, "");
  return {
    brandName: "TrueWeb",
    soleProprietorFio:
      process.env.NEXT_PUBLIC_LEGAL_FULL_NAME || "Леонтьев Андрей Николаевич",
    inn: process.env.NEXT_PUBLIC_LEGAL_INN || "781441795345",
    ogrnip: (process.env.NEXT_PUBLIC_LEGAL_OGRNIP || "").trim(),
    legalAddress: (process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "").trim(),
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@truewebwork.ru",
    phoneDisplay: process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY || "+1 682 293 6330",
    phoneTel: phoneTel.startsWith("+") ? phoneTel : `+${phoneTel}`
  };
}
