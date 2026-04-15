"use client";

import { useCart } from "@/context/CartContext";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, ShoppingCart, Sun, User, X } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/#directions", label: "Услуги" },
  { href: "/#about", label: "О нас" },
  { href: "/#pricing", label: "Наши продукты" },
  { href: "/#reviews", label: "Отзывы" },
  { href: "/#advantages", label: "Почему мы" },
  { href: "/#faq", label: "Вопросы и ответы" },
  { href: "/#contacts", label: "Контакты" }
];

const iconBtnClass =
  "header-icon-btn glass-card relative flex h-11 w-11 items-center justify-center rounded-xl outline-none ring-indigo-400/0 focus-visible:ring-2 focus-visible:ring-indigo-400/60";

const navLinkClass =
  "nav-link-underline inline-flex h-11 shrink-0 items-center whitespace-nowrap text-center text-[0.8125rem] font-semibold leading-none tracking-tight text-slate-900 transition-transform duration-300 ease-out will-change-transform hover:-translate-y-0.5 active:scale-[0.98] dark:text-white xl:text-sm 2xl:text-[0.95rem]";

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
      {/* Панель всегда «стекло», иначе сверху «пусто»; при скролле чуть сильнее тень */}
      <div
        className={`mx-auto grid w-[92%] max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-x-3 rounded-2xl border border-white/25 bg-[var(--glass-bg)] px-4 py-2 shadow-[0_4px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-[box-shadow,background-color] duration-300 md:gap-x-4 md:px-6 md:py-2.5 dark:border-white/15 dark:shadow-[0_4px_30px_rgba(0,0,0,0.25)] ${
          scrolled ? "shadow-[0_8px_40px_rgba(99,102,241,0.12)] ring-1 ring-indigo-500/10 dark:shadow-[0_8px_40px_rgba(0,0,0,0.45)] dark:ring-white/10" : ""
        }`}
      >
        <a
          href="/#hero"
          className="header-pill inline-flex h-11 shrink-0 items-center justify-self-start rounded-lg bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 bg-clip-text px-1 text-lg font-extrabold leading-none text-transparent [font-family:var(--font-montserrat)] sm:text-xl"
        >
          TrueWeb
        </a>

        {/* items-center: одна линия с логотипом и кнопками; небольшой нижний отступ — подчёркивание не режет overflow-x */}
        <nav className="hidden min-h-11 min-w-0 w-full max-w-full flex-nowrap items-center justify-center justify-self-center gap-x-2 overflow-x-auto overscroll-x-contain pb-1 sm:gap-x-3 xl:gap-x-5 lg:flex [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={navLinkClass}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <Link
            href="/account"
            className="header-pill hidden h-11 items-center whitespace-nowrap rounded-xl px-2.5 text-sm font-semibold leading-none text-slate-900 opacity-95 hover:bg-white/15 dark:text-white lg:inline-flex xl:px-3"
          >
            Личный кабинет
          </Link>

          <Link
            href="/account"
            className={`group ${iconBtnClass} text-slate-900 dark:text-white lg:hidden`}
            aria-label="Личный кабинет"
          >
            <User size={18} className="transition-transform duration-200 group-hover:scale-110" />
          </Link>

          <Link
            href="/cart"
            className={`group ${iconBtnClass} text-slate-900 dark:text-white`}
            aria-label="Корзина"
          >
            <ShoppingCart size={18} className="transition-transform duration-200 group-hover:rotate-[-8deg] group-hover:scale-110" />
            <AnimatePresence mode="popLayout">
              {totalCount > 0 && (
                <motion.span
                  key={totalCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 26 }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white shadow-md shadow-fuchsia-500/40"
                >
                  {totalCount > 99 ? "99+" : totalCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            type="button"
            aria-label="Переключить тему"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={`${iconBtnClass} text-slate-900 dark:text-white`}
          >
            <span className="inline-flex transition-transform duration-300 hover:rotate-12">
              {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </span>
          </button>

          <button
            type="button"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((prev) => !prev)}
            className={`${iconBtnClass} shrink-0 text-slate-900 lg:hidden dark:text-white`}
          >
            <span
              key={open ? "x" : "m"}
              className="inline-flex transition-transform duration-200 ease-out"
              style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </span>
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
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group relative overflow-hidden rounded-xl px-3 py-2.5 text-base font-medium text-slate-900 transition-colors hover:bg-white/15 active:scale-[0.99] dark:text-white"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="relative z-10 transition-transform duration-200 group-hover:translate-x-1">
                    {item.label}
                  </span>
                  <span
                    className="absolute bottom-1 left-3 right-3 h-px origin-left scale-x-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-transform duration-300 group-hover:scale-x-100"
                    aria-hidden
                  />
                </motion.a>
              ))}
              <motion.div
                className="mt-2 flex flex-col gap-1 border-t border-white/20 pt-3 dark:border-white/10"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navItems.length * 0.04 }}
              >
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="header-pill rounded-xl px-3 py-2.5 text-base font-medium text-slate-900 hover:bg-white/15 dark:text-white"
                >
                  Личный кабинет
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="header-pill rounded-xl px-3 py-2.5 text-base font-medium text-slate-900 hover:bg-white/15 dark:text-white"
                >
                  Корзина {totalCount > 0 ? `(${totalCount})` : ""}
                </Link>
              </motion.div>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </header>
  );
}
