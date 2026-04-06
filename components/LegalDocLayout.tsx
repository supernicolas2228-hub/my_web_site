import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Link from "next/link";

export default function LegalDocLayout({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="relative min-h-screen px-3 pb-20 pt-24 sm:px-4">
        <div className="site-container relative z-10 max-w-3xl">
          <article className="glass-card px-6 py-10 md:px-10 md:py-12">
            <Link
              href="/"
              className="mb-8 inline-flex min-h-10 items-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-800 backdrop-blur-sm transition hover:bg-white/20 dark:border-white/25 dark:bg-white/10 dark:text-white"
            >
              ← На главную
            </Link>
            <h1 className="font-heading text-3xl font-bold md:text-4xl">{title}</h1>
            <div className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 dark:text-slate-100 [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_strong]:font-semibold">
              {children}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
