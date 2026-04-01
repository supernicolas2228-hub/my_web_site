import { sendEmailMessage } from "@/lib/email-sender";

/** Один исходящий SMTP на ключ: пока промис в карте — повтор не шлёт второй раз параллельно. */
const inflight = new Map<string, Promise<void>>();

const K_CONTACT = "c:";
const K_ADMIN = "a:";

function scheduleKeyedEmail(key: string, to: string, subject: string, text: string): void {
  if (inflight.has(key)) return;

  const p = sendEmailMessage(to, subject, text).then((result) => {
    if (!result.ok) {
      console.error(`[challenge-email] send failed (${key.slice(0, 10)}…): ${result.error}`);
    }
  });
  inflight.set(key, p);
  void p.finally(() => {
    inflight.delete(key);
  });
}

export function scheduleChallengeEmail(challengeToken: string, to: string, subject: string, text: string): void {
  scheduleKeyedEmail(`${K_CONTACT}${challengeToken}`, to, subject, text);
}

/** 2FA админки — отдельный префикс ключа, чтобы не пересечься с личным кабинетом. */
export function scheduleAdmin2faEmail(challengeToken: string, to: string, subject: string, text: string): void {
  scheduleKeyedEmail(`${K_ADMIN}${challengeToken}`, to, subject, text);
}

export function isChallengeEmailInFlight(challengeToken: string): boolean {
  return inflight.has(`${K_CONTACT}${challengeToken}`);
}

export function isAdmin2faEmailInFlight(challengeToken: string): boolean {
  return inflight.has(`${K_ADMIN}${challengeToken}`);
}
