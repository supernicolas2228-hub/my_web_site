"use client";

import type { ServiceId } from "@/lib/services-catalog";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useTheme } from "next-themes";

export type CalculatorProjectType = "business" | "businessCard" | "landing" | "bot";

export type OpenCalculatorOptions = {
  /** Предвыбрать тип в тесте (например, из карточки услуги) */
  presetProjectType?: CalculatorProjectType;
  /** Сразу экран теста, без выбора «тест / ИИ» */
  startWithTest?: boolean;
};

type CalculatorContextValue = {
  openCalculator: (options?: OpenCalculatorOptions) => void;
  closeCalculator: () => void;
};

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

const SERVICE_ID_TO_PROJECT: Record<ServiceId, CalculatorProjectType> = {
  business: "business",
  visitcard: "businessCard",
  landing: "landing",
  bots: "bot"
};

export function serviceIdToProjectType(id: ServiceId): CalculatorProjectType {
  return SERVICE_ID_TO_PROJECT[id];
}

export function useCalculator() {
  const ctx = useContext(CalculatorContext);
  if (!ctx) {
    throw new Error("useCalculator must be used within CalculatorProvider");
  }
  return ctx;
}

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [calculatorMode, setCalculatorMode] = useState<"chooser" | "test">("chooser");
  const [hoveredMode, setHoveredMode] = useState<"test" | "ai" | null>(null);
  const [projectType, setProjectType] = useState<CalculatorProjectType>("landing");
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
  const [extraSalesFunnel, setExtraSalesFunnel] = useState(false);

  const openCalculator = useCallback((options?: OpenCalculatorOptions) => {
    setCalculatorMode(options?.startWithTest ? "test" : "chooser");
    setHoveredMode(null);
    if (options?.presetProjectType) {
      setProjectType(options.presetProjectType);
    }
    setIsOpen(true);
  }, []);

  const closeCalculator = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ openCalculator, closeCalculator }),
    [openCalculator, closeCalculator]
  );

  return (
    <CalculatorContext.Provider value={value}>
      {children}
      {isOpen && (
        <CostCalculatorModal
          onClose={closeCalculator}
          calculatorMode={calculatorMode}
          setCalculatorMode={setCalculatorMode}
          hoveredMode={hoveredMode}
          setHoveredMode={setHoveredMode}
          projectType={projectType}
          setProjectType={setProjectType}
          businessSphere={businessSphere}
          setBusinessSphere={setBusinessSphere}
          mainGoal={mainGoal}
          setMainGoal={setMainGoal}
          pageCount={pageCount}
          setPageCount={setPageCount}
          businessStructure={businessStructure}
          setBusinessStructure={setBusinessStructure}
          visitcardContent={visitcardContent}
          setVisitcardContent={setVisitcardContent}
          landingFunnel={landingFunnel}
          setLandingFunnel={setLandingFunnel}
          botScenario={botScenario}
          setBotScenario={setBotScenario}
          botFlows={botFlows}
          setBotFlows={setBotFlows}
          botNeedsCrm={botNeedsCrm}
          setBotNeedsCrm={setBotNeedsCrm}
          deadline={deadline}
          setDeadline={setDeadline}
          designLevel={designLevel}
          setDesignLevel={setDesignLevel}
          needCopywriting={needCopywriting}
          setNeedCopywriting={setNeedCopywriting}
          needCms={needCms}
          setNeedCms={setNeedCms}
          needBlog={needBlog}
          setNeedBlog={setNeedBlog}
          needForms={needForms}
          setNeedForms={setNeedForms}
          needAnimations={needAnimations}
          setNeedAnimations={setNeedAnimations}
          extraSeo={extraSeo}
          setExtraSeo={setExtraSeo}
          extraIntegrations={extraIntegrations}
          setExtraIntegrations={setExtraIntegrations}
          extraMultilang={extraMultilang}
          setExtraMultilang={setExtraMultilang}
          extraSalesFunnel={extraSalesFunnel}
          setExtraSalesFunnel={setExtraSalesFunnel}
        />
      )}
    </CalculatorContext.Provider>
  );
}

