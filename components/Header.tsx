"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/#about", label: "О нас" },
  { href: "/#pricing", label: "Услуги и цены" },
  { href: "/#advantages", label: "Почему мы" },
  { href: "/#portfolio", label: "Портфолио" },
  { href: "/#contacts", label: "Контакты" }
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ${scrolled ? "py-3" : "py-5"}`}
    >
      <div
        className={`mx-auto flex w-[92%] max-w-6xl items-center justify-between rounded-2xl px-4 md:px-6 ${
          scrolled ? "glass-card backdrop-blur-lg" : ""
        }`}
      >
        <a
          href="/#hero"
          className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 bg-clip-text py-3 text-xl font-extrabold text-transparent [font-family:var(--font-montserrat)]"
        >
          TrueWeb
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-link-underline text-base font-bold">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <motion.button
            aria-label="Переключить тему"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            whileTap={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="glass-card flex h-11 w-11 items-center justify-center rounded-xl"
          >
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>

          <button
            aria-label="Открыть меню"
            onClick={() => setOpen((prev) => !prev)}
            className="glass-card flex h-11 w-11 items-center justify-center rounded-xl md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="glass-card fixed right-4 top-20 w-64 p-5 md:hidden"
          >
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-base font-medium hover:bg-white/10"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </header>
  );
}
