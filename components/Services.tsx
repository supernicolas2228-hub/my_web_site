import { Bot, Code2, Globe } from "lucide-react";

const services = [
  {
    title: "Создание ботов",
    description: "TrueWeb",
    icon: Bot
  },
  {
    title: "Создание сайтов",
    description: "TrueWeb",
    icon: Globe
  },
  {
    title: "Доработка существующих проектов",
    description: "TrueWeb",
    icon: Code2
  }
];

const cardClass =
  "glass-card p-6 transition-transform duration-300 will-change-transform hover:-translate-y-2 hover:shadow-[0_12px_36px_rgba(99,102,241,0.25)]";

export default function Services() {
  return (
    <section id="services" className="section-space px-3 dark:text-white sm:px-4">
      <div className="site-container">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">Наши услуги</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article key={service.title} className={cardClass}>
                <div className="service-icon mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-slate-700 dark:text-white">{service.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
