import OrganizationJsonLd from "@/components/OrganizationJsonLd";
import ClientProviders from "@/components/ClientProviders";
import type { Metadata } from "next";
import { Manrope, Montserrat, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  variable: "--font-syne"
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope"
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat"
});

function siteVerification(): Metadata["verification"] | undefined {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const yandex = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION?.trim();
  if (!google && !yandex) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(yandex ? { yandex } : {})
  };
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://truewebwork.ru"),
  title: {
    default: "TrueWeb — разработка сайтов и веб‑сервисов",
    template: "%s — TrueWeb"
  },
  description: "Разработка сайтов под ключ, интернет‑магазинов и веб‑сервисов. Быстрый запуск, поддержка и рост продаж.",
  alternates: {
    canonical: "/"
  },
  applicationName: "TrueWeb",
  keywords: [
    "разработка сайтов",
    "сайт под ключ",
    "лендинг",
    "интернет-магазин",
    "веб-разработка",
    "создание сайта",
    "TrueWeb"
  ],
  openGraph: {
    type: "website",
    url: "/",
    title: "TrueWeb — разработка сайтов и веб‑сервисов",
    description: "Разработка сайтов под ключ, интернет‑магазинов и веб‑сервисов. Быстрый запуск и поддержка.",
    siteName: "TrueWeb",
    locale: "ru_RU",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "TrueWeb" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueWeb — разработка сайтов и веб‑сервисов",
    description: "Разработка сайтов под ключ, интернет‑магазинов и веб‑сервисов.",
    images: ["/og-image.svg"]
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  },
  verification: siteVerification()
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1b4b" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${syne.variable} ${manrope.variable} ${montserrat.variable} font-body antialiased`}>
        <OrganizationJsonLd />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
