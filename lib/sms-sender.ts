import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import path from "path";

type SmsSendResult = { ok: true } | { ok: false; error: string };

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app.db");

let db: Database.Database | null = null;

function getDb() {
  if (db) return db;
  mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS smsru_call_limits (
      phone TEXT NOT NULL,
      day_key TEXT NOT NULL,
      calls_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (phone, day_key)
    );
    CREATE TABLE IF NOT EXISTS smsru_call_limits_global (
      day_key TEXT PRIMARY KEY,
      calls_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
}

function currentDayKey() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDailyCallLimit() {
  const parsed = Number(process.env.SMS_RU_CALLS_PER_DAY || "10");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 10;
}

function takeCallSlot(phone: string): { ok: true } | { ok: false; error: string } {
  const database = getDb();
  const day = currentDayKey();
  const limit = getDailyCallLimit();
  const globalRow = database
    .prepare("SELECT calls_count FROM smsru_call_limits_global WHERE day_key = ?")
    .get(day) as { calls_count: number } | undefined;
  const globalCount = globalRow?.calls_count ?? 0;
  if (globalCount >= limit) {
    return { ok: false, error: `Суточный лимит звонков исчерпан: ${limit}` };
  }

  const row = database
    .prepare("SELECT calls_count FROM smsru_call_limits WHERE phone = ? AND day_key = ?")
    .get(phone, day) as { calls_count: number } | undefined;
  const count = row?.calls_count ?? 0;
  if (count >= limit) {
    return { ok: false, error: `Лимит звонков исчерпан: ${limit} в сутки на номер` };
  }

  if (row) {
    database
      .prepare("UPDATE smsru_call_limits SET calls_count = calls_count + 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ? AND day_key = ?")
      .run(phone, day);
  } else {
    database
      .prepare("INSERT INTO smsru_call_limits (phone, day_key, calls_count) VALUES (?, ?, 1)")
      .run(phone, day);
  }

  if (globalRow) {
    database
      .prepare("UPDATE smsru_call_limits_global SET calls_count = calls_count + 1, updated_at = CURRENT_TIMESTAMP WHERE day_key = ?")
      .run(day);
  } else {
    database
      .prepare("INSERT INTO smsru_call_limits_global (day_key, calls_count) VALUES (?, 1)")
      .run(day);
  }

  return { ok: true };
}

/** Для 2FA в production нужен реальный провайдер (не mock). */
export function isSmsProviderReal(): boolean {
  return (process.env.SMS_PROVIDER || "mock").trim().toLowerCase() !== "mock";
}

async function sendViaSmsRu(phone: string, text: string): Promise<SmsSendResult> {
  const apiId = (process.env.SMS_RU_API_ID || "").trim();
  const from = (process.env.SMS_RU_FROM || "").trim();
  if (!apiId) return { ok: false, error: "SMS_RU_API_ID is not set" };

  try {
    const params = new URLSearchParams();
    params.set("api_id", apiId);
    params.set("to", `+${phone}`);
    params.set("msg", text);
    if (from) params.set("from", from);
    params.set("json", "1");

    const res = await fetch("https://sms.ru/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: params.toString()
    });

    const data = (await res.json()) as
      | { status?: string; status_code?: number; status_text?: string }
      | { status: "OK"; sms?: Record<string, { status?: string; status_code?: number; status_text?: string }> };

    if (!res.ok) {
      return { ok: false, error: `SMS.ru HTTP ${res.status}` };
    }
    if (!data || (data as any).status !== "OK") {
      const msg = (data as any)?.status_text || "SMS.ru send failed";
      return { ok: false, error: msg };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "SMS.ru request failed" };
  }
}

export async function requestSmsRuCallCode(phone: string, ip: string): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const apiId = (process.env.SMS_RU_API_ID || "").trim();
  if (!apiId) return { ok: false, error: "SMS_RU_API_ID is not set" };
  const slot = takeCallSlot(phone);
  if (!slot.ok) return slot;

  try {
    const params = new URLSearchParams();
    params.set("api_id", apiId);
    params.set("phone", phone);
    params.set("ip", ip || "-1");

    const res = await fetch("https://sms.ru/code/call", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: params.toString(),
      signal: AbortSignal.timeout(12_000)
    });

    const data = (await res.json()) as { status?: string; code?: string; status_text?: string };
    if (!res.ok) return { ok: false, error: `SMS.ru HTTP ${res.status}` };
    if (!data || data.status !== "OK" || !data.code) {
      const raw = (data?.status_text || "SMS.ru call failed").trim();
      const lower = raw.toLowerCase();
      if (lower.includes("слишком много звонков") || lower.includes("ограничение")) {
        return {
          ok: false,
          error:
            "Лимит звонков у SMS.ru исчерпан (это внешний лимит провайдера). Увеличьте его в SMS.ru: Настройки -> Технические настройки, затем повторите."
        };
      }
      return { ok: false, error: raw };
    }
    const digits = String(data.code).replace(/\D/g, "").slice(0, 4);
    if (digits.length !== 4) return { ok: false, error: "SMS.ru returned invalid code" };
    return { ok: true, code: digits };
  } catch (e) {
    if (e instanceof Error && (e.name === "AbortError" || e.message.includes("aborted"))) {
      return { ok: false, error: "SMS.ru: таймаут ответа (проверьте сеть сервера)" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "SMS.ru call request failed" };
  }
}

/**
 * Mock SMS sender for MVP. In production replace by real provider integration.
 */
export async function sendSmsCode(phone: string, code: string): Promise<SmsSendResult> {
  const provider = (process.env.SMS_PROVIDER || "mock").trim().toLowerCase();
  if (provider === "smsru") {
    return await sendViaSmsRu(phone, `Код подтверждения: ${code}`);
  }
  if (provider !== "mock") return { ok: false, error: `Unknown SMS_PROVIDER: ${provider}` };

  console.log(`[SMS MOCK] code ${code} sent to +${phone}`);
  return { ok: true };
}

export async function sendSmsMessage(phone: string, text: string): Promise<SmsSendResult> {
  const provider = (process.env.SMS_PROVIDER || "mock").trim().toLowerCase();
  if (provider === "smsru") return await sendViaSmsRu(phone, text);
  if (provider !== "mock") return { ok: false, error: `Unknown SMS_PROVIDER: ${provider}` };

  const shortText = text.length > 500 ? `${text.slice(0, 500)}...` : text;
  console.log(`[SMS MOCK] message to +${phone}: ${shortText}`);
  return { ok: true };
}

