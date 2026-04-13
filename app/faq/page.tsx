import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Частые вопросы",
  description:
    "Что такое воронка продаж, лендинг, сайт под ключ, хостинг и домен — объясняем очень простыми словами. TrueWeb."
};

export default function FaqPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen px-3 pb-16 pt-24 sm:px-4">
        <div className="site-container relative z-10 mb-6 max-w-3xl">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-800 backdrop-blur-sm transition hover:bg-white/20 dark:border-white/25 dark:bg-white/10 dark:text-white"
          >
            ← На главную
          </Link>
        </div>
        <Faq />
      </main>
      <Footer />
    </>
  );
}
