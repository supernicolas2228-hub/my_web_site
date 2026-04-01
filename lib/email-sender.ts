import dns from "node:dns";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

type EmailSendResult = { ok: true } | { ok: false; error: string };

type SmtpTransportOptions = Exclude<ConstructorParameters<typeof SMTPTransport>[0], string>;

export function isSmtpConfigured(): boolean {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || "0");
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  const from = (process.env.SMTP_FROM || "").trim();
  return Boolean(host && port > 0 && user && pass && (from || user));
}

const TRANSIENT_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "ESOCKETTIMEDOUT",
  "EPIPE",
  "EAI_AGAIN"
]);

function isTransientSendError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const anyErr = err as NodeJS.ErrnoException;
  if (anyErr.code && TRANSIENT_CODES.has(anyErr.code)) return true;
  const msg = err.message.toLowerCase();
  return msg.includes("timeout") || msg.includes("timed out");
}

function smtpErrorHint(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("timeout") || m.includes("timed out")) {
    return "таймаут SMTP: проверьте доступ VPS к SMTP_HOST (порт 465 или 587), фаервол; при сбоях на IPv6 задайте SMTP_FORCE_IPV4=1 в .env.";
  }
  if (m.includes("invalid login") || m.includes("authentication") || m.includes("535")) {
    return "ошибка авторизации SMTP: проверьте SMTP_USER и пароль приложения.";
  }
  return message;
}

function createTransport(host: string, port: number, user: string, pass: string) {
  let secure = port === 465;
  const secureEnv = (process.env.SMTP_SECURE || "").trim().toLowerCase();
  if (secureEnv === "1" || secureEnv === "true") {
    secure = true;
  }

  const forceIpv4 =
    (process.env.SMTP_FORCE_IPV4 || "").trim() === "1" ||
    (process.env.SMTP_FORCE_IPV4 || "").trim().toLowerCase() === "true";

  const opts: SmtpTransportOptions = {
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 90_000,
    greetingTimeout: 45_000,
    socketTimeout: 120_000,
    dnsTimeout: 45_000,
    requireTLS: !secure && port === 587,
    tls: { minVersion: "TLSv1.2" as const }
  };

  if (forceIpv4) {
    type SmtpLookup = (
      hostname: string,
      _options: object,
      callback: (err: NodeJS.ErrnoException | null, address: string, family?: number) => void
    ) => void;
    (opts as SmtpTransportOptions & { lookup: SmtpLookup }).lookup = (hostname, _options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    };
  }

  return nodemailer.createTransport(opts);
}

export async function sendEmailMessage(to: string, subject: string, text: string): Promise<EmailSendResult> {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || "0");
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  const from = ((process.env.SMTP_FROM || "").trim() || user).trim();

  if (!host || !port || !user || !pass || !from) {
    console.log(`[EMAIL MOCK] to ${to}, subject: ${subject}, text: ${text.slice(0, 300)}`);
    return { ok: true };
  }

  const maxAttempts = Math.min(5, Math.max(1, Number(process.env.SMTP_SEND_ATTEMPTS || "3") || 3));
  let lastMessage = "Не удалось отправить письмо";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const transporter = createTransport(host, port, user, pass);
      await transporter.sendMail({ from, to, subject, text });
      return { ok: true };
    } catch (error) {
      lastMessage = error instanceof Error ? error.message : "Не удалось отправить письмо";
      const retry = attempt < maxAttempts && isTransientSendError(error);
      if (retry) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      break;
    }
  }

  return { ok: false, error: smtpErrorHint(lastMessage) };
}
