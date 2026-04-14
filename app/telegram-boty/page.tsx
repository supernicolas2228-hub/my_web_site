import LegalDocLayout from "@/components/LegalDocLayout";
import ServicePageJsonLd from "@/components/ServicePageJsonLd";
import type { Metadata } from "next";
import Link from "next/link";

const path = "/telegram-boty" as const;

export const metadata: Metadata = {
  title: "Создание ботов для Telegram — разработка под заказ",
  description:
    "Заказать разработку Telegram‑бота: заявки, оплаты, рассылки, интеграция с CRM и сайтом. Создание чат‑ботов в Telegram под ваш сценарий — TrueWeb.",
  keywords: [
    "создание ботов телеграм",
    "разработка telegram бота",
    "telegram бот под ключ",
    "чат бот телеграм",
    "создание чат бота",
    "бот для бизнеса telegram",
    "TrueWeb"
  ],
  alternates: { canonical: path },
  openGraph: {
    type: "article",
    url: path,
    title: "Создание ботов для Telegram — TrueWeb",
    description:
      "Разработка Telegram‑ботов под задачи бизнеса: лиды, оплаты, поддержка, интеграции."
  }
};

export default function TelegramBotyPage() {
  return (
    <>
      <ServicePageJsonLd
        path={path}
        serviceType="Разработка Telegram-ботов и чат-ботов"
        description="Создание ботов в Telegram: приём заявок, оплаты, рассылки, сценарии диалога и интеграции с внешними системами."
        breadcrumbLabel="Боты Telegram"
      />
      <LegalDocLayout title="Создание ботов для Telegram">
        <p className="!mt-0 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
          <strong className="font-semibold">Создание ботов Telegram</strong> под заказ помогает автоматизировать заявки,
          продажи и поддержку без лишней нагрузки на менеджеров. Ниже — типовые сценарии и что важно учесть до старта
          разработки.
        </p>
        <h2>Зачем бизнесу бот в Telegram</h2>
        <p>
          Мессенджер уже есть у аудитории: не нужно ставить отдельное приложение. Бот работает 24/7, одинаково хорошо на
          телефоне и компьютере, его можно связать с сайтом, платёжным провайдером или CRM. Для многих ниш это самый
          короткий путь от интереса к заявке или оплате.
        </p>
        <h2>Что мы можем реализовать</h2>
        <ul>
          <li>
            <strong>Приём заявок и квалификация</strong> — вопросы, ветвление сценария, передача лида на почту или в
            таблицу.
          </li>
          <li>
            <strong>Оплаты и подписки</strong> — связка с вашим процессингом по правилам и договору.
          </li>
          <li>
            <strong>Рассылки</strong> — только после явного согласия пользователя и в рамках политики платформы.
          </li>
          <li>
            <strong>Интеграции</strong> — сайт, внутренние API, Google Sheets, CRM (по возможности и ТЗ).
          </li>
        </ul>
        <h2>Как проходит разработка Telegram‑бота</h2>
        <p>
          Согласуем роли пользователя и администратора, прописываем сценарии и тексты, проектируем обработку ошибок
          (человек ввёл не то, сервис недоступен). После теста на устройствах переносим на ваш аккаунт или сервер и
          подключаем мониторинг. При необходимости дорабатываем логику по обратной связи.
        </p>
        <h2>Сайт и бот вместе</h2>
        <p>
          Часто бот дополняет сайт: на странице кнопка «Открыть в Telegram», с сайта уходит UTM, а бот продолжает диалог.
          Если вам нужен и веб‑проект, и мессенджер, посмотрите также страницу{" "}
          <Link href="/sozdanie-sajtov" className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300">
            создание сайтов под ключ
          </Link>
          .
        </p>
        <h2>Связаться и обсудить задачу</h2>
        <p>
          Тарифы на смежные продукты — на{" "}
          <Link href="/#pricing" className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300">
            главной в блоке продуктов
          </Link>
          . Общие вопросы — в{" "}
          <Link href="/faq" className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300">
            FAQ
          </Link>
          , контакты — внизу главной страницы.
        </p>
      </LegalDocLayout>
    </>
  );
}
