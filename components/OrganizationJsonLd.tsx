import { getSiteUrl } from "@/lib/site-legal";

export default function OrganizationJsonLd() {
  const base = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TrueWeb",
    url: base,
    logo: `${base}/icon.png`,
    description:
      "Разработка сайтов, лендингов, интернет‑магазинов и Telegram‑ботов под ключ. Цены на сайте в рублях РФ."
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
