import type { Metadata } from "next";
import { Manrope, Montserrat, Syne } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: "TrueWeb",
  description: "TrueWeb: сайты, боты, отзывы и быстрый контакт через Telegram.",
  openGraph: {
    title: "TrueWeb",
    description: "Сайты и боты для бизнеса, отзывы и связь через Telegram-бота.",
    images: ["/og-image.svg"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${syne.variable} ${manrope.variable} ${montserrat.variable} font-body antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
