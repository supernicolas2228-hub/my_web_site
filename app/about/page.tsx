import type { Metadata } from "next";
import Link from "next/link";
import AboutPageContent from "@/components/AboutPageContent";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "О нас | TrueWeb",
  description:
    "True Web — сайты, которые работают на бизнес: веб-дизайн, UX/UI и продающие цифровые решения от команды TrueWeb."
};

export default function AboutFullPage() {
  return (
    <>
      <Header />
      <main
        id="about-page"
        className="about-full-page relative min-h-screen px-3 pb-20 pt-24 sm:px-4"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-24 h-72 w-72 animate-float rounded-full bg-indigo-500/25 blur-3xl" />
          <div
            className="absolute right-0 top-1/2 h-80 w-80 animate-float rounded-full bg-sky-400/20 blur-3xl"
            style={{ animationDelay: "1.5s" }}
          />
          <div
            className="absolute bottom-10 left-1/3 h-64 w-64 animate-float rounded-full bg-fuchsia-500/20 blur-3xl"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="site-container relative z-10 max-w-4xl">
          <div className="glass-card px-6 py-10 md:px-10 md:py-12">
            <Link
              href="/"
              className="mb-8 inline-flex min-h-10 items-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-800 backdrop-blur-sm transition hover:bg-white/20 dark:border-white/25 dark:bg-white/10 dark:text-white"
            >
              ← На главную
            </Link>
            <h1 className="font-heading text-3xl font-bold md:text-4xl">О нас</h1>
            <div className="mt-8">
              <AboutPageContent />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
