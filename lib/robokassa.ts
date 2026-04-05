import { createHash } from "crypto";
import { randomInt } from "crypto";
import type { PreparedCheckout } from "@/lib/checkout-payment";

const PAY_BASE = "https://auth.robokassa.ru/Merchant/Index.aspx";

export function md5Upper(s: string) {
  return createHash("md5").update(s).digest("hex").toUpperCase();
}

/** Подпись для перенаправления на оплату (пароль #1). */
export function robokassaPaySignature(merchantLogin: string, outSum: string, invId: number, password1: string) {
  return md5Upper(`${merchantLogin}:${outSum}:${invId}:${password1}`);
}

/** Проверка уведомления Result URL (пароль #2): MD5(OutSum:InvId:Password2) */
export function robokassaResultSignature(outSum: string, invId: string, password2: string) {
  return md5Upper(`${outSum}:${invId}:${password2}`);
}

export function isRobokassaConfiguredForPay() {
  const login = (process.env.ROBOKASSA_MERCHANT_LOGIN || "").trim();
  const p1 = (process.env.ROBOKASSA_PASSWORD_1 || "").trim();
  return Boolean(login && p1);
}

export function isRobokassaConfiguredForResult() {
  const p2 = (process.env.ROBOKASSA_PASSWORD_2 || "").trim();
  return Boolean(p2);
}

export function robokassaIsTest() {
  const v = (process.env.ROBOKASSA_TEST || "").trim();
  return v === "1" || v.toLowerCase() === "true";
}

export type RobokassaRedirect = {
  confirmationUrl: string;
  invId: number;
};

/** Уникальный числовой InvId для Robokassa (положительный int). */
export function nextRobokassaInvId(): number {
  const sec = Math.floor(Date.now() / 1000);
  const suffix = randomInt(0, 1_000_000);
  const inv = sec * 1000000 + suffix;
  return inv > 2_000_000_000 ? inv % 2_000_000_000 : inv;
}

export function buildRobokassaRedirect(
  data: PreparedCheckout,
  baseUrl: string,
  returnPath: string = "/payment/return"
): RobokassaRedirect {
  const login = (process.env.ROBOKASSA_MERCHANT_LOGIN || "").trim();
  const password1 = (process.env.ROBOKASSA_PASSWORD_1 || "").trim();
  if (!login || !password1) {
    throw new Error("Robokassa merchant login or password #1 is not set");
  }

  const invId = nextRobokassaInvId();
  const outSum = data.valueRub;
  const description = data.description.slice(0, 160).replace(/\r|\n/g, " ");

  const signature = robokassaPaySignature(login, outSum, invId, password1);

  const successUrl = `${baseUrl}${returnPath}?provider=robokassa&status=success`;
  const failUrl = `${baseUrl}${returnPath}?provider=robokassa&status=fail`;
  const resultUrl = `${baseUrl}/api/robokassa/result`;

  const params = new URLSearchParams({
    MerchantLogin: login,
    OutSum: outSum,
    InvId: String(invId),
    Description: description,
    SignatureValue: signature,
    Culture: "ru",
    Encoding: "utf-8",
    SuccessURL: successUrl,
    FailURL: failUrl,
    ResultURL: resultUrl
  });

  if (data.email) {
    params.set("Email", data.email.trim());
  }

  if (robokassaIsTest()) {
    params.set("IsTest", "1");
  }

  const confirmationUrl = `${PAY_BASE}?${params.toString()}`;
  return { confirmationUrl, invId };
}