type ModalProps = {
  onClose: () => void;
  calculatorMode: "chooser" | "test";
  setCalculatorMode: (m: "chooser" | "test") => void;
  hoveredMode: "test" | "ai" | null;
  setHoveredMode: (h: "test" | "ai" | null) => void;
  projectType: CalculatorProjectType;
  setProjectType: (t: CalculatorProjectType) => void;
  businessSphere: "services" | "beauty" | "medicine" | "education" | "realty" | "ecommerce" | "other";
  setBusinessSphere: (
    s: "services" | "beauty" | "medicine" | "education" | "realty" | "ecommerce" | "other"
  ) => void;
  mainGoal: "leads" | "sales" | "brand" | "automation";
  setMainGoal: (g: "leads" | "sales" | "brand" | "automation") => void;
  pageCount: "one" | "small" | "medium" | "large";
  setPageCount: (p: "one" | "small" | "medium" | "large") => void;
  businessStructure: "simple" | "catalog" | "extended";
  setBusinessStructure: (b: "simple" | "catalog" | "extended") => void;
  visitcardContent: "basic" | "portfolio" | "full";
  setVisitcardContent: (v: "basic" | "portfolio" | "full") => void;
  landingFunnel: "simple" | "quiz" | "advanced";
  setLandingFunnel: (l: "simple" | "quiz" | "advanced") => void;
  botScenario: "faq" | "leads" | "sales";
  setBotScenario: (b: "faq" | "leads" | "sales") => void;
  botFlows: "few" | "medium" | "many";
  setBotFlows: (f: "few" | "medium" | "many") => void;
  botNeedsCrm: boolean;
  setBotNeedsCrm: (v: boolean) => void;
  deadline: "normal" | "fast" | "urgent";
  setDeadline: (d: "normal" | "fast" | "urgent") => void;
  designLevel: "template" | "custom";
  setDesignLevel: (d: "template" | "custom") => void;
  needCopywriting: boolean;
  setNeedCopywriting: (v: boolean) => void;
  needCms: boolean;
  setNeedCms: (v: boolean) => void;
  needBlog: boolean;
  setNeedBlog: (v: boolean) => void;
  needForms: boolean;
  setNeedForms: (v: boolean) => void;
  needAnimations: boolean;
  setNeedAnimations: (v: boolean) => void;
  extraSeo: boolean;
  setExtraSeo: (v: boolean) => void;
  extraIntegrations: boolean;
  setExtraIntegrations: (v: boolean) => void;
  extraMultilang: boolean;
  setExtraMultilang: (v: boolean) => void;
  extraSalesFunnel: boolean;
  setExtraSalesFunnel: (v: boolean) => void;
};

