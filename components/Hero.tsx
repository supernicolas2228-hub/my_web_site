const cta =
  "cta-shimmer-border btn-hero-cta relative z-0 inline-flex min-h-11 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 font-semibold text-white shadow-glass";

export default function Hero() {
  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center px-3 pt-24 sm:px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-24 h-72 w-72 animate-float rounded-full bg-indigo-500/25 blur-3xl motion-reduce:animate-none" />
        <div
          className="absolute right-0 top-1/2 h-80 w-80 animate-float rounded-full bg-sky-400/20 blur-3xl motion-reduce:animate-none"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute bottom-10 left-1/3 h-64 w-64 animate-float rounded-full bg-fuchsia-500/20 blur-3xl motion-reduce:animate-none"
          style={{ animationDelay: "3s" }}
        />
        <div className="absolute left-1/2 top-1/3 h-[min(90vw,28rem)] w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2 animate-glow-pulse rounded-full bg-gradient-to-tr from-indigo-500/10 via-fuchsia-500/8 to-transparent blur-3xl motion-reduce:animate-none" />
      </div>

      <div className="hero-intro glass-card hero-card-glow relative z-10 mx-auto w-full max-w-4xl px-5 py-12 text-center sm:px-6 md:px-10">
        <h1 className="font-heading text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
          <span className="hero-gradient-text">TrueWeb</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-700 dark:text-white md:text-lg">
          Создаём продукты для роста вашего бизнеса.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href="/#about" className={cta}>
            О нас
          </a>
          <a href="/#reviews" className={cta}>
            Отзывы
          </a>
        </div>
      </div>
    </section>
  );
}
