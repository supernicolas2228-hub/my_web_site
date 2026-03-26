import Database from "better-sqlite3";
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { FIXED_OTP_DIGITS, generateOtpDigits, USE_FIXED_OTP_EVERYWHERE } from "@/lib/fixed-otp";
import { mkdirSync } from "fs";
import path from "path";
import { ensureAppDbContactsSchema, normalizePhone } from "@/lib/contacts-db";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app.db");

type AdminUserRow = { id: number; email: string; password_hash: string };

export type AdminPasswordCheckResult =
  | { ok: true; adminUserId: number; email: string; phone: string }
  | { ok: false; reason: "unknown_email" | "wrong_password" };

export type Admin2faCompleteResult =
  | { ok: true; token: string; adminUserId: number; expiresAt: string; email: string }
  | { ok: false; reason: "not_found" | "expired" | "max_attempts" | "invalid_codes" };

const ADMIN_2FA_TTL_MS = 10 * 60 * 1000;
const ADMIN_2FA_MAX_ATTEMPTS = 8;

function hashOtp(code: string) {
  return createHash("sha256").update(code.replace(/\D/g, "")).digest("hex");
}

function migrateAdminUsersTable(database: Database.Database) {
  const cols = database.prepare("PRAGMA table_info(admin_users)").all() as { name: string }[];
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("phone")) {
    database.exec("ALTER TABLE admin_users ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
  }
  if (!names.has("is_2fa_enabled")) {
    database.exec("ALTER TABLE admin_users ADD COLUMN is_2fa_enabled INTEGER NOT NULL DEFAULT 1");
  }
}

let db: Database.Database | null = null;

