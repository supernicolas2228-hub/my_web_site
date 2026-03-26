import nodemailer from "nodemailer";

type EmailSendResult = { ok: true } | { ok: false; error: string };

export function isSmtpConfigured(): boolean {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || "0");
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  const from = (process.env.SMTP_FROM || "").trim();
  return Boolean(host && port > 0 && user && pass && (from || user));
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

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    });

    await Promise.race([
      transporter.sendMail({
        from,
        to,
        subject,
        text
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Email timeout")), 22000))
    ]);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Email send failed" };
  }
}

