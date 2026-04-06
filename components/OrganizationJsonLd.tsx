import { getSiteLegal, getSiteUrl } from "@/lib/site-legal";

export default function OrganizationJsonLd() {
  const base = getSiteUrl();
  const legal = getSiteLegal();
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: legal.brandName,
    url: base,
    logo: `${base}/icon.png`,
    email: legal.email,
    telephone: legal.phoneTel,
    description:
      "Разработка сайтов, лендингов, интернет‑магазинов и Telegram‑ботов под ключ. Цены на сайте в рублях РФ."
  };
  if (legal.legalAddress) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: legal.legalAddress,
      addressCountry: "RU"
    };
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
