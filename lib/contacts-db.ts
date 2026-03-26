import Database from "better-sqlite3";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { generateOtpDigits } from "@/lib/fixed-otp";
import { mkdirSync } from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app.db");
const CODE_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

type ContactRow = {
  id: number;
  phone: string;
  email: string;
  phone_verified: number;
  email_verified: number;
  created_at: string;
  updated_at: string;
};

const CONTACT_LOGIN_TTL_MS = 15 * 60 * 1000;
const CONTACT_LOGIN_MAX_ATTEMPTS = 8;
const CONTACT_SESSION_DAYS = 30;

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function hashCabinetOtp(code: string) {
  return createHash("sha256").update(code.replace(/\D/g, "")).digest("hex");
}

function migrateContactsTable(database: Database.Database) {
  const cols = database.prepare("PRAGMA table_info(contacts)").all() as { name: string }[];
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("email_verified")) {
    database.exec("ALTER TABLE contacts ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0");
  }
}

let db: Database.Database | null = null;

/** Общий файл data/app.db: сначала создаётся схема contacts. Вызывать из admin-db до SELECT по contacts. */
export function ensureAppDbContactsSchema() {
  getDb();
}

function getDb() {
  if (db) return db;
  mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      phone_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_verification_codes_phone_created
    ON verification_codes (phone, created_at DESC);

    CREATE TABLE IF NOT EXISTS contact_login_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      challenge_token_hash TEXT NOT NULL UNIQUE,
      sms_code_hash TEXT NOT NULL,
      email_code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contact_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      session_token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );
  `);
  migrateContactsTable(db);
  return db;
}

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) return `7${digits.slice(1)}`;
  return digits;
}

export function isValidPhone(input: string) {
  const normalized = normalizePhone(input);
  return normalized.length === 11 && normalized.startsWith("7");
}

export function isValidEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export function upsertContact(phoneRaw: string, emailRaw: string) {
  const phone = normalizePhone(phoneRaw);
  const email = emailRaw.trim().toLowerCase();
  const database = getDb();
  database
    .prepare(
      `INSERT INTO contacts (phone, email, phone_verified)
       VALUES (?, ?, 0)
       ON CONFLICT(phone) DO UPDATE SET
         email = excluded.email,
         updated_at = CURRENT_TIMESTAMP`
    )
    .run(phone, email);
}

export function getContact(phoneRaw: string) {
  const phone = normalizePhone(phoneRaw);
  const database = getDb();
  return (
    database.prepare("SELECT * FROM contacts WHERE phone = ?").get(phone) as ContactRow | undefined
  );
}

export function isPhoneVerified(phoneRaw: string) {
  const row = getContact(phoneRaw);
  return Boolean(row?.phone_verified);
}

export function requestVerificationCode(phoneRaw: string) {
  const phone = normalizePhone(phoneRaw);
  const database = getDb();

  const recent = database
    .prepare(
      `SELECT created_at
       FROM verification_codes
       WHERE phone = ?
       ORDER BY id DESC
       LIMIT 1`
    )
    .get(phone) as { created_at?: string } | undefined;

  if (recent?.created_at) {
    const nextRequestAt = new Date(recent.created_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000;
    const now = Date.now();
    if (nextRequestAt > now) {
      return {
        ok: false as const,
        waitSeconds: Math.ceil((nextRequestAt - now) / 1000)
      };
    }
  }

  const code = generateOtpDigits(4);
  const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString();
  database
    .prepare("INSERT INTO verification_codes (phone, code_hash, expires_at) VALUES (?, ?, ?)")
    .run(phone, hashCode(code), expiresAt);

  return {
    ok: true as const,
    phone,
    code,
    expiresAt
  };
}

export function requestVerificationCodeWithKnownCode(phoneRaw: string, code4: string) {
  const phone = normalizePhone(phoneRaw);
  const database = getDb();

  const recent = database
    .prepare(
      `SELECT created_at
       FROM verification_codes
       WHERE phone = ?
       ORDER BY id DESC
       LIMIT 1`
    )
    .get(phone) as { created_at?: string } | undefined;

  if (recent?.created_at) {
    const nextRequestAt = new Date(recent.created_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000;
    const now = Date.now();
    if (nextRequestAt > now) {
      return {
        ok: false as const,
        waitSeconds: Math.ceil((nextRequestAt - now) / 1000)
      };
    }
  }

  const code = code4.replace(/\D/g, "").slice(0, 4);
  if (code.length !== 4) {
    return { ok: false as const, error: "invalid_code" as const };
  }

  const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString();
  database
    .prepare("INSERT INTO verification_codes (phone, code_hash, expires_at) VALUES (?, ?, ?)")
    .run(phone, hashCode(code), expiresAt);

  return {
    ok: true as const,
    phone,
    expiresAt
  };
}

export function verifyCode(phoneRaw: string, codeRaw: string) {
  const phone = normalizePhone(phoneRaw);
  const code = codeRaw.trim();
  const database = getDb();

  const row = database
    .prepare(
      `SELECT id, code_hash, expires_at, attempts
       FROM verification_codes
       WHERE phone = ?
       ORDER BY id DESC
       LIMIT 1`
    )
    .get(phone) as { id: number; code_hash: string; expires_at: string; attempts: number } | undefined;

  if (!row) return { ok: false as const, reason: "Код не запрошен" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false as const, reason: "Срок кода истек" };
  if (row.attempts >= MAX_VERIFY_ATTEMPTS) return { ok: false as const, reason: "Превышен лимит попыток" };

  const actual = Buffer.from(row.code_hash);
  const expected = Buffer.from(hashCode(code));
  const success = actual.length === expected.length && timingSafeEqual(actual, expected);

  if (!success) {
    database.prepare("UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?").run(row.id);
    return { ok: false as const, reason: "Неверный код" };
  }

  database.prepare("UPDATE contacts SET phone_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ?").run(phone);
  return { ok: true as const };
}

export type ContactCabinetStartResult =
  | { ok: true; contactId: number; phone: string; email: string; challengeToken: string; smsCode: string; emailCode: string }
  | { ok: false; error: "not_found" | "email_mismatch" };

/** Готовит challenge; коды нужно отправить снаружи (SMS + email), клиенту отдать только challengeToken. */
export function startContactCabinetLogin(phoneRaw: string, emailRaw: string): ContactCabinetStartResult {
  const phone = normalizePhone(phoneRaw);
  const email = emailRaw.trim().toLowerCase();
  if (!isValidPhone(phoneRaw) || !isValidEmail(emailRaw)) {
    return { ok: false, error: "not_found" };
  }

  const database = getDb();
  const row = database.prepare("SELECT id, email FROM contacts WHERE phone = ?").get(phone) as
    | { id: number; email: string }
    | undefined;
  if (!row) return { ok: false, error: "not_found" };
  // Вход допускается по телефону: даже если email введён иначе, коды уходят на email из базы.
  // Это снижает ложные отказы из-за старого/иначе записанного email.
  void email;

  database.prepare("DELETE FROM contact_login_challenges WHERE contact_id = ?").run(row.id);

  const challengeToken = randomBytes(32).toString("hex");
  const tokenHash = sha256(challengeToken);
  const smsCode = generateOtpDigits(4);
  const emailCode = generateOtpDigits(4);
  const expiresAt = new Date(Date.now() + CONTACT_LOGIN_TTL_MS).toISOString();

  database
    .prepare(
      `INSERT INTO contact_login_challenges (contact_id, challenge_token_hash, sms_code_hash, email_code_hash, expires_at, attempts)
       VALUES (?, ?, ?, ?, ?, 0)`
    )
    .run(row.id, tokenHash, hashCabinetOtp(smsCode), hashCabinetOtp(emailCode), expiresAt);

  return {
    ok: true,
    contactId: row.id,
    phone,
    email: row.email.trim().toLowerCase(),
    challengeToken,
    smsCode,
    emailCode
  };
}

export function startContactCabinetLoginWithKnownSmsCode(
  phoneRaw: string,
  emailRaw: string,
  smsCode4: string
): ContactCabinetStartResult {
  const phone = normalizePhone(phoneRaw);
  const email = emailRaw.trim().toLowerCase();
  if (!isValidPhone(phoneRaw) || !isValidEmail(emailRaw)) {
    return { ok: false, error: "not_found" };
  }

  const smsCode = smsCode4.replace(/\D/g, "").slice(0, 4);
  if (smsCode.length !== 4) return { ok: false, error: "not_found" };

  const database = getDb();
  const row = database.prepare("SELECT id, email FROM contacts WHERE phone = ?").get(phone) as
    | { id: number; email: string }
    | undefined;
  if (!row) return { ok: false, error: "not_found" };
  // Аналогично обычному входу: не блокируем по несовпадению введённого email.
  void email;

  database.prepare("DELETE FROM contact_login_challenges WHERE contact_id = ?").run(row.id);

  const challengeToken = randomBytes(32).toString("hex");
  const tokenHash = sha256(challengeToken);
  const emailCode = generateOtpDigits(4);
  const expiresAt = new Date(Date.now() + CONTACT_LOGIN_TTL_MS).toISOString();

  database
    .prepare(
      `INSERT INTO contact_login_challenges (contact_id, challenge_token_hash, sms_code_hash, email_code_hash, expires_at, attempts)
       VALUES (?, ?, ?, ?, ?, 0)`
    )
    .run(row.id, tokenHash, hashCabinetOtp(smsCode), hashCabinetOtp(emailCode), expiresAt);

  return {
    ok: true,
    contactId: row.id,
    phone,
    email: row.email.trim().toLowerCase(),
    challengeToken,
    smsCode,
    emailCode
  };
}

export function startContactRegistrationWithKnownSmsCode(phoneRaw: string, emailRaw: string, smsCode4: string) {
  const phone = normalizePhone(phoneRaw);
  const email = emailRaw.trim().toLowerCase();
  if (!isValidPhone(phoneRaw) || !isValidEmail(emailRaw)) {
    return { ok: false as const, error: "invalid_input" as const };
  }
  upsertContact(phone, email);
  const database = getDb();
  const row = database.prepare("SELECT id FROM contacts WHERE phone = ?").get(phone) as { id: number } | undefined;
  if (!row) return { ok: false as const, error: "db" as const };

  database.prepare("UPDATE contacts SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(email, row.id);

  const started = startContactCabinetLoginWithKnownSmsCode(phone, email, smsCode4);
  if (!started.ok) return { ok: false as const, error: "db" as const };
  return started;
}

export function deleteContactLoginChallengesForContact(contactId: number) {
  getDb().prepare("DELETE FROM contact_login_challenges WHERE contact_id = ?").run(contactId);
}

export type ContactCabinetVerifyResult =
  | { ok: true; sessionToken: string; expiresAt: string }
  | { ok: false; reason: "not_found" | "expired" | "max_attempts" | "invalid_codes" };

export function completeContactCabinetLogin(
  challengeTokenPlain: string,
  smsCodeRaw: string,
  emailCodeRaw: string
): ContactCabinetVerifyResult {
  const database = getDb();
  const tokenHash = sha256(challengeTokenPlain.trim());
  const row = database
    .prepare(
      `SELECT id, contact_id, sms_code_hash, email_code_hash, expires_at, attempts
       FROM contact_login_challenges WHERE challenge_token_hash = ?`
    )
    .get(tokenHash) as
    | {
        id: number;
        contact_id: number;
        sms_code_hash: string;
        email_code_hash: string;
        expires_at: string;
        attempts: number;
      }
    | undefined;

  if (!row) return { ok: false, reason: "not_found" };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    database.prepare("DELETE FROM contact_login_challenges WHERE id = ?").run(row.id);
    return { ok: false, reason: "expired" };
  }
  if (row.attempts >= CONTACT_LOGIN_MAX_ATTEMPTS) {
    return { ok: false, reason: "max_attempts" };
  }

  const smsTry = hashCabinetOtp(smsCodeRaw);
  const emailTry = hashCabinetOtp(emailCodeRaw);
  const smsBuf = Buffer.from(row.sms_code_hash, "hex");
  const emailBuf = Buffer.from(row.email_code_hash, "hex");
  const smsOk =
    smsBuf.length === Buffer.from(smsTry, "hex").length && timingSafeEqual(smsBuf, Buffer.from(smsTry, "hex"));
  const emailOk =
    emailBuf.length === Buffer.from(emailTry, "hex").length &&
    timingSafeEqual(emailBuf, Buffer.from(emailTry, "hex"));

  if (!smsOk || !emailOk) {
    database.prepare("UPDATE contact_login_challenges SET attempts = attempts + 1 WHERE id = ?").run(row.id);
    return { ok: false, reason: "invalid_codes" };
  }

  database.prepare("DELETE FROM contact_login_challenges WHERE id = ?").run(row.id);
  database
    .prepare("UPDATE contacts SET phone_verified = 1, email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(row.contact_id);

  const sessionToken = randomBytes(32).toString("hex");
  const sessionHash = sha256(sessionToken);
  const expiresAt = new Date(Date.now() + CONTACT_SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  database
    .prepare("INSERT INTO contact_sessions (contact_id, session_token_hash, expires_at) VALUES (?, ?, ?)")
    .run(row.contact_id, sessionHash, expiresAt);

  return { ok: true, sessionToken, expiresAt };
}

export function getContactFromSessionToken(token: string) {
  const database = getDb();
  const row = database
    .prepare(
      `SELECT c.id, c.phone, c.email, c.phone_verified, c.email_verified
       FROM contact_sessions s
       JOIN contacts c ON c.id = s.contact_id
       WHERE s.session_token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
       LIMIT 1`
    )
    .get(sha256(token)) as
    | { id: number; phone: string; email: string; phone_verified: number; email_verified: number }
    | undefined;
  return row || null;
}

export function contactLogout(token: string) {
  getDb().prepare("DELETE FROM contact_sessions WHERE session_token_hash = ?").run(sha256(token));
}

