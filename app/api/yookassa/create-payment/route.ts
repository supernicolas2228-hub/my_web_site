import {
  mockPaymentResponse,
  notifyAdminsNewOrder,
  parseCheckoutBody,
  paymentBypassEnabled,
  appendPurchaseIntentForContact
} from "@/lib/checkout-payment";
import { createYooKassaConfirmationUrl, isYooKassaConfigured } from "@/lib/yookassa-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Прямое создание платежа ЮKassa (совместимость; корзина использует тот же поток — /api/checkout/create-payment).
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
  if (paymentBypassEnabled()) {
    return NextResponse.json(mockPaymentResponse(request, data));
  }

  if (!isYooKassaConfigured()) {
    return NextResponse.json(
      {
        error: "YooKassa is not configured",
        hint: "Add YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY to .env (see .env.example)"
      },
      { status: 503 }
    );
  }

  if (!siteUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL is required for payment return URL" },
      { status: 503 }
    );
  }

  const yk = await createYooKassaConfirmationUrl(data, request);
  if (!yk.ok) {
    return NextResponse.json({ error: yk.error, details: yk.details }, { status: 502 });
  }

  appendPurchaseIntentForContact(data);

  return NextResponse.json({
    paymentId: yk.paymentId,
    confirmationUrl: yk.confirmationUrl,
    provider: "yookassa" as const
  });
}
