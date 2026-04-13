"use client";

import { useCart } from "@/context/CartContext";
import { Menu, Moon, ShoppingCart, Sun, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/#about", label: "О нас" },
  { href: "/#pricing", label: "Наши продукты" },
  { href: "/#portfolio", label: "Наше портфолио" },
  { href: "/#advantages", label: "Почему мы" },
  { href: "/#faq", label: "Вопросы и ответы" },
  { href: "/#contacts", label: "Контакты" }
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const { totalCount } = useCart();

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
          <Link
            href="/account"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold opacity-90 hover:bg-white/10 md:inline-block"
          >
            Личный кабинет
          </Link>
          <Link
            href="/cart"
            className="glass-card relative flex h-11 w-11 items-center justify-center rounded-xl"
            aria-label="Корзина"
          >
            <ShoppingCart size={18} />
            {totalCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white">
                {totalCount > 99 ? "99+" : totalCount}
              </span>
            )}
          </Link>
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
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-base font-medium hover:bg-white/10"
              >
                Личный кабинет
              </Link>
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-base font-medium hover:bg-white/10"
              >
                Корзина {totalCount > 0 ? `(${totalCount})` : ""}
              </Link>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </header>
  );
}
