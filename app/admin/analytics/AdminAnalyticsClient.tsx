"use client";

import type { AnalyticsSummary } from "@/lib/analytics-types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function AdminAnalyticsClient() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics", { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.assign(`/admin/login?next=${encodeURIComponent("/admin/analytics")}`);
        return;
      }
      const json = (await res.json()) as AnalyticsSummary & { error?: string };
      if (!res.ok) {
        setError(json.error || "Ошибка загрузки");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Нет связи с сервером");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen px-3 pb-10 pt-20 sm:px-4">
      <div className="site-container mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Аналитика сайта</h1>
            <p className="mt-1 text-sm opacity-75">
              Визиты, глубина на главной, добавления в корзину. Данные в SQLite (~1 год сессий в отчёте).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-white/25 px-3 py-2 text-sm hover:bg-white/10"
            >
              Клиенты
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-white/25 px-3 py-2 text-sm hover:bg-white/10"
            >
              Обновить
            </button>
          </div>
        </header>

        {loading && <p className="text-sm opacity-70">Загрузка…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {data && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Визитов в базе (≈год)", data.totals.visits],
                ["Уникальных гостей", data.totals.uniqueVisitors],
                ["Сессий с корзиной", data.totals.withCart],
                ["Контактов в CRM", data.totals.contactsInDb]
              ].map(([label, val]) => (
                <div key={String(label)} className="glass-card rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide opacity-60">{label}</p>
                  <p className="mt-2 text-2xl font-bold">{val}</p>
                </div>
              ))}
            </section>

            <section className="glass-card rounded-xl p-5">
              <h2 className="text-lg font-semibold">За период</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Metric label="За 24 часа" value={data.totals.last24h} />
                <Metric label="За 7 дней" value={data.totals.last7d} />
                <Metric label="За 30 дней" value={data.totals.last30d} />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <ChartBlock title="По дням (≈сутки)" rows={data.byPeriod.day} />
              <ChartBlock title="По часам суток (визиты за 24 ч)" rows={data.byPeriod.hour} />
              <ChartBlock title="По неделям (понедельник, за 7 дней)" rows={data.byPeriod.week} />
              <ChartBlock title="По месяцам (за 30 дней)" rows={data.byPeriod.month} />
              <ChartBlock title="По годам" rows={data.byPeriod.year} />
            </section>

            <section className="glass-card rounded-xl p-5">
              <h2 className="text-lg font-semibold">До какой секции долистали (макс. за сессию)</h2>
              <p className="mt-1 text-xs opacity-65">
                На внутренних страницах без блоков — «Другая страница». На главной — самый нижний из увиденных блоков.
              </p>
              <ul className="mt-4 space-y-2">
                {data.depth.map((d) => (
                  <li key={d.key} className="flex justify-between gap-4 text-sm">
                    <span>{d.label}</span>
                    <span className="font-mono opacity-90">{d.count}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="glass-card rounded-xl p-5">
              <h2 className="text-lg font-semibold">Что клали в корзину (по срабатываниям)</h2>
              {data.cartLines.length === 0 ? (
                <p className="mt-3 text-sm opacity-65">Пока нет записей с корзиной.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {data.cartLines.map((c) => (
                    <li key={c.title} className="flex justify-between gap-4 text-sm">
                      <span className="min-w-0 break-words">{c.title}</span>
                      <span className="shrink-0 font-mono opacity-90">{c.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/15 bg-black/20 px-4 py-3">
      <p className="text-xs opacity-65">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function ChartBlock({
  title,
  rows
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto pr-1">
        {rows.length === 0 ? (
          <p className="text-xs opacity-60">Нет данных</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2 text-xs">
              <span className="w-[7rem] shrink-0 truncate font-mono opacity-80" title={r.label}>
                {r.label}
              </span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                  style={{ width: `${Math.max(4, (r.count / max) * 100)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono">{r.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
