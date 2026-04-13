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
        className={`mx-auto grid w-[92%] max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-x-3 rounded-2xl px-4 py-2 md:gap-x-4 md:px-6 md:py-2.5 ${
          scrolled ? "glass-card backdrop-blur-lg" : ""
        }`}
      >
        <a
          href="/#hero"
          className="justify-self-start bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 bg-clip-text text-lg font-extrabold leading-none text-transparent [font-family:var(--font-montserrat)] sm:text-xl"
        >
          TrueWeb
        </a>

        <nav className="hidden min-w-0 w-full max-w-full flex-nowrap items-center justify-center justify-self-center gap-x-2 overflow-x-auto overscroll-x-contain sm:gap-x-3 xl:gap-x-5 lg:flex [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="nav-link-underline shrink-0 whitespace-nowrap text-center text-[0.8125rem] font-semibold leading-none tracking-tight xl:text-sm 2xl:text-[0.95rem]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <Link
            href="/account"
            className="hidden whitespace-nowrap rounded-xl px-2.5 py-2 text-sm font-semibold leading-none opacity-90 hover:bg-white/10 lg:inline-block xl:px-3"
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
            className="glass-card flex h-11 w-11 shrink-0 items-center justify-center rounded-xl lg:hidden"
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
            className="glass-card fixed right-4 top-20 z-50 w-[min(18rem,calc(100vw-2rem))] max-h-[min(24rem,calc(100vh-6rem))] overflow-y-auto p-5 lg:hidden"
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
