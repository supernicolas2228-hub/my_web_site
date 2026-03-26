import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Реквизиты | TrueWeb",
  description: "Реквизиты для предоставления в ЮKassa."
};

export default function RequisitesPage() {
  return (
    <main className="relative min-h-screen px-3 pb-20 pt-24 sm:px-4">
      <div className="site-container relative z-10 max-w-3xl">
        <div className="glass-card px-6 py-10 md:px-10 md:py-12">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">Реквизиты для ЮKassa</h1>
          <div className="mt-6 space-y-3 text-base leading-relaxed">
            <p>
              <span className="opacity-70">ФИО:</span> Андрей Леонтьев Николаевич
            </p>
            <p>
              <span className="opacity-70">ИНН:</span> 781441795345
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

