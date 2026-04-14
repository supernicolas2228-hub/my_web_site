import Reveal from "@/components/motion/Reveal";

const advantages = [
  {
    title: "Результат в договоре",
    description:
      "Сроки и этапы фиксируем письменно: продукт стабильно работает, заявки доходят до вас — без внезапных доплат и переделок за ваш счёт."
  },
  {
    title: "Прозрачный процесс",
    description:
      "Стоимость ясна до старта, по ходу показываем статус и отчёты. На связи по согласованным каналам — без «пропавшего подрядчика»."
  },
  {
    title: "Одна кодовая база",
    description:
      "Телефон, планшет и ПК получают одно решение, а не три отдельные версии: ниже бюджет, быстрее запуск и проще сопровождение."
  }
];

const cardClass =
  "glass-card group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl p-6 sm:p-7 transition-all duration-300 will-change-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 active:-translate-y-0.5 dark:hover:shadow-indigo-400/10";

export default function Advantages() {
  return (
    <section id="advantages" className="section-space px-3 sm:px-4" aria-labelledby="advantages-heading">
      <div className="site-container">
        <Reveal>
          <h2 id="advantages-heading" className="font-heading text-3xl font-bold md:text-4xl">
            Почему выбирают нас
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-6">
          {advantages.map((item, i) => (
            <Reveal key={item.title} delay={0.05 * i} y={20} className="h-full min-h-0">
              <article className={cardClass}>
                <h3 className="relative min-h-[2.75rem] text-xl font-semibold leading-snug tracking-tight sm:min-h-[3.25rem]">
                  {item.title}
                </h3>
                <p className="relative mt-4 flex-1 text-pretty text-base leading-relaxed text-slate-800 dark:text-slate-100">
                  {item.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
