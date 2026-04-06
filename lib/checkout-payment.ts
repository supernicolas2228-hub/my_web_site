import { CUSTOM_QUOTE_MAX_RUB, CUSTOM_QUOTE_MIN_RUB } from "@/lib/cart-lines";
import { getServiceById, isValidServiceId } from "@/lib/services-catalog";
import { appendClientPurchaseIntentMessage } from "@/lib/admin-db";
import { getContact, isPhoneVerified, normalizePhone } from "@/lib/contacts-db";
import { sendSmsMessage } from "@/lib/sms-sender";
import { randomUUID } from "crypto";

export type CheckoutBodyItemCatalog = { type?: "catalog"; serviceId: string; quantity: number };
export type CheckoutBodyItemCustom = {
  type: "custom";
  clientLineId: string;
  title: string;
  amountRub: number;
  summary?: string;
  quantity: number;
};
export type CheckoutBodyItem = CheckoutBodyItemCatalog | CheckoutBodyItemCustom;

export type CheckoutBodyCustomer = { phone: string; email: string; hasTelegram: boolean };

export type CheckoutLine = { id: string; title: string; quantity: number; unitRub: number };

export type PreparedCheckout = {
  normalizedPhone: string;
  email: string;
  customer: CheckoutBodyCustomer;
  lines: CheckoutLine[];
  totalKopecks: number;
  valueRub: string;
  orderLinesText: string;
  description: string;
};

function getAdminPhones() {
  const raw = process.env.ORDER_NOTIFY_PHONES || "79216590009,79526657299";
  return raw
    .split(",")
    .map((x) => x.replace(/\D/g, ""))
    .filter((x) => x.length >= 11);
}

export function parseCheckoutBody(body: {
  items?: CheckoutBodyItem[];
  customer?: CheckoutBodyCustomer;
}):
  | { ok: false; status: number; error: string; hint?: string }
  | { ok: true; data: PreparedCheckout } {
  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, status: 400, error: "items[] is required" };
  }

  const customer = body.customer;
  if (
    !customer ||
    typeof customer.phone !== "string" ||
    typeof customer.email !== "string" ||
    typeof customer.hasTelegram !== "boolean"
  ) {
    return { ok: false, status: 400, error: "customer is required" };
  }

  const normalizedPhone = normalizePhone(customer.phone);
  if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith("7")) {
    return { ok: false, status: 400, error: "Invalid customer.phone" };
  }

  const email = customer.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "Invalid customer.email" };
  }

  if (!isPhoneVerified(normalizedPhone)) {
    return {
      ok: false,
      status: 400,
      error: "Phone is not verified",
      hint: "Подтвердите номер телефона через SMS перед оплатой"
    };
  }

  let totalKopecks = 0;
  const lines: CheckoutLine[] = [];

  for (const row of items) {
    if (!row || typeof row.quantity !== "number") {
      return { ok: false, status: 400, error: "Invalid item" };
    }
    if (!Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 99) {
      return { ok: false, status: 400, error: "Invalid quantity" };
    }

    if (row && typeof row === "object" && "type" in row && (row as CheckoutBodyItemCustom).type === "custom") {
      const r = row as CheckoutBodyItemCustom;
      const id = typeof r.clientLineId === "string" ? r.clientLineId.trim().slice(0, 80) : "";
      const title = typeof r.title === "string" ? r.title.trim().slice(0, 200) : "";
      const amountRub = Math.round(Number(r.amountRub));
      if (!id || !title) {
        return { ok: false, status: 400, error: "Invalid custom line" };
      }
      if (!Number.isInteger(amountRub) || amountRub < CUSTOM_QUOTE_MIN_RUB || amountRub > CUSTOM_QUOTE_MAX_RUB) {
        return { ok: false, status: 400, error: "Invalid custom amountRub" };
      }
      const lineTotal = amountRub * r.quantity;
      totalKopecks += lineTotal * 100;
      lines.push({
        id: `ai:${id}`,
        title: `ИИ-заказ: ${title}`,
        quantity: r.quantity,
        unitRub: amountRub
      });
      continue;
    }

    const catalogRow = row as CheckoutBodyItemCatalog;
    if (typeof catalogRow.serviceId !== "string") {
      return { ok: false, status: 400, error: "Invalid item" };
    }
    if (!isValidServiceId(catalogRow.serviceId)) {
      return { ok: false, status: 400, error: `Unknown service: ${catalogRow.serviceId}` };
    }
    const svc = getServiceById(catalogRow.serviceId);
    if (!svc) continue;
    const lineTotal = svc.priceRub * catalogRow.quantity;
    totalKopecks += lineTotal * 100;
    lines.push({
      id: svc.id,
      title: svc.title,
      quantity: catalogRow.quantity,
      unitRub: svc.priceRub
    });
  }

  if (totalKopecks <= 0) {
    return { ok: false, status: 400, error: "Empty cart" };
  }

  const valueRub = (totalKopecks / 100).toFixed(2);
  const orderLinesText = lines.map((line) => `${line.title} x${line.quantity}`).join("; ");
  const description =
    lines.length === 1
      ? `TrueWeb: ${lines[0].title} ×${lines[0].quantity}`
      : `TrueWeb: ${lines.length} позиций`;

  return {
    ok: true,
    data: {
      normalizedPhone,
      email,
      customer,
      lines,
      totalKopecks,
      valueRub,
      orderLinesText,
      description
    }
  };
}

export async function notifyAdminsNewOrder(data: PreparedCheckout) {
  const notifyText =
    `Новый заказ TrueWeb. Состав: ${data.orderLinesText}. ` +
    `Сумма: ${data.valueRub} RUB. Клиент: +${data.normalizedPhone}, ${data.email}.`;
  for (const adminPhone of getAdminPhones()) {
    await sendSmsMessage(adminPhone, notifyText);
  }
}

export function appendPurchaseIntentForContact(data: PreparedCheckout) {
  const contactRow = getContact(data.normalizedPhone);
  if (contactRow) appendClientPurchaseIntentMessage(contactRow.id);
}

/** ЮKassa в dev вызывается, если заданы shopId и secret; обход только по флагу или если ключей нет (удобно без кассы). */
function yookassaEnvConfigured(): boolean {
  return Boolean(
    (process.env.YOOKASSA_SHOP_ID || "").trim() && (process.env.YOOKASSA_SECRET_KEY || "").trim()
  );
}

export function paymentBypassEnabled() {
  if (process.env.PAYMENT_BYPASS === "1" || process.env.YOOKASSA_BYPASS === "1") return true;
  if (process.env.NODE_ENV !== "production" && !yookassaEnvConfigured()) return true;
  return false;
}

export function mockPaymentReturnUrl(request: Request) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const requestOrigin = new URL(request.url).origin;
  const baseUrl = siteUrl || requestOrigin;
  return `${baseUrl}/payment/return`;
}

export function mockPaymentResponse(request: Request, data: PreparedCheckout) {
  appendPurchaseIntentForContact(data);
  return {
    paymentId: `mock-${randomUUID()}`,
    confirmationUrl: `${mockPaymentReturnUrl(request)}?mock=1`,
    provider: "mock" as const
  };
}
