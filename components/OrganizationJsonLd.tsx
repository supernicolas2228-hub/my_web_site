import { organizationJsonLdId, websiteJsonLdId } from "@/lib/seo-ids";
import { getSiteUrl } from "@/lib/site-legal";

export default function OrganizationJsonLd() {
  const base = getSiteUrl();
  const graph = [
    {
      "@type": "Organization",
      "@id": organizationJsonLdId(),
      name: "TrueWeb",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/icon.png`,
        width: 512,
        height: 512
      },
      description:
        "TrueWeb — создание сайтов под ключ, интернет‑магазинов и разработка Telegram‑ботов. Веб‑дизайн, запуск и поддержка.",
      knowsAbout: [
        "Создание сайтов",
        "Разработка сайтов под ключ",
        "Интернет-магазин",
        "Telegram-бот",
        "Разработка ботов для Telegram",
        "Веб-разработка",
        "Лендинг"
      ]
    },
    {
      "@type": "WebSite",
      "@id": websiteJsonLdId(),
      url: base,
      name: "TrueWeb",
      inLanguage: "ru-RU",
      publisher: { "@id": organizationJsonLdId() }
    }
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
