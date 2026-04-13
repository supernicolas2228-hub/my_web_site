import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://truewebwork.ru").replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/"]
      },
      { userAgent: "Googlebot", allow: "/", disallow: ["/admin", "/admin/"] },
      { userAgent: "Yandex", allow: "/", disallow: ["/admin", "/admin/"] }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
