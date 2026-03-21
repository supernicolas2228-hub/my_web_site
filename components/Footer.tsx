export default function Footer() {
  return (
    <footer className="px-4 pb-8">
      <div className="mx-auto w-full max-w-6xl border-t border-white/20 pt-6 text-center text-sm text-slate-600 dark:text-white">
        © {new Date().getFullYear()} TrueWeb. Все права защищены.
      </div>
    </footer>
  );
}
