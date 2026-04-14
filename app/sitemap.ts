import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${baseUrl}/sozdanie-sajtov`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95
    },
    {
      url: `${baseUrl}/telegram-boty`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${baseUrl}/account`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4
    },
    {
      url: `${baseUrl}/payment-refund`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4
    },
    {
      url: `${baseUrl}/delivery`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4
    }
  ];
}
