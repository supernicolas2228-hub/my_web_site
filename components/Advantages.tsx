const advantages = [
  {
    title: "Гарантированный результат 🎯",
    description:
      "Все наши продукты стабильно работают для вашего бизнеса. Увеличивают продажи, конверсию заявок и доверие со стороны клиентов. 📈"
  },
  {
    title: "Прозрачность 🤝",
    description:
      "Мы ценим доверие каждого нашего клиента. Фиксированная цена, соблюдение дедлайнов и договорённостей позволит вам не волноваться и полностью доверять нам. 💎"
  },
  {
    title: "Кроссплатформенность 🌐",
    description:
      "Позволяет продукту работать на разных устройствах и операционных системах без необходимости создавать отдельные версии для каждой из них. Для бизнеса это снижает затраты на разработку, ускоряет выход продукта на рынок и расширяет аудиторию. А для пользователей и клиентов — обеспечивает удобство, гибкость и универсальность. 📱✨"
  }
];

const cardClass =
  "glass-card p-6 transition-transform duration-300 will-change-transform hover:-translate-y-2 hover:shadow-[0_12px_36px_rgba(99,102,241,0.25)] motion-reduce:transition-none motion-reduce:hover:translate-y-0";

export default function Advantages() {
  return (
    <section id="advantages" className="section-space px-3 sm:px-4">
      <div className="site-container">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">Почему выбирают нас</h2>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {advantages.map((item) => (
            <article key={item.title} className={cardClass}>
              <h3 className="text-xl font-semibold leading-snug">{item.title}</h3>
              <p className="mt-3 text-slate-700 dark:text-white">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
