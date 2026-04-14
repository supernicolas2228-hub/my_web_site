import type { AnalyticsSummary } from "@/lib/analytics-types";
import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import { mkdirSync } from "fs";
import path from "path";
import { ensureAppDbContactsSchema } from "@/lib/contacts-db";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app.db");

/** Порядок секций главной (глубина прокрутки). */
export const TRACK_SECTION_RANK: Record<string, number> = {
  hero: 0,
  directions: 1,
  about: 2,
  pricing: 3,
  reviews: 4,
  portfolio: 5,
  advantages: 6,
  faq: 7,
  contacts: 8,
  footer: 9,
  /** Не главная — условная «глубина» для отчётов */
  other: 99
};

export const TRACK_SECTION_LABELS: Record<string, string> = {
  hero: "Главный экран",
  directions: "Услуги (карточки)",
  about: "О нас",
  pricing: "Продукты / цены",
  reviews: "Отзывы",
  portfolio: "Портфолио",
  advantages: "Почему мы",
  faq: "Вопросы",
  contacts: "Контакты",
  footer: "Подвал (конец страницы)",
  other: "Другая страница"
};

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  ensureAppDbContactsSchema();
  mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      path TEXT NOT NULL DEFAULT '/',
      started_at TEXT NOT NULL,
      last_at TEXT NOT NULL,
      max_section_rank INTEGER NOT NULL DEFAULT 0,
      max_section_key TEXT NOT NULL DEFAULT 'hero',
      had_cart INTEGER NOT NULL DEFAULT 0,
      cart_last_json TEXT,
      UNIQUE(visitor_id, session_id)
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_visits_started ON analytics_visits(started_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_visits_path ON analytics_visits(path);
  `);
  return db;
}

export function lookupVisitorIdBySession(sessionId: string): string | null {
  const database = getDb();
  const row = database
    .prepare("SELECT visitor_id FROM analytics_visits WHERE session_id = ? LIMIT 1")
    .get(sessionId) as { visitor_id: string } | undefined;
  return row?.visitor_id ?? null;
}

export function ensureVisitRow(visitorId: string, sessionId: string, path: string) {
  const database = getDb();
  const now = new Date().toISOString();
  const existing = database
    .prepare("SELECT id FROM analytics_visits WHERE visitor_id = ? AND session_id = ?")
    .get(visitorId, sessionId) as { id: number } | undefined;
  if (existing) {
    database.prepare("UPDATE analytics_visits SET last_at = ?, path = COALESCE(?, path) WHERE id = ?").run(now, path, existing.id);
    return existing.id;
  }
  const info = database
    .prepare(
      `INSERT INTO analytics_visits (visitor_id, session_id, path, started_at, last_at, max_section_rank, max_section_key, had_cart)
       VALUES (?, ?, ?, ?, ?, 0, 'hero', 0)`
    )
    .run(visitorId, sessionId, path, now, now);
  return Number(info.lastInsertRowid);
}

export function updateVisitSection(visitorId: string, sessionId: string, sectionKey: string) {
  const rank = TRACK_SECTION_RANK[sectionKey] ?? -1;
  if (rank < 0) return;
  const database = getDb();
  const now = new Date().toISOString();
  database
    .prepare(
      `UPDATE analytics_visits
       SET last_at = ?,
           max_section_rank = CASE WHEN ? > max_section_rank THEN ? ELSE max_section_rank END,
           max_section_key = CASE WHEN ? > max_section_rank THEN ? ELSE max_section_key END
       WHERE visitor_id = ? AND session_id = ?`
    )
    .run(now, rank, rank, rank, sectionKey, visitorId, sessionId);
}

export function updateVisitCart(visitorId: string, sessionId: string, cartJson: string) {
  const database = getDb();
  const now = new Date().toISOString();
  database
    .prepare(
      `UPDATE analytics_visits SET last_at = ?, had_cart = 1, cart_last_json = ? WHERE visitor_id = ? AND session_id = ?`
    )
    .run(now, cartJson, visitorId, sessionId);
}

export function newVisitorId(): string {
  return randomBytes(16).toString("hex");
}

export type { AnalyticsSummary };

function parseRowsSince(sinceIso: string) {
  const database = getDb();
  return database
    .prepare(
      `SELECT visitor_id, session_id, path, started_at, max_section_key, max_section_rank, had_cart, cart_last_json
       FROM analytics_visits WHERE started_at >= ? ORDER BY started_at ASC`
    )
    .all(sinceIso) as {
    visitor_id: string;
    session_id: string;
    path: string;
    started_at: string;
    max_section_key: string;
    max_section_rank: number;
    had_cart: number;
    cart_last_json: string | null;
  }[];
}

function countUniqueVisitors(rows: { visitor_id: string }[]) {
  return new Set(rows.map((r) => r.visitor_id)).size;
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const database = getDb();
  const contactsRow = database.prepare("SELECT COUNT(*) as c FROM contacts").get() as { c: number };

  const now = Date.now();
  const dayMs = 86400000;
  const sinceYear = new Date(now - 366 * dayMs).toISOString();
  const rows = parseRowsSince(sinceYear);

  const inLast = (ms: number) => {
    const t0 = now - ms;
    return rows.filter((r) => new Date(r.started_at).getTime() >= t0);
  };

  const visitsDay = inLast(dayMs);
  const visitsWeek = inLast(7 * dayMs);
  const visitsMonth = inLast(30 * dayMs);
  const visitsYear = rows;
  const last24h = visitsDay.length;
  const last7d = visitsWeek.length;
  const last30d = visitsMonth.length;

  const bucketBy = (subset: typeof rows, fn: (d: Date) => string) => {
    const m = new Map<string, number>();
    for (const r of subset) {
      const k = fn(new Date(r.started_at));
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => a.label.localeCompare(b.label));
  };

  const hourLabels = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, "0"));
  const hourCounts = new Map<string, number>();
  for (const h of hourLabels) hourCounts.set(h, 0);
  for (const r of visitsDay) {
    const h = new Date(r.started_at).getHours().toString().padStart(2, "0");
    hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
  }
  const byHour = hourLabels.map((label) => ({ label: `${label}:00`, count: hourCounts.get(label) ?? 0 }));

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const byDay = bucketBy(visitsDay, dayKey);

  const weekKeyMonday = (d: Date) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = x.getDay();
    const diff = x.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(x);
    monday.setDate(diff);
    return monday.toISOString().slice(0, 10);
  };
  const byWeek = bucketBy(visitsWeek, weekKeyMonday);

  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const byMonth = bucketBy(visitsMonth, monthKey);

  const yearKey = (d: Date) => String(d.getFullYear());
  const byYear = bucketBy(visitsYear, yearKey);

  const depthMap = new Map<string, number>();
  for (const r of visitsYear) {
    const k = r.max_section_key || "hero";
    depthMap.set(k, (depthMap.get(k) ?? 0) + 1);
  }
  const depth = [...depthMap.entries()]
    .map(([key, count]) => ({
      key,
      label: TRACK_SECTION_LABELS[key] ?? key,
      count
    }))
    .sort((a, b) => b.count - a.count);

  const lineMap = new Map<string, number>();
  for (const r of visitsYear) {
    if (!r.had_cart || !r.cart_last_json) continue;
    try {
      const parsed = JSON.parse(r.cart_last_json) as { title?: string; lineKey?: string }[];
      if (!Array.isArray(parsed)) continue;
      for (const item of parsed) {
        const t = (item.title || item.lineKey || "позиция").slice(0, 120);
        lineMap.set(t, (lineMap.get(t) ?? 0) + 1);
      }
    } catch {
      /* ignore */
    }
  }
  const cartLines = [...lineMap.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  return {
    totals: {
      visits: visitsYear.length,
      uniqueVisitors: countUniqueVisitors(visitsYear),
      withCart: visitsYear.filter((r) => r.had_cart).length,
      contactsInDb: contactsRow.c,
      last24h,
      last7d,
      last30d
    },
    byPeriod: {
      day: byDay,
      hour: byHour,
      week: byWeek,
      month: byMonth,
      year: byYear
    },
    depth,
    cartLines
  };
}
