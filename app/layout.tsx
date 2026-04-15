import ApexToWwwRedirect from "@/components/ApexToWwwRedirect";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";
import ClientProviders from "@/components/ClientProviders";
import { getSiteUrl } from "@/lib/site-legal";
import type { Metadata } from "next";
import { Manrope, Montserrat } from "next/font/google";
import "./globals.css";

/** Syne без кириллицы — на телефонах заголовки выглядели «чужим» системным шрифтом. Заголовки = Montserrat (cyrillic). */
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
  adjustFontFallback: true
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  display: "swap",
  adjustFontFallback: true
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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "TrueWeb — создание сайтов и Telegram‑ботов под ключ",
    template: "%s — TrueWeb"
  },
  description:
    "Создание сайтов под ключ, интернет‑магазинов и разработка ботов для Telegram. Лендинги, каталоги, оплата онлайн, запуск и поддержка — TrueWeb.",
  applicationName: "TrueWeb",
  keywords: [
    "создание сайтов",
    "создание сайта под ключ",
    "разработка сайтов",
    "заказать сайт",
    "лендинг",
    "интернет магазин под ключ",
    "telegram бот",
    "создание ботов телеграм",
    "разработка telegram бота",
    "чат бот",
    "веб разработка",
    "TrueWeb"
  ],
  appleWebApp: {
    capable: true,
    title: "TrueWeb",
    statusBarStyle: "default"
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "TrueWeb — создание сайтов и Telegram‑ботов под ключ",
    description:
      "Создание сайтов и разработка Telegram‑ботов: лендинги, магазины, автоматизация заявок и оплат. Запуск и поддержка.",
    siteName: "TrueWeb",
    locale: "ru_RU",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "TrueWeb" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueWeb — создание сайтов и Telegram‑ботов под ключ",
    description: "Создание сайтов под ключ и разработка ботов в Telegram. Запуск, сопровождение, честные сроки.",
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
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  formatDetection: {
    telephone: false
  },
  verification: siteVerification()
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  /** Не блокируем масштаб — удобство на телефонах и доступность */
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1b4b" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${manrope.variable} ${montserrat.variable} font-body antialiased`}>
        <ApexToWwwRedirect />
        <div className="page-atmosphere" aria-hidden />
        <div className="relative z-10 min-h-screen">
          <OrganizationJsonLd />
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