function getDb() {
  if (db) return db;
  ensureAppDbContactsSchema();
  mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER NOT NULL,
      session_token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS client_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL UNIQUE,
      stage TEXT NOT NULL DEFAULT 'new',
      note TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS client_stage_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      stage TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      updated_by_admin INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS client_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      channel TEXT NOT NULL,
      direction TEXT NOT NULL DEFAULT 'outbound',
      message_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      sent_by_admin INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS client_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      order_summary TEXT NOT NULL,
      total_rub REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'created',
      payment_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_login_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER NOT NULL,
      challenge_token_hash TEXT NOT NULL UNIQUE,
      email_code_hash TEXT NOT NULL,
      sms_code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_admin_login_challenges_expires
    ON admin_login_challenges (expires_at);
  `);
  migrateAdminUsersTable(db);
  return db;
}

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return `pbkdf2$${salt}$${derived}`;
}

function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;
  const [, salt, expectedHex] = parts;
  const actual = pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Номер для SMS 2FA админа: ADMIN_PHONE, иначе первый валидный из ORDER_NOTIFY_PHONES. */
export function resolveAdminPhoneFromEnv(): string {
  const direct = normalizePhone((process.env.ADMIN_PHONE || "").trim());
  if (direct.length === 11 && direct.startsWith("7")) return direct;
  const raw = process.env.ORDER_NOTIFY_PHONES || "";
  for (const part of raw.split(",")) {
    const p = normalizePhone(part.trim());
    if (p.length === 11 && p.startsWith("7")) return p;
  }
  return "";
}

/** Подставить номер из .env, если в БД пусто (после старых деплоев). */
export function persistAdminPhoneIfNeeded(adminUserId: number, phone: string) {
  const database = getDb();
  database.prepare("UPDATE admin_users SET phone = ? WHERE id = ?").run(phone, adminUserId);
}

/** Once per Node process: create or refresh admin row from .env (password always matches ADMIN_PASSWORD). */
let adminEnvSynced = false;

export function ensureAdminBootstrap() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "").trim();
  const phone = resolveAdminPhoneFromEnv();
  if (!email || !password) return;
  if (adminEnvSynced) return;
  adminEnvSynced = true;

  const database = getDb();
  const exists = database.prepare("SELECT id FROM admin_users WHERE email = ?").get(email) as { id: number } | undefined;
  const hash = hashPassword(password);
  if (exists) {
    database
      .prepare("UPDATE admin_users SET password_hash = ?, phone = ?, is_2fa_enabled = 1 WHERE email = ?")
      .run(hash, phone, email);
  } else {
    database
      .prepare("INSERT INTO admin_users (email, password_hash, phone, is_2fa_enabled) VALUES (?, ?, ?, 1)")
      .run(email, hash, phone);
  }
}

export function adminVerifyPasswordFor2fa(emailRaw: string, password: string): AdminPasswordCheckResult {
  ensureAdminBootstrap();
  const email = emailRaw.trim().toLowerCase();
  const database = getDb();
  const row = database
    .prepare("SELECT id, email, password_hash, phone FROM admin_users WHERE email = ?")
    .get(email) as (AdminUserRow & { phone: string }) | undefined;
  if (!row) return { ok: false as const, reason: "unknown_email" };
  if (!verifyPassword(password, row.password_hash)) return { ok: false as const, reason: "wrong_password" };
  return { ok: true as const, adminUserId: row.id, email: row.email, phone: row.phone || "" };
}

export function deleteAdmin2faChallengesForUser(adminUserId: number) {
  getDb().prepare("DELETE FROM admin_login_challenges WHERE admin_user_id = ?").run(adminUserId);
}

/**
 * Не вызывать SMTP/SMS при входе в админку (иначе при ошибке отправки челлендж сбрасывается).
 * Включается из .env или автоматически при USE_FIXED_OTP_EVERYWHERE в lib/fixed-otp.ts.
 */
export function isAdmin2faSkipDelivery(): boolean {
  if (USE_FIXED_OTP_EVERYWHERE) return true;
  const v = process.env.ADMIN_2FA_SKIP_DELIVERY;
  return v === "1" || v === "true";
}

export function issueAdmin2faChallenge(adminUserId: number): {
  challengeToken: string;
  emailCode: string;
  smsCode: string;
} {
  const database = getDb();
  database.prepare("DELETE FROM admin_login_challenges WHERE admin_user_id = ?").run(adminUserId);

  const challengeToken = randomBytes(32).toString("hex");
  const tokenHash = sha256(challengeToken.toLowerCase());
  const emailCode = generateOtpDigits(4);
  const smsCode = generateOtpDigits(4);
  return issueAdmin2faChallengeWithCodes(adminUserId, tokenHash, challengeToken, emailCode, smsCode);
}

export function issueAdmin2faChallengeWithCodes(
  adminUserId: number,
  tokenHash: string,
  challengeToken: string,
  emailCode: string,
  smsCode: string
): { challengeToken: string; emailCode: string; smsCode: string } {
  const database = getDb();
  const emailCodeHash = hashOtp(emailCode);
  const smsCodeHash = hashOtp(smsCode);
  const expiresAt = new Date(Date.now() + ADMIN_2FA_TTL_MS).toISOString();

  database
    .prepare(
      `INSERT INTO admin_login_challenges (admin_user_id, challenge_token_hash, email_code_hash, sms_code_hash, expires_at, attempts)
       VALUES (?, ?, ?, ?, ?, 0)`
    )
    .run(adminUserId, tokenHash, emailCodeHash, smsCodeHash, expiresAt);

  return { challengeToken, emailCode, smsCode };
}

export function completeAdmin2faLogin(challengeToken: string, emailCodeRaw: string, smsCodeRaw: string): Admin2faCompleteResult {
  ensureAdminBootstrap();
  const database = getDb();
  const tokenNorm = challengeToken.trim().toLowerCase();
  const tokenHash = sha256(tokenNorm);
  const row = database
    .prepare(
      `SELECT id, admin_user_id, email_code_hash, sms_code_hash, expires_at, attempts
       FROM admin_login_challenges WHERE challenge_token_hash = ?`
    )
    .get(tokenHash) as
    | {
        id: number;
        admin_user_id: number;
        email_code_hash: string;
        sms_code_hash: string;
        expires_at: string;
        attempts: number;
      }
    | undefined;

  if (!row) return { ok: false as const, reason: "not_found" };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    database.prepare("DELETE FROM admin_login_challenges WHERE id = ?").run(row.id);
    return { ok: false as const, reason: "expired" };
  }
  if (row.attempts >= ADMIN_2FA_MAX_ATTEMPTS) {
    return { ok: false as const, reason: "max_attempts" };
  }

  const emailDigits = emailCodeRaw.replace(/\D/g, "");
  const smsDigits = smsCodeRaw.replace(/\D/g, "");
  let emailOk = false;
  let smsOk = false;

  if (
    USE_FIXED_OTP_EVERYWHERE &&
    emailDigits === FIXED_OTP_DIGITS &&
    smsDigits === FIXED_OTP_DIGITS
  ) {
    emailOk = true;
    smsOk = true;
  } else {
    const emailTry = hashOtp(emailCodeRaw);
    const smsTry = hashOtp(smsCodeRaw);
    const emailBuf = Buffer.from(row.email_code_hash, "hex");
    const smsBuf = Buffer.from(row.sms_code_hash, "hex");
    emailOk =
      emailBuf.length === Buffer.from(emailTry, "hex").length &&
      timingSafeEqual(emailBuf, Buffer.from(emailTry, "hex"));
    smsOk =
      smsBuf.length === Buffer.from(smsTry, "hex").length && timingSafeEqual(smsBuf, Buffer.from(smsTry, "hex"));
  }

  if (!emailOk || !smsOk) {
    database.prepare("UPDATE admin_login_challenges SET attempts = attempts + 1 WHERE id = ?").run(row.id);
    return { ok: false as const, reason: "invalid_codes" };
  }

  database.prepare("DELETE FROM admin_login_challenges WHERE id = ?").run(row.id);

  const token = randomBytes(32).toString("hex");
  const sessionTokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const user = database.prepare("SELECT email FROM admin_users WHERE id = ?").get(row.admin_user_id) as { email: string };
  database
    .prepare("INSERT INTO admin_sessions (admin_user_id, session_token_hash, expires_at) VALUES (?, ?, ?)")
    .run(row.admin_user_id, sessionTokenHash, expiresAt);

  return {
    ok: true as const,
    token,
    adminUserId: row.admin_user_id,
    expiresAt,
    email: user.email
  };
}

export function adminLogout(token: string) {
  const database = getDb();
  database.prepare("DELETE FROM admin_sessions WHERE session_token_hash = ?").run(sha256(token));
}

export function getAdminFromToken(token: string) {
  ensureAdminBootstrap();
  const database = getDb();
  const row = database
    .prepare(
      `SELECT u.id, u.email
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.admin_user_id
       WHERE s.session_token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
       LIMIT 1`
    )
    .get(sha256(token)) as { id: number; email: string } | undefined;
  return row || null;
}

/** Шаблон «сообщения клиента» после перехода к оплате (сохраняется как входящее в чате). */
export const CLIENT_PURCHASE_CHAT_TEMPLATE =
  "Здравствуйте! Я оплатил(а) заказ на сайте и хочу обсудить условия разработки сайта.";

export function listClients() {
  const database = getDb();
  return database
    .prepare(
      `SELECT c.id,
              c.phone,
              c.email,
              c.phone_verified,
              c.email_verified,
              c.created_at,
              c.updated_at
       FROM contacts c
       ORDER BY c.updated_at DESC`
    )
    .all();
}

export function getClientById(contactId: number) {
  const database = getDb();
  const client = database
    .prepare(
      `SELECT c.id,
              c.phone,
              c.email,
              c.phone_verified,
              c.email_verified,
              c.created_at,
              c.updated_at
       FROM contacts c
       WHERE c.id = ?`
    )
    .get(contactId);

  if (!client) return null;

  const messages = database
    .prepare(
      `SELECT id, channel, direction, message_text, status, created_at
       FROM client_messages
       WHERE contact_id = ?
       ORDER BY id ASC
       LIMIT 200`
    )
    .all(contactId);

  return { client, messages };
}

export function saveClientMessage(
  contactId: number,
  channel: "email" | "sms" | "chat",
  messageText: string,
  adminUserId: number | null,
  status = "sent",
  direction: "outbound" | "inbound" = "outbound"
) {
  const database = getDb();
  database
    .prepare(
      "INSERT INTO client_messages (contact_id, channel, direction, message_text, status, sent_by_admin) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(contactId, channel, direction, messageText, status, adminUserId);
  database.prepare("UPDATE contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(contactId);
}

/** Входящее сообщение в чате (как будто от клиента), напр. после оформления оплаты. */
export function appendClientPurchaseIntentMessage(contactId: number) {
  saveClientMessage(contactId, "chat", CLIENT_PURCHASE_CHAT_TEMPLATE, null, "received", "inbound");
}

/** Сообщение в чат от клиента (личный кабинет). */
export function saveClientInboundChatMessage(contactId: number, messageText: string) {
  saveClientMessage(contactId, "chat", messageText.trim(), null, "received", "inbound");
}

/** Одно исходящее сообщение в чат для каждой записи в contacts (личный кабинет / CRM). */
export function broadcastChatToAllContacts(messageText: string, adminUserId: number): { sent: number } {
  const text = messageText.trim();
  if (!text) return { sent: 0 };

  const database = getDb();
  const rows = database.prepare("SELECT id FROM contacts ORDER BY id").all() as { id: number }[];
  if (rows.length === 0) return { sent: 0 };

  const insert = database.prepare(
    "INSERT INTO client_messages (contact_id, channel, direction, message_text, status, sent_by_admin) VALUES (?, 'chat', 'outbound', ?, 'saved', ?)"
  );
  const touch = database.prepare("UPDATE contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?");

  const tx = database.transaction(() => {
    for (const { id } of rows) {
      insert.run(id, text, adminUserId);
      touch.run(id);
    }
  });
  tx();

  return { sent: rows.length };
}

export function getContactBasics(contactId: number) {
  const database = getDb();
  return database.prepare("SELECT id, phone, email FROM contacts WHERE id = ?").get(contactId) as
    | { id: number; phone: string; email: string }
    | undefined;
}

