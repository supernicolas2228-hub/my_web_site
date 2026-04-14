import Reveal from "@/components/motion/Reveal";
import { TELEGRAM_BOT_LABEL, TELEGRAM_BOT_URL } from "@/lib/public-contact";
import { getPublicPhone, getTelegramPhoneUrl } from "@/lib/site-legal";
import { MessageCircle, Phone } from "lucide-react";

export default function Contacts() {
  const phone = getPublicPhone();
  const ctaClass =
    "cta-shimmer-border btn-hero-cta relative z-0 mx-auto mt-8 inline-flex min-h-11 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 font-semibold text-white shadow-glass";

  return (
    <section id="contacts" className="section-space relative px-3 sm:px-4">
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-4xl animate-glow-pulse rounded-full bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 blur-3xl motion-reduce:animate-none" />
      <div className="site-container relative max-w-3xl">
        <Reveal>
          <div className="glass-card p-8 text-center transition-shadow duration-500 hover:shadow-[0_12px_48px_rgba(99,102,241,0.14)] md:p-10 dark:hover:shadow-[0_12px_48px_rgba(129,140,248,0.12)]">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">Контакты</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm opacity-80">
              Свяжитесь с нами в Telegram — ответим на вопросы по услугам и срокам.
            </p>

            <a
              href={getTelegramPhoneUrl(phone.tel)}
              target="_blank"
              rel="noreferrer"
              className="mx-auto mt-6 inline-flex min-h-11 items-center gap-3 rounded-xl px-4 py-2 text-lg font-semibold hover:bg-white/10"
            >
              <Phone size={20} aria-hidden />
              <span>
                {phone.display}
                <span className="ml-2 text-base font-medium opacity-90">— в Telegram</span>
              </span>
            </a>
            <p className="mx-auto mt-2 max-w-md text-xs leading-snug opacity-75">
              Виртуальный номер: звонки не принимаются, писать можно только в Telegram по ссылке выше.
            </p>

            <a href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer" className={ctaClass}>
              Написать в Telegram
            </a>

            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer"
              className="mx-auto mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 font-semibold hover:bg-white/10"
            >
              <MessageCircle size={18} />
              Бот: {TELEGRAM_BOT_LABEL}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
