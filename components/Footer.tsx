export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-4 pb-10 pt-4 text-slate-700 dark:text-slate-200">
      <div className="mx-auto w-full max-w-6xl border-t border-white/20 pt-8">
        <p className="text-center text-xs text-slate-600 dark:text-white/70">
          © {year} TrueWeb. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
