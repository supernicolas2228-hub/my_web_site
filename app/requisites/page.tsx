import LegalDocLayout from "@/components/LegalDocLayout";
import { getSiteLegal, getSiteUrl } from "@/lib/site-legal";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Реквизиты",
  description: "Реквизиты исполнителя TrueWeb для договоров и платёжных систем.",
  alternates: { canonical: "/requisites" }
};

export default function RequisitesPage() {
  const L = getSiteLegal();
  const site = getSiteUrl();

  return (
    <LegalDocLayout title="Реквизиты исполнителя">
      <p className="text-sm opacity-80">
        Данные должны совпадать с анкетой в ЮKassa и выпиской из ЕГРИП. Публичный адрес страницы:{" "}
        <Link href="/requisites" className="underline underline-offset-2">
          {site}/requisites
        </Link>
        .
      </p>

      <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-5 dark:border-white/20 dark:bg-white/5">
        <p>
          <span className="opacity-70">ФИО / наименование: </span>
          <strong>{L.soleProprietorFio}</strong>
        </p>
        <p>
          <span className="opacity-70">ИНН: </span>
          <strong>{L.inn}</strong>
        </p>
        {L.ogrnip ? (
          <p>
            <span className="opacity-70">ОГРНИП: </span>
            <strong>{L.ogrnip}</strong>
          </p>
        ) : (
          <p className="text-sm opacity-80">
            ОГРНИП: укажите в переменной окружения <code className="rounded bg-black/10 px-1">NEXT_PUBLIC_LEGAL_OGRNIP</code>{" "}
            на сервере, если он у вас есть (как у ИП).
          </p>
        )}
        {L.legalAddress ? (
          <p>
            <span className="opacity-70">Юридический адрес: </span>
            <strong>{L.legalAddress}</strong>
          </p>
        ) : (
          <p className="text-sm opacity-80">
            Юридический адрес: задайте <code className="rounded bg-black/10 px-1">NEXT_PUBLIC_LEGAL_ADDRESS</code> в .env на
            продакшене (тот же, что в ЕГРИП / анкете).
          </p>
        )}
        <p>
          <span className="opacity-70">E-mail: </span>
          <a className="font-semibold underline underline-offset-2" href={`mailto:${L.email}`}>
            {L.email}
          </a>
        </p>
        <p>
          <span className="opacity-70">Телефон: </span>
          <a className="font-semibold underline underline-offset-2" href={`tel:${L.phoneTel}`}>
            {L.phoneDisplay}
          </a>
        </p>
      </div>

      <p className="text-sm opacity-80">
        <Link href="/privacy" className="underline underline-offset-2">
          Политика конфиденциальности
        </Link>
        {" · "}
        <Link href="/payment-refund" className="underline underline-offset-2">
          Оплата и возврат
        </Link>
        {" · "}
        <Link href="/delivery" className="underline underline-offset-2">
          Доставка
        </Link>
      </p>
    </LegalDocLayout>
  );
}
