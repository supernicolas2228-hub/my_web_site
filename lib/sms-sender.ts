type SmsSendResult = { ok: true } | { ok: false; error: string };

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

  try {
    const params = new URLSearchParams();
    params.set("api_id", apiId);
    params.set("phone", phone);
    params.set("ip", ip || "-1");

    const res = await fetch("https://sms.ru/code/call", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: params.toString()
    });

    const data = (await res.json()) as { status?: string; code?: string; status_text?: string };
    if (!res.ok) return { ok: false, error: `SMS.ru HTTP ${res.status}` };
    if (!data || data.status !== "OK" || !data.code) {
      return { ok: false, error: data?.status_text || "SMS.ru call failed" };
    }
    const digits = String(data.code).replace(/\D/g, "").slice(0, 4);
    if (digits.length !== 4) return { ok: false, error: "SMS.ru returned invalid code" };
    return { ok: true, code: digits };
  } catch (e) {
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

