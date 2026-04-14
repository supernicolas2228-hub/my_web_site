import { organizationJsonLdId } from "@/lib/seo-ids";
import { getSiteUrl } from "@/lib/site-legal";

type Props = {
  path: "/sozdanie-sajtov" | "/telegram-boty";
  serviceType: string;
  description: string;
  breadcrumbLabel: string;
};

export default function ServicePageJsonLd({ path, serviceType, description, breadcrumbLabel }: Props) {
  const base = getSiteUrl();
  const pageUrl = `${base}${path}`;
  const graph = [
    {
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: serviceType,
      serviceType,
      description,
      url: pageUrl,
      provider: { "@id": organizationJsonLdId() },
      areaServed: { "@type": "Country", name: "Россия" }
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: base },
        { "@type": "ListItem", position: 2, name: breadcrumbLabel, item: pageUrl }
      ]
    }
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
