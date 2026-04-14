import {
  mockPaymentResponse,
  notifyAdminsNewOrder,
  parseCheckoutBody,
  paymentBypassEnabled,
  appendPurchaseIntentForContact
} from "@/lib/checkout-payment";
import { getSiteUrl } from "@/lib/site-legal";
import { createYooKassaConfirmationUrl, isYooKassaConfigured } from "@/lib/yookassa-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Единая точка оплаты корзины — ЮKassa (API v3).
 * Обход теста: PAYMENT_BYPASS=1 или YOOKASSA_BYPASS=1, либо не production.
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

  const siteUrl = getSiteUrl();
  const requestOrigin = new URL(request.url).origin;
  const baseUrl = siteUrl || requestOrigin;

  if (paymentBypassEnabled()) {
    return NextResponse.json(mockPaymentResponse(request, data));
  }

  if (!isYooKassaConfigured()) {
    return NextResponse.json(
      {
        error: "ЮKassa не настроена",
        hint: "Задайте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env и проверьте сайт в личном кабинете ЮKassa (см. docs/YOOKASSA.md)."
      },
      { status: 503 }
    );
  }

  const yk = await createYooKassaConfirmationUrl(data, request);
  if (!yk.ok) {
    const details = yk.details ? `${yk.error} (${JSON.stringify(yk.details).slice(0, 200)})` : yk.error;
    return NextResponse.json({ error: details, hint: "Проверьте ключи магазина и доступность api.yookassa.ru" }, { status: 502 });
  }

  appendPurchaseIntentForContact(data);

  return NextResponse.json({
    paymentId: yk.paymentId,
    confirmationUrl: yk.confirmationUrl,
    provider: "yookassa" as const
  });
}
