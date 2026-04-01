"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center px-3 pt-24 sm:px-4">
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

      <div className="glass-card relative z-10 mx-auto w-full max-w-4xl px-5 py-12 text-center sm:px-6 md:px-10">
        <h1 className="font-heading text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
          TrueWeb
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-700 dark:text-white md:text-lg">
          Создаём продукты для роста вашего бизнеса.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <motion.a
            href="/#about"
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99,102,241,0.4)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 font-semibold text-white shadow-glass"
          >
            О нас
          </motion.a>
          <motion.a
            href="/#portfolio"
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99,102,241,0.4)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 font-semibold text-white shadow-glass"
          >
            Наше портфолио
          </motion.a>
        </div>
      </div>
    </section>
  );
}
