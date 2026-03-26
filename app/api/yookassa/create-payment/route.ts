import { getServiceById, isValidServiceId } from "@/lib/services-catalog";
import { appendClientPurchaseIntentMessage } from "@/lib/admin-db";
import { getContact, isPhoneVerified, normalizePhone } from "@/lib/contacts-db";
import { sendSmsMessage } from "@/lib/sms-sender";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type BodyItem = { serviceId: string; quantity: number };
type BodyCustomer = { phone: string; email: string; hasTelegram: boolean };

function getAdminPhones() {
  const raw = process.env.ORDER_NOTIFY_PHONES || "79216590009,79526657299";
  return raw
    .split(",")
    .map((x) => x.replace(/\D/g, ""))
    .filter((x) => x.length >= 11);
}

/**
 * Создание платежа ЮKassa. Ключи только на сервере:
 * YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY
 * NEXT_PUBLIC_SITE_URL — базовый URL сайта (https://ваш-домен.ru)
 */
export async function POST(request: Request) {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const requestOrigin = new URL(request.url).origin;
  const bypassYookassa = process.env.YOOKASSA_BYPASS === "1" || process.env.NODE_ENV !== "production";

  let body: { items?: BodyItem[]; customer?: BodyCustomer };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items[] is required" }, { status: 400 });
  }

  const customer = body.customer;
  if (
    !customer ||
    typeof customer.phone !== "string" ||
    typeof customer.email !== "string" ||
    typeof customer.hasTelegram !== "boolean"
  ) {
    return NextResponse.json({ error: "customer is required" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(customer.phone);
  if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith("7")) {
    return NextResponse.json({ error: "Invalid customer.phone" }, { status: 400 });
  }

  const email = customer.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid customer.email" }, { status: 400 });
  }

  if (!isPhoneVerified(normalizedPhone)) {
    return NextResponse.json(
      { error: "Phone is not verified", hint: "Подтвердите номер телефона через SMS перед оплатой" },
      { status: 400 }
    );
  }

  let totalKopecks = 0;
  const lines: Array<{ id: string; title: string; quantity: number; unitRub: number }> = [];

  for (const row of items) {
    if (!row || typeof row.serviceId !== "string" || typeof row.quantity !== "number") {
      return NextResponse.json({ error: "Invalid item" }, { status: 400 });
    }
    if (!Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 99) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    if (!isValidServiceId(row.serviceId)) {
      return NextResponse.json({ error: `Unknown service: ${row.serviceId}` }, { status: 400 });
    }
    const svc = getServiceById(row.serviceId);
    if (!svc) continue;
    const lineTotal = svc.priceRub * row.quantity;
    totalKopecks += lineTotal * 100;
    lines.push({
      id: svc.id,
      title: svc.title,
      quantity: row.quantity,
      unitRub: svc.priceRub
    });
  }

  if (totalKopecks <= 0) {
    return NextResponse.json({ error: "Empty cart" }, { status: 400 });
  }

  const valueRub = (totalKopecks / 100).toFixed(2);
  const orderLinesText = lines.map((line) => `${line.title} x${line.quantity}`).join("; ");
  const notifyText =
    `Новый заказ TrueWeb. Состав: ${orderLinesText}. ` +
    `Сумма: ${valueRub} RUB. Клиент: +${normalizedPhone}, ${email}.`;
  for (const adminPhone of getAdminPhones()) {
    await sendSmsMessage(adminPhone, notifyText);
  }

  const baseUrl = siteUrl || requestOrigin;
  const returnUrl = `${baseUrl}/payment/return`;

  if (bypassYookassa) {
    const contactRow = getContact(normalizedPhone);
    if (contactRow) appendClientPurchaseIntentMessage(contactRow.id);
    return NextResponse.json({
      paymentId: `mock-${randomUUID()}`,
      confirmationUrl: `${returnUrl}?mock=1`
    });
  }

  if (!shopId || !secretKey) {
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

  const idempotenceKey = randomUUID();
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");

  const description =
    lines.length === 1
      ? `TrueWeb: ${lines[0].title} ×${lines[0].quantity}`
      : `TrueWeb: ${lines.length} позиций`;

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
      description,
      metadata: {
        source: "truweb-cart",
        lines: JSON.stringify(lines),
        customerPhone: normalizedPhone,
        customerEmail: email,
        customerHasTelegram: customer.hasTelegram ? "yes" : "no"
      }
    })
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    confirmation?: { confirmation_url?: string };
    description?: string;
    code?: string;
    type?: string;
  };

  if (!res.ok) {
    return NextResponse.json(
      { error: "YooKassa error", details: data },
      { status: 502 }
    );
  }

  const confirmationUrl = data.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    return NextResponse.json({ error: "No confirmation_url", details: data }, { status: 502 });
  }

  const contactRow = getContact(normalizedPhone);
  if (contactRow) appendClientPurchaseIntentMessage(contactRow.id);

  return NextResponse.json({
    paymentId: data.id,
    confirmationUrl
  });
}
