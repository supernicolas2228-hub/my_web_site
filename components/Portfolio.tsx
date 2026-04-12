export default function Portfolio() {
  const linkClass =
    "glass-card inline-flex min-h-16 items-center justify-center px-8 py-5 text-lg font-semibold transition-transform duration-200 will-change-transform hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] active:scale-[0.98] md:text-xl";

  return (
    <section id="portfolio" className="section-space px-3 sm:px-4">
      <div className="site-container">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">Портфолио</h2>
        <div className="mt-10 flex justify-center">
          <div className="flex w-full max-w-3xl flex-col items-stretch justify-center gap-4 sm:gap-5">
            <a
              href="https://disk.yandex.ru/d/ZDM9-AR8LwjYWw"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              Портфолио на Яндекс Диск
            </a>
            <a
              href="https://drive.google.com/drive/folders/148LqiojSAFOb20QP93K4K0o3_jIbtCPK?usp=drive_link"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              Портфолио на Google Drive
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
