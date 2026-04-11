import LegalDocLayout from "@/components/LegalDocLayout";
import { TELEGRAM_BOT_LABEL, TELEGRAM_BOT_URL } from "@/lib/public-contact";
import { getSiteUrl } from "@/lib/site-legal";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Доставка и сроки",
  description:
    "Способы и сроки передачи результатов услуг TrueWeb: электронная поставка, доступы, сопровождение.",
  alternates: { canonical: "/delivery" }
};

export default function DeliveryPage() {
  const site = getSiteUrl();

  return (
    <LegalDocLayout title="Доставка и сроки оказания услуг">
      <p className="text-sm opacity-80">
        Услуги TrueWeb — цифровые; физическая доставка товаров не выполняется. Сайт: <strong>{site}</strong>.
      </p>

      <h2>1. Территория и способ «доставки»</h2>
      <p>
        Результаты услуг (проекты сайтов, настройки хостинга, боты, исходные материалы и доступы) передаются по
        электронным каналам: мессенджеры (в т. ч. Telegram), личный кабинет на Сайте, предоставление URL и учётных
        записей. Стоимость передачи включена в цену услуги; отдельная плата за передачу по сети не взимается.
      </p>

      <h2>2. Сроки</h2>
      <p>
        Ориентировочные сроки готовности базовых пакетов услуг указаны в каталоге на главной Сайта (раздел с ценами в
        рублях). Точные сроки фиксируются в переписке с Исполнителем с учётом объёма и согласования макета.
      </p>
      <p>
        Если иное не согласовано, начало оказания услуги — в течение 3 рабочих дней после поступления оплаты и
        предоставления необходимых материалов от Заказчика (опросник, доступы к домену и т. п.).
      </p>

      <h2>3. Приём результата</h2>
      <p>
        Заказчик обязан проверить переданные материалы и сообщить о замечаниях в разумный срок (до 14 календарных дней с
        момента передачи, если в переписке не установлено иное). Молчание после истечения срока может рассматриваться как
        принятие результата при отсутствии существенных недостатков.
      </p>

      <h2>4. Контакты</h2>
      <p>
        Вопросы по срокам и передаче проекта — в Telegram:{" "}
        <a href={TELEGRAM_BOT_URL} className="font-medium underline underline-offset-2" target="_blank" rel="noreferrer">
          {TELEGRAM_BOT_LABEL}
        </a>
        .
      </p>

      <p className="text-sm opacity-80">
        <Link href="/payment-refund" className="underline underline-offset-2">
          Оплата и возврат
        </Link>
        {" · "}
        <Link href="/privacy" className="underline underline-offset-2">
          Политика конфиденциальности
        </Link>
      </p>
    </LegalDocLayout>
  );
}
