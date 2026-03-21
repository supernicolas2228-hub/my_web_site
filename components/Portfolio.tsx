"use client";

import { motion } from "framer-motion";

export default function Portfolio() {
  return (
    <section id="portfolio" className="section-space px-3 sm:px-4">
      <div className="site-container">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">Портфолио</h2>
        <div className="mt-10 flex justify-center">
          <div className="flex w-full max-w-3xl flex-col items-stretch justify-center gap-4 sm:gap-5">
            <motion.a
              href="https://disk.yandex.ru/d/ZDM9-AR8LwjYWw"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99,102,241,0.4)" }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="glass-card inline-flex min-h-16 items-center justify-center px-8 py-5 text-lg font-semibold md:text-xl"
            >
              Портфолио на Яндекс Диск
            </motion.a>
            <motion.a
              href="https://drive.google.com/drive/folders/148LqiojSAFOb20QP93K4K0o3_jIbtCPK?usp=drive_link"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99,102,241,0.4)" }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="glass-card inline-flex min-h-16 items-center justify-center px-8 py-5 text-lg font-semibold md:text-xl"
            >
              Портфолио на Google Drive
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
}
