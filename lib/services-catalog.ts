/**
 * Единый каталог услуг: цены считаются на сервере при оплате (клиент не доверяется).
 */
export const SERVICE_IDS = ["business", "landing", "visitcard", "bots"] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export type CatalogService = {
  id: ServiceId;
  title: string;
  /** Цена за единицу, руб (целое) */
  priceRub: number;
  hint: string;
  /** Текст цены для UI */
  priceLabel: string;
};

const servicesBase: Array<Omit<CatalogService, "priceLabel">> = [
  {
    id: "business",
    title: "Сайт-Бизнес",
    priceRub: 14990,
    hint: `Многостраничный продающий бизнес-сайт в короткие сроки
• Полный анализ конкурентов
• Бесплатный домен и хостинг в подарок
• Аналитика и рост бизнеса
• Повышение доверия
• Доступность 24/7
• Абсолютно бесплатное заполнение сайта контентом`
  },
  {
    id: "landing",
    title: "Лендинг",
    priceRub: 8990,
    hint: `Одностраничный сайт за 3 дня
• Бесплатное наполнение живым и продающим контентом
• Современный дизайн и удобство с любого устройства
• Надёжность и доверие со стороны клиентов
• Удобный и понятный интерфейс — быстро находите нужную информацию
• Бесплатный домен и хостинг в подарок
• Полный анализ конкурентов на рынке`
  },
  {
    id: "visitcard",
    title: "Сайт-Визитка",
    priceRub: 7990,
    hint: `Сайт, позволяющий повысить узнаваемость и продажи
• Быстрый запуск — готовый сайт в короткие сроки
• Презентация услуг и портфолио в одном месте
• Знакомит с личным брендом
• Повышение доверия и имиджа компании
• Бесплатный хостинг и домен в подарок
• Повышает узнаваемость компании и привлекает новых клиентов`
  },
  {
    id: "bots",
    title: "Бот Телеграм",
    priceRub: 5000,
    hint: `Telegram-ассистент поможет автоматизировать любую работу
• Приём заявок, оформление заказа — бота можно разработать под любые задачи
• Быстрый запуск в короткие сроки
• Работа 24/7 в любое время суток
• Адаптация под любые задачи`
  }
];

export const SERVICES_CATALOG: CatalogService[] = servicesBase.map((s) => ({
  ...s,
  priceLabel: s.priceRub.toLocaleString("ru-RU")
}));

const catalogById = Object.fromEntries(SERVICES_CATALOG.map((svc) => [svc.id, svc])) as Record<ServiceId, CatalogService>;

export function getServiceById(id: string): CatalogService | undefined {
  if (!SERVICE_IDS.includes(id as ServiceId)) return undefined;
  return catalogById[id as ServiceId];
}

export function isValidServiceId(id: string): id is ServiceId {
  return SERVICE_IDS.includes(id as ServiceId);
}
