import { getSiteLegal } from "@/lib/site-legal";
import Link from "next/link";

export default function Footer() {
  const L = getSiteLegal();
  const year = new Date().getFullYear();

  return (
    <footer className="px-4 pb-10 pt-4 text-slate-700 dark:text-slate-200">
      <div className="mx-auto w-full max-w-6xl border-t border-white/20 pt-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-heading text-sm font-bold text-slate-900 dark:text-white">Документы</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="underline-offset-2 hover:underline">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/payment-refund" className="underline-offset-2 hover:underline">
                  Оплата и возврат
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="underline-offset-2 hover:underline">
                  Доставка и сроки
                </Link>
              </li>
              <li>
                <Link href="/requisites" className="underline-offset-2 hover:underline">
                  Реквизиты
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-heading text-sm font-bold text-slate-900 dark:text-white">Контакты</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={`mailto:${L.email}`} className="underline-offset-2 hover:underline">
                  {L.email}
                </a>
              </li>
              <li>
                <a href={`tel:${L.phoneTel}`} className="underline-offset-2 hover:underline">
                  {L.phoneDisplay}
                </a>
              </li>
              {L.legalAddress ? (
                <li className="text-xs leading-snug opacity-90">{L.legalAddress}</li>
              ) : null}
            </ul>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-heading text-sm font-bold text-slate-900 dark:text-white">Исполнитель</p>
            <p className="mt-3 text-xs leading-relaxed opacity-90">
              {L.soleProprietorFio}. ИНН {L.inn}
              {L.ogrnip ? ` · ОГРНИП ${L.ogrnip}` : ""}.
            </p>
            <p className="mt-4 text-center text-xs text-slate-600 dark:text-white/70 sm:text-left">
              © {year} {L.brandName}. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
