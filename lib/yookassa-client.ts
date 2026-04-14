import type { PreparedCheckout } from "@/lib/checkout-payment";
import { getSiteUrl } from "@/lib/site-legal";
import { randomUUID } from "crypto";

export type YooKassaCreateResult =
  | { ok: true; confirmationUrl: string; paymentId?: string }
  | { ok: false; error: string; details?: unknown };

export function isYooKassaConfigured() {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  return Boolean(shopId && secretKey);
}

export async function createYooKassaConfirmationUrl(
  data: PreparedCheckout,
  request: Request
): Promise<YooKassaCreateResult> {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  if (!shopId || !secretKey) {
    return { ok: false, error: "YooKassa is not configured" };
  }

  const siteUrl = getSiteUrl();
  const requestOrigin = new URL(request.url).origin;
  const baseUrl = siteUrl || requestOrigin;
  const returnUrl = `${baseUrl}/payment/return`;

  const idempotenceKey = randomUUID();
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  const valueRub = data.valueRub;

  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Idempotence-Key": idempotenceKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: { value: valueRub, currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: returnUrl },
      description: data.description,
      metadata: {
        source: "truweb-cart",
        lines: JSON.stringify(data.lines),
        customerPhone: data.normalizedPhone,
        customerEmail: data.email,
        customerHasTelegram: data.customer.hasTelegram ? "yes" : "no"
      }
    })
  });

  const responseData = (await res.json()) as {
    id?: string;
    status?: string;
    confirmation?: { confirmation_url?: string };
    description?: string;
    code?: string;
    type?: string;
  };

  if (!res.ok) {
    return { ok: false, error: "YooKassa error", details: responseData };
  }

  const confirmationUrl = responseData.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    return { ok: false, error: "No confirmation_url", details: responseData };
  }

  return { ok: true, confirmationUrl, paymentId: responseData.id };
}