function CostCalculatorModal(props: ModalProps) {
  const {
    onClose,
    calculatorMode,
    setCalculatorMode,
    hoveredMode,
    setHoveredMode,
    projectType,
    setProjectType,
    businessSphere,
    setBusinessSphere,
    mainGoal,
    setMainGoal,
    pageCount,
    setPageCount,
    businessStructure,
    setBusinessStructure,
    visitcardContent,
    setVisitcardContent,
    landingFunnel,
    setLandingFunnel,
    botScenario,
    setBotScenario,
    botFlows,
    setBotFlows,
    botNeedsCrm,
    setBotNeedsCrm,
    deadline,
    setDeadline,
    designLevel,
    setDesignLevel,
    needCopywriting,
    setNeedCopywriting,
    needCms,
    setNeedCms,
    needBlog,
    setNeedBlog,
    needForms,
    setNeedForms,
    needAnimations,
    setNeedAnimations,
    extraSeo,
    setExtraSeo,
    extraIntegrations,
    setExtraIntegrations,
    extraMultilang,
    setExtraMultilang,
    extraSalesFunnel,
    setExtraSalesFunnel
  } = props;

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
    if (extraSalesFunnel) total += 10000;
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
    extraSalesFunnel,
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

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const ui = useMemo(() => {
    const ghostBtn = isDark
      ? "rounded-lg border border-white/30 bg-transparent px-3 py-1.5 text-sm text-white hover:bg-white/10"
      : "rounded-lg border border-slate-300 bg-white/85 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100";
    return {
      overlay: isDark ? "bg-black/60" : "bg-black/45",
      panel:
        "w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl backdrop-blur-xl sm:max-h-[85vh] " +
        (isDark
          ? "border-white/20 bg-slate-950/[0.97] text-white"
          : "border-slate-200/90 bg-white/[0.96] text-slate-900"),
      h2: "text-xl font-bold " + (isDark ? "text-white" : "text-slate-900"),
      lead: "mt-1 text-sm " + (isDark ? "text-white/90" : "text-slate-600"),
      ghostBtn,
      hint:
        "mt-4 rounded-xl border p-3 text-sm " +
        (isDark
          ? "border-white/20 bg-white/5 text-white/90"
          : "border-slate-200/90 bg-slate-50/90 text-slate-600"),
      gradientChoiceBtn:
        "inline-flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-md transition hover:opacity-95 sm:min-h-[3.25rem] dark:shadow-indigo-950/40",
      formWrap: "mt-5 space-y-4 text-left " + (isDark ? "text-white" : "text-slate-900"),
      label: "block text-sm " + (isDark ? "text-white" : "text-slate-900"),
      cap: "mb-1 block " + (isDark ? "text-white/85" : "text-slate-600"),
      select:
        "w-full rounded-lg border px-3 py-2 outline-none " +
        (isDark
          ? "border-white/25 bg-slate-900/90 text-white focus:border-indigo-400"
          : "border-slate-300 bg-white/90 text-slate-900 focus:border-indigo-500"),
      checkLabel: "flex items-center gap-2 text-sm " + (isDark ? "text-white" : "text-slate-900"),
      fieldset: "space-y-2 text-sm " + (isDark ? "text-white" : "text-slate-900"),
      legend: "mb-1 " + (isDark ? "text-white/85" : "text-slate-600"),
      priceBox:
        "mt-6 rounded-xl border p-4 text-left " +
        (isDark
          ? "border-indigo-400/40 bg-indigo-500/10 text-white"
          : "border-indigo-300/80 bg-indigo-50/95 text-slate-800"),
      priceLead: "text-sm " + (isDark ? "text-white/85" : "text-slate-600"),
      priceMain: "mt-1 text-2xl font-extrabold " + (isDark ? "text-white" : "text-slate-900"),
      priceFoot: "mt-2 text-xs " + (isDark ? "text-white/80" : "text-slate-500")
    };
  }, [isDark]);

  return (
    <div
      className={`fixed inset-0 z-[140] flex items-end justify-center p-4 backdrop-blur-[2px] sm:items-center ${ui.overlay}`}
      onClick={onClose}
    >
      <div className={ui.panel} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={ui.h2}>Расчёт стоимости</h2>
            <p className={ui.lead}>
              {calculatorMode === "chooser"
                ? "Ключевая фишка TrueWeb: быстрый тест или диалог с ИИ — выберите, что удобнее."
                : "Ответьте на вопросы, и мы покажем ориентировочную цену."}
            </p>
          </div>
          <button type="button" onClick={onClose} className={ui.ghostBtn}>
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
                className={ui.gradientChoiceBtn}
              >
                <span>Пройти тест</span>
                <span className="text-xs font-normal text-white/90">вопросы и смета</span>
              </button>
              <button
                type="button"
                onMouseEnter={() => setHoveredMode("ai")}
                onMouseLeave={() => setHoveredMode(null)}
                onFocus={() => setHoveredMode("ai")}
                onBlur={() => setHoveredMode(null)}
                onClick={() => {
                  onClose();
                  window.location.assign("/ai-chat");
                }}
                className={ui.gradientChoiceBtn}
              >
                <span>Расчёт с ИИ</span>
                <span className="text-xs font-normal text-white/90">живой чат</span>
              </button>
            </div>
            <div className={ui.hint}>
              {hoveredMode === "ai" &&
                "Чат с ИИ: опишите задачу своими словами — получите ориентир по цене и сможете добавить смету в корзину словом «оплатить»."}
              {hoveredMode === "test" &&
                "Пошаговый тест: сфера, цели, страницы, сроки — в конце покажем ориентировочную стоимость под ваш сценарий."}
              {!hoveredMode && "Наведите курсор на кнопку, чтобы увидеть описание."}
            </div>
          </div>
        ) : (
          <div className={ui.formWrap}>
            <button type="button" onClick={() => setCalculatorMode("chooser")} className={ui.ghostBtn}>
              ← Назад к выбору
            </button>
            <label className={ui.label}>
              <span className={ui.cap}>Что вы хотите создать?</span>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as CalculatorProjectType)}
                className={ui.select}
              >
                <option value="business">Сайт-Бизнес</option>
                <option value="businessCard">Сайт-Визитка</option>
                <option value="landing">Лендинг</option>
                <option value="bot">Бот для Telegram</option>
              </select>
            </label>

            <label className={ui.label}>
              <span className={ui.cap}>Сфера бизнеса</span>
              <select
                value={businessSphere}
                onChange={(e) =>
                  setBusinessSphere(
                    e.target.value as
                      | "services"
                      | "beauty"
                      | "medicine"
                      | "education"
                      | "realty"
                      | "ecommerce"
                      | "other"
                  )
                }
                className={ui.select}
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

            <label className={ui.label}>
              <span className={ui.cap}>Главная цель сайта</span>
              <select
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value as "leads" | "sales" | "brand" | "automation")}
                className={ui.select}
              >
                <option value="leads">Получать заявки</option>
                <option value="sales">Прямые продажи</option>
                <option value="brand">Укрепить бренд</option>
                <option value="automation">Автоматизировать процессы</option>
              </select>
            </label>

            {projectType !== "bot" && (
              <label className={ui.label}>
                <span className={ui.cap}>Сколько страниц планируете?</span>
                <select
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value as "one" | "small" | "medium" | "large")}
                  className={ui.select}
                >
                  <option value="one">1 страница</option>
                  <option value="small">До 5 страниц</option>
                  <option value="medium">6-15 страниц</option>
                  <option value="large">16+ страниц</option>
                </select>
              </label>
            )}

            {projectType === "business" && (
              <label className={ui.label}>
                <span className={ui.cap}>Структура сайта-бизнес</span>
                <select
                  value={businessStructure}
                  onChange={(e) => setBusinessStructure(e.target.value as "simple" | "catalog" | "extended")}
                  className={ui.select}
                >
                  <option value="simple">Базовая структура (главная + услуги)</option>
                  <option value="catalog">С каталогом услуг и кейсами</option>
                  <option value="extended">Расширенная структура (разделы, кейсы, блог)</option>
                </select>
              </label>
            )}

            {projectType === "businessCard" && (
              <label className={ui.label}>
                <span className={ui.cap}>Наполнение сайта-визитки</span>
                <select
                  value={visitcardContent}
                  onChange={(e) => setVisitcardContent(e.target.value as "basic" | "portfolio" | "full")}
                  className={ui.select}
                >
                  <option value="basic">Базово: о нас, контакты, услуги</option>
                  <option value="portfolio">Плюс портфолио и отзывы</option>
                  <option value="full">Плюс цены, FAQ и формы захвата</option>
                </select>
              </label>
            )}

            {projectType === "landing" && (
              <label className={ui.label}>
                <span className={ui.cap}>Воронка для лендинга</span>
                <select
                  value={landingFunnel}
                  onChange={(e) => setLandingFunnel(e.target.value as "simple" | "quiz" | "advanced")}
                  className={ui.select}
                >
                  <option value="simple">Простая: оффер + форма</option>
                  <option value="quiz">С квизом/калькулятором</option>
                  <option value="advanced">Сложная: прогрев, кейсы, несколько CTA</option>
                </select>
              </label>
            )}

            {projectType === "bot" && (
              <>
                <label className={ui.label}>
                  <span className={ui.cap}>Тип Telegram-бота</span>
                  <select
                    value={botScenario}
                    onChange={(e) => setBotScenario(e.target.value as "faq" | "leads" | "sales")}
                    className={ui.select}
                  >
                    <option value="faq">Бот-ответы (FAQ/поддержка)</option>
                    <option value="leads">Бот для заявок</option>
                    <option value="sales">Бот для продаж и оплат</option>
                  </select>
                </label>

                <label className={ui.label}>
                  <span className={ui.cap}>Сколько сценариев диалога?</span>
                  <select
                    value={botFlows}
                    onChange={(e) => setBotFlows(e.target.value as "few" | "medium" | "many")}
                    className={ui.select}
                  >
                    <option value="few">1-3 сценария</option>
                    <option value="medium">4-8 сценариев</option>
                    <option value="many">9+ сценариев</option>
                  </select>
                </label>

                <label className={ui.checkLabel}>
                  <input type="checkbox" checked={botNeedsCrm} onChange={(e) => setBotNeedsCrm(e.target.checked)} />
                  Интеграция бота с CRM
                </label>
              </>
            )}

            <label className={ui.label}>
              <span className={ui.cap}>Срок запуска</span>
              <select
                value={deadline}
                onChange={(e) => setDeadline(e.target.value as "normal" | "fast" | "urgent")}
                className={ui.select}
              >
                <option value="normal">Стандартный</option>
                <option value="fast">Быстрее обычного</option>
                <option value="urgent">Срочно</option>
              </select>
            </label>

            <label className={ui.label}>
              <span className={ui.cap}>Уровень дизайна</span>
              <select
                value={designLevel}
                onChange={(e) => setDesignLevel(e.target.value as "template" | "custom")}
                className={ui.select}
              >
                <option value="template">На основе готовых решений</option>
                <option value="custom">Полностью уникальный дизайн</option>
              </select>
            </label>

            <fieldset className={ui.fieldset}>
              <legend className={ui.legend}>Нужны дополнительные опции?</legend>
              <label className={ui.checkLabel}>
                <input
                  type="checkbox"
                  checked={needCopywriting}
                  onChange={(e) => setNeedCopywriting(e.target.checked)}
                />
                Копирайтинг (подготовка продающих текстов)
              </label>
              <label className={ui.checkLabel}>
                <input type="checkbox" checked={needCms} onChange={(e) => setNeedCms(e.target.checked)} />
                Админ-панель для редактирования контента
              </label>
              <label className={ui.checkLabel}>
                <input type="checkbox" checked={needBlog} onChange={(e) => setNeedBlog(e.target.checked)} />
                Блог / новости
              </label>
              <label className={ui.checkLabel}>
                <input type="checkbox" checked={needForms} onChange={(e) => setNeedForms(e.target.checked)} />
                Формы заявок и обратный звонок
              </label>
              <label className={ui.checkLabel}>
                <input
                  type="checkbox"
                  checked={needAnimations}
                  onChange={(e) => setNeedAnimations(e.target.checked)}
                />
                Анимации и интерактивные блоки
              </label>
              <label className={ui.checkLabel}>
                <input type="checkbox" checked={extraSeo} onChange={(e) => setExtraSeo(e.target.checked)} />
                SEO-подготовка и аналитика
              </label>
              <label className={ui.checkLabel}>
                <input
                  type="checkbox"
                  checked={extraIntegrations}
                  onChange={(e) => setExtraIntegrations(e.target.checked)}
                />
                Интеграции (CRM, формы, оплаты, боты)
              </label>
              <label className={ui.checkLabel}>
                <input
                  type="checkbox"
                  checked={extraMultilang}
                  onChange={(e) => setExtraMultilang(e.target.checked)}
                />
                Мультиязычность
              </label>
              <label className={ui.checkLabel}>
                <input
                  type="checkbox"
                  checked={extraSalesFunnel}
                  onChange={(e) => setExtraSalesFunnel(e.target.checked)}
                />
                Воронка продаж
              </label>
            </fieldset>

            <div className={ui.priceBox}>
              <p className={ui.priceLead}>Ориентировочная стоимость проекта:</p>
              <p className={ui.priceMain}>{formattedPrice} ₽</p>
              <p className={ui.priceFoot}>
                Точная цена зависит от финального ТЗ. Для точного расчета оставьте заявку в разделе контактов.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
