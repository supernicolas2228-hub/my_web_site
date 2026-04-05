import {
  mockPaymentResponse,
  notifyAdminsNewOrder,
  parseCheckoutBody,
  paymentBypassEnabled,
  appendPurchaseIntentForContact
} from "@/lib/checkout-payment";
import { buildRobokassaRedirect, isRobokassaConfiguredForPay } from "@/lib/robokassa";
import { createYooKassaConfirmationUrl, isYooKassaConfigured } from "@/lib/yookassa-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Единая точка оплаты: сначала Robokassa (если настроена), иначе ЮKassa.
 * Обход теста: PAYMENT_BYPASS=1 или YOOKASSA_BYPASS=1, либо не production — как раньше.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseCheckoutBody(body as Parameters<typeof parseCheckoutBody>[0]);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, ...(parsed.hint ? { hint: parsed.hint } : {}) },
      { status: parsed.status }
    );
  }

  const data = parsed.data;
  await notifyAdminsNewOrder(data);

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const requestOrigin = new URL(request.url).origin;
  const baseUrl = siteUrl || requestOrigin;

  if (paymentBypassEnabled()) {
    return NextResponse.json(mockPaymentResponse(request, data));
  }

  if (!siteUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL is required for payment URLs", hint: "Укажите публичный URL сайта в .env" },
      { status: 503 }
    );
  }

  let confirmationUrl: string | undefined;
  let provider: "robokassa" | "yookassa" | undefined;
  let paymentId: string | undefined;
  let robokassaError: string | undefined;
  let ykError: string | undefined;

  if (isRobokassaConfiguredForPay()) {
    try {
      const red = buildRobokassaRedirect(data, baseUrl);
      confirmationUrl = red.confirmationUrl;
      provider = "robokassa";
      paymentId = `robokassa-${red.invId}`;
    } catch (e) {
      robokassaError = e instanceof Error ? e.message : "Robokassa redirect failed";
    }
  }

  if (!confirmationUrl && isYooKassaConfigured()) {
    const yk = await createYooKassaConfirmationUrl(data, request);
    if (yk.ok) {
      confirmationUrl = yk.confirmationUrl;
      provider = "yookassa";
      paymentId = yk.paymentId;
    } else {
      ykError = yk.details ? `${yk.error} (${JSON.stringify(yk.details).slice(0, 200)})` : yk.error;
    }
  }

  if (!confirmationUrl) {
    const parts = [
      robokassaError && `Robokassa: ${robokassaError}`,
      ykError && `ЮKassa: ${ykError}`,
      !isRobokassaConfiguredForPay() && !isYooKassaConfigured() && "В .env не заданы ни Robokassa, ни ЮKassa."
    ].filter(Boolean) as string[];

    return NextResponse.json(
      {
        error: "Нет доступного способа оплаты",
        hint:
          parts.join(" ") ||
          "Настройте ROBOKASSA_MERCHANT_LOGIN и ROBOKASSA_PASSWORD_1 (основной способ) и при необходимости YOOKASSA_* (запасной)."
      },
      { status: 503 }
    );
  }

  appendPurchaseIntentForContact(data);

  return NextResponse.json({
    paymentId,
    confirmationUrl,
    provider
  });
}
