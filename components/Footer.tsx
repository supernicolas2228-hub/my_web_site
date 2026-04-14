import Reveal from "@/components/motion/Reveal";
import Link from "next/link";

const footerLinks = [
  { href: "/sozdanie-sajtov", label: "Создание сайтов" },
  { href: "/telegram-boty", label: "Боты Telegram" },
  { href: "/about", label: "О компании" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Конфиденциальность" }
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="footer" className="px-4 pb-10 pt-4 text-slate-700 dark:text-slate-200">
      <div className="mx-auto w-full max-w-6xl border-t border-white/20 pt-8">
        <Reveal y={12}>
          <nav
            aria-label="Дополнительные разделы"
            className="mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-slate-600 dark:text-white/75"
          >
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-1 underline-offset-2 hover:text-indigo-600 hover:underline dark:hover:text-indigo-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-center text-xs text-slate-600 dark:text-white/70">
            © {year} TrueWeb. Все права защищены.
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
