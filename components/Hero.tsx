"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

export default function Hero() {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorMode, setCalculatorMode] = useState<"chooser" | "test">("chooser");
  const [hoveredMode, setHoveredMode] = useState<"test" | "ai" | null>(null);
  const [projectType, setProjectType] = useState<"business" | "businessCard" | "landing" | "bot">("landing");
  const [businessSphere, setBusinessSphere] = useState<
    "services" | "beauty" | "medicine" | "education" | "realty" | "ecommerce" | "other"
  >("services");
  const [mainGoal, setMainGoal] = useState<"leads" | "sales" | "brand" | "automation">("leads");
  const [pageCount, setPageCount] = useState<"one" | "small" | "medium" | "large">("small");
  const [businessStructure, setBusinessStructure] = useState<"simple" | "catalog" | "extended">("simple");
  const [visitcardContent, setVisitcardContent] = useState<"basic" | "portfolio" | "full">("basic");
  const [landingFunnel, setLandingFunnel] = useState<"simple" | "quiz" | "advanced">("simple");
  const [botScenario, setBotScenario] = useState<"faq" | "leads" | "sales">("faq");
  const [botFlows, setBotFlows] = useState<"few" | "medium" | "many">("few");
  const [botNeedsCrm, setBotNeedsCrm] = useState(false);
  const [deadline, setDeadline] = useState<"normal" | "fast" | "urgent">("normal");
  const [designLevel, setDesignLevel] = useState<"template" | "custom">("template");
  const [needCopywriting, setNeedCopywriting] = useState(false);
  const [needCms, setNeedCms] = useState(false);
  const [needBlog, setNeedBlog] = useState(false);
  const [needForms, setNeedForms] = useState(true);
  const [needAnimations, setNeedAnimations] = useState(false);
  const [extraSeo, setExtraSeo] = useState(false);
  const [extraIntegrations, setExtraIntegrations] = useState(false);
  const [extraMultilang, setExtraMultilang] = useState(false);

  const estimatedPrice = useMemo(() => {
    const baseByType = {
      business: 14990,
      businessCard: 7990,
      landing: 8990,
      bot: 5000
    } as const;

    let total = baseByType[projectType];
    const sphereExtra = {
      services: 0,
      beauty: 1500,
      medicine: 3500,
      education: 2500,
      realty: 3000,
      ecommerce: 5000,
      other: 2000
    } as const;
    total += sphereExtra[businessSphere];

    const goalExtra = {
      leads: 0,
      sales: 3500,
      brand: 2500,
      automation: 5500
    } as const;
    total += goalExtra[mainGoal];

    if (projectType !== "bot") {
      const pagesExtra = {
        one: 0,
        small: 5000,
        medium: 11000,
        large: 20000
      } as const;
      total += pagesExtra[pageCount];
    }

    if (projectType === "business") {
      const businessStructureExtra = {
        simple: 0,
        catalog: 4500,
        extended: 9000
      } as const;
      total += businessStructureExtra[businessStructure];
    }

    if (projectType === "businessCard") {
      const visitcardContentExtra = {
        basic: 0,
        portfolio: 2500,
        full: 5000
      } as const;
      total += visitcardContentExtra[visitcardContent];
    }

    if (projectType === "landing") {
      const landingFunnelExtra = {
        simple: 0,
        quiz: 3000,
        advanced: 6000
      } as const;
      total += landingFunnelExtra[landingFunnel];
    }

    if (projectType === "bot") {
      const botScenarioExtra = {
        faq: 0,
        leads: 2500,
        sales: 4500
      } as const;
      const botFlowsExtra = {
        few: 0,
        medium: 3000,
        many: 6000
      } as const;
      total += botScenarioExtra[botScenario];
      total += botFlowsExtra[botFlows];
      if (botNeedsCrm) total += 4500;
    }

    if (deadline === "fast") total += 5000;
    if (deadline === "urgent") total += 10000;
    if (designLevel === "custom") total += 9000;
    if (needCopywriting) total += 5000;
    if (needCms) total += 4500;
    if (needBlog) total += 3500;
    if (needForms) total += 2000;
    if (needAnimations) total += 3000;
    if (extraSeo) total += 5000;
    if (extraIntegrations) total += 7000;
    if (extraMultilang) total += 4500;
    return total;
  }, [
    botFlows,
    botNeedsCrm,
    botScenario,
    businessStructure,
    businessSphere,
    deadline,
    designLevel,
    extraIntegrations,
    extraMultilang,
    extraSeo,
    landingFunnel,
    mainGoal,
    needAnimations,
    needBlog,
    needCms,
    needCopywriting,
    needForms,
    pageCount,
    projectType,
    visitcardContent
  ]);

  const formattedPrice = new Intl.NumberFormat("ru-RU").format(estimatedPrice);

  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center px-3 pt-24 sm:px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-24 h-72 w-72 animate-float rounded-full bg-indigo-500/25 blur-3xl" />
        <div
          className="absolute right-0 top-1/2 h-80 w-80 animate-float rounded-full bg-sky-400/20 blur-3xl"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute bottom-10 left-1/3 h-64 w-64 animate-float rounded-full bg-fuchsia-500/20 blur-3xl"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <div className="glass-card relative z-10 mx-auto w-full max-w-4xl px-5 py-12 text-center sm:px-6 md:px-10">
        <h1 className="font-heading text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
          TrueWeb
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-700 dark:text-white md:text-lg">
          Создаём продукты для роста вашего бизнеса.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <motion.a
            href="https://t.me/Site_and_Bot_Lab_bot"
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99,102,241,0.4)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 font-semibold text-white shadow-glass"
          >
            Написать в Telegram
          </motion.a>
          <span className="px-1 text-sm font-semibold uppercase tracking-wide opacity-75">или</span>
          <motion.button
            type="button"
            onClick={() => {
              setCalculatorMode("chooser");
              setHoveredMode(null);
              setIsCalculatorOpen(true);
            }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99,102,241,0.4)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 font-semibold text-white shadow-glass"
          >
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 3a9 9 0 1 0 9 9"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                />
              </svg>
              Рассчитать стоимость
            </span>
          </motion.button>
        </div>
      </div>

      {isCalculatorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center"
          onClick={() => setIsCalculatorOpen(false)}
        >
          <div
            className="glass-card w-full max-w-2xl overflow-y-auto rounded-2xl p-6 sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Расчёт стоимости</h2>
                <p className="mt-1 text-sm opacity-80">
                  {calculatorMode === "chooser"
                    ? "Выберите удобный формат: быстрый тест или чат с ИИ."
                    : "Ответьте на вопросы, и мы покажем ориентировочную цену."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-sm opacity-80 hover:bg-white/10"
              >
                Закрыть
              </button>
            </div>

            {calculatorMode === "chooser" ? (
              <div className="mt-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredMode("test")}
                    onMouseLeave={() => setHoveredMode(null)}
                    onFocus={() => setHoveredMode("test")}
                    onBlur={() => setHoveredMode(null)}
                    onClick={() => setCalculatorMode("test")}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-3 font-semibold transition hover:bg-white/20"
                  >
                    Тест
                  </button>
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredMode("ai")}
                    onMouseLeave={() => setHoveredMode(null)}
                    onFocus={() => setHoveredMode("ai")}
                    onBlur={() => setHoveredMode(null)}
                    onClick={() => {
                      setIsCalculatorOpen(false);
                      window.location.assign("/ai-chat");
                    }}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-3 font-semibold transition hover:bg-white/20"
                  >
                    ИИ
                  </button>
                </div>
                <div className="mt-4 rounded-xl border border-white/25 bg-white/5 p-3 text-sm opacity-90">
                  {hoveredMode === "ai" && "С помощью ИИ можно задавать вопросы и получить расчёт стоимости в формате чата."}
                  {hoveredMode === "test" &&
                    "Пройти тест и выбрать, каким вы хотите видеть сайт: сфера, цели, функции и сроки."}
                  {!hoveredMode && "Наведите курсор на кнопку, чтобы увидеть описание."}
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4 text-left">
                <button
                  type="button"
                  onClick={() => setCalculatorMode("chooser")}
                  className="rounded-lg border border-white/25 px-3 py-1.5 text-sm opacity-85 hover:bg-white/10"
                >
                  ← Назад к выбору
                </button>
              <label className="block text-sm">
                <span className="mb-1 block opacity-80">Что вы хотите создать?</span>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as "business" | "businessCard" | "landing" | "bot")}
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                >
                  <option value="business">Сайт-Бизнес</option>
                  <option value="businessCard">Сайт-Визитка</option>
                  <option value="landing">Лендинг</option>
                  <option value="bot">Бот для Telegram</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block opacity-80">Сфера бизнеса</span>
                <select
                  value={businessSphere}
                  onChange={(e) =>
                    setBusinessSphere(
                      e.target.value as "services" | "beauty" | "medicine" | "education" | "realty" | "ecommerce" | "other"
                    )
                  }
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                >
                  <option value="services">Услуги (ремонт, консалтинг, B2B)</option>
                  <option value="beauty">Красота и здоровье</option>
                  <option value="medicine">Медицина и клиники</option>
                  <option value="education">Образование и курсы</option>
                  <option value="realty">Недвижимость</option>
                  <option value="ecommerce">Товары и e-commerce</option>
                  <option value="other">Другая сфера</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block opacity-80">Главная цель сайта</span>
                <select
                  value={mainGoal}
                  onChange={(e) => setMainGoal(e.target.value as "leads" | "sales" | "brand" | "automation")}
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                >
                  <option value="leads">Получать заявки</option>
                  <option value="sales">Прямые продажи</option>
                  <option value="brand">Укрепить бренд</option>
                  <option value="automation">Автоматизировать процессы</option>
                </select>
              </label>

              {projectType !== "bot" && (
                <label className="block text-sm">
                  <span className="mb-1 block opacity-80">Сколько страниц планируете?</span>
                  <select
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value as "one" | "small" | "medium" | "large")}
                    className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                  >
                    <option value="one">1 страница</option>
                    <option value="small">До 5 страниц</option>
                    <option value="medium">6-15 страниц</option>
                    <option value="large">16+ страниц</option>
                  </select>
                </label>
              )}

              {projectType === "business" && (
                <label className="block text-sm">
                  <span className="mb-1 block opacity-80">Структура сайта-бизнес</span>
                  <select
                    value={businessStructure}
                    onChange={(e) => setBusinessStructure(e.target.value as "simple" | "catalog" | "extended")}
                    className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                  >
                    <option value="simple">Базовая структура (главная + услуги)</option>
                    <option value="catalog">С каталогом услуг и кейсами</option>
                    <option value="extended">Расширенная структура (разделы, кейсы, блог)</option>
                  </select>
                </label>
              )}

              {projectType === "businessCard" && (
                <label className="block text-sm">
                  <span className="mb-1 block opacity-80">Наполнение сайта-визитки</span>
                  <select
                    value={visitcardContent}
                    onChange={(e) => setVisitcardContent(e.target.value as "basic" | "portfolio" | "full")}
                    className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                  >
                    <option value="basic">Базово: о нас, контакты, услуги</option>
                    <option value="portfolio">Плюс портфолио и отзывы</option>
                    <option value="full">Плюс цены, FAQ и формы захвата</option>
                  </select>
                </label>
              )}

              {projectType === "landing" && (
                <label className="block text-sm">
                  <span className="mb-1 block opacity-80">Воронка для лендинга</span>
                  <select
                    value={landingFunnel}
                    onChange={(e) => setLandingFunnel(e.target.value as "simple" | "quiz" | "advanced")}
                    className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                  >
                    <option value="simple">Простая: оффер + форма</option>
                    <option value="quiz">С квизом/калькулятором</option>
                    <option value="advanced">Сложная: прогрев, кейсы, несколько CTA</option>
                  </select>
                </label>
              )}

              {projectType === "bot" && (
                <>
                  <label className="block text-sm">
                    <span className="mb-1 block opacity-80">Тип Telegram-бота</span>
                    <select
                      value={botScenario}
                      onChange={(e) => setBotScenario(e.target.value as "faq" | "leads" | "sales")}
                      className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                    >
                      <option value="faq">Бот-ответы (FAQ/поддержка)</option>
                      <option value="leads">Бот для заявок</option>
                      <option value="sales">Бот для продаж и оплат</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block opacity-80">Сколько сценариев диалога?</span>
                    <select
                      value={botFlows}
                      onChange={(e) => setBotFlows(e.target.value as "few" | "medium" | "many")}
                      className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                    >
                      <option value="few">1-3 сценария</option>
                      <option value="medium">4-8 сценариев</option>
                      <option value="many">9+ сценариев</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={botNeedsCrm} onChange={(e) => setBotNeedsCrm(e.target.checked)} />
                    Интеграция бота с CRM
                  </label>
                </>
              )}

              <label className="block text-sm">
                <span className="mb-1 block opacity-80">Срок запуска</span>
                <select
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value as "normal" | "fast" | "urgent")}
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                >
                  <option value="normal">Стандартный</option>
                  <option value="fast">Быстрее обычного</option>
                  <option value="urgent">Срочно</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block opacity-80">Уровень дизайна</span>
                <select
                  value={designLevel}
                  onChange={(e) => setDesignLevel(e.target.value as "template" | "custom")}
                  className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-indigo-400"
                >
                  <option value="template">На основе готовых решений</option>
                  <option value="custom">Полностью уникальный дизайн</option>
                </select>
              </label>

              <fieldset className="space-y-2 text-sm">
                <legend className="mb-1 opacity-80">Нужны дополнительные опции?</legend>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={needCopywriting}
                    onChange={(e) => setNeedCopywriting(e.target.checked)}
                  />
                  Копирайтинг (подготовка продающих текстов)
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={needCms} onChange={(e) => setNeedCms(e.target.checked)} />
                  Админ-панель для редактирования контента
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={needBlog} onChange={(e) => setNeedBlog(e.target.checked)} />
                  Блог / новости
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={needForms} onChange={(e) => setNeedForms(e.target.checked)} />
                  Формы заявок и обратный звонок
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={needAnimations}
                    onChange={(e) => setNeedAnimations(e.target.checked)}
                  />
                  Анимации и интерактивные блоки
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={extraSeo} onChange={(e) => setExtraSeo(e.target.checked)} />
                  SEO-подготовка и аналитика
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={extraIntegrations}
                    onChange={(e) => setExtraIntegrations(e.target.checked)}
                  />
                  Интеграции (CRM, формы, оплаты, боты)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={extraMultilang}
                    onChange={(e) => setExtraMultilang(e.target.checked)}
                  />
                  Мультиязычность
                </label>
              </fieldset>

              <div className="mt-6 rounded-xl border border-indigo-400/40 bg-indigo-500/10 p-4 text-left">
                <p className="text-sm opacity-80">Ориентировочная стоимость проекта:</p>
                <p className="mt-1 text-2xl font-extrabold">{formattedPrice} ₽</p>
                <p className="mt-2 text-xs opacity-75">
                  Точная цена зависит от финального ТЗ. Для точного расчета оставьте заявку в разделе контактов.
                </p>
              </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
