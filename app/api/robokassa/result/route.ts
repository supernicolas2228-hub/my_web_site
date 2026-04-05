import { robokassaResultSignature, isRobokassaConfiguredForResult } from "@/lib/robokassa";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function verifyAndResponse(outSum: string, invId: string, receivedSigRaw: string) {
  const receivedSig = (receivedSigRaw || "").toUpperCase();

  if (!outSum || !invId || !receivedSig) {
    return new NextResponse("bad params\n", { status: 400 });
  }

  const password2 = (process.env.ROBOKASSA_PASSWORD_2 || "").trim();
  if (!isRobokassaConfiguredForResult() || !password2) {
    console.warn("[robokassa result] ROBOKASSA_PASSWORD_2 not set — cannot verify signature");
    return new NextResponse("not configured\n", { status: 503 });
  }

  const expected = robokassaResultSignature(outSum, invId, password2);
  if (expected !== receivedSig) {
    console.warn("[robokassa result] bad signature", { invId, outSum });
    return new NextResponse("bad sign\n", { status: 400 });
  }

  console.log("[robokassa result] OK", { invId, outSum });
  return new NextResponse(`OK${invId}\n`, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

/**
 * Result URL Robokassa (уведомление о платеже). Ответ: OK{InvId}
 * https://docs.robokassa.ru/second-parameter/
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const outSum = url.searchParams.get("OutSum") || "";
  const invId = url.searchParams.get("InvId") || "";
  const receivedSig = url.searchParams.get("SignatureValue") || "";
  return verifyAndResponse(outSum, invId, receivedSig);
}

/** Robokassa может дергать Result URL методом POST (form-urlencoded). */
export async function POST(request: Request) {
  const ct = (request.headers.get("content-type") || "").toLowerCase();
  let outSum = "";
  let invId = "";
  let receivedSig = "";

  if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    const p = new URLSearchParams(text);
    outSum = p.get("OutSum") || "";
    invId = p.get("InvId") || "";
    receivedSig = p.get("SignatureValue") || "";
  } else {
    try {
      const body = (await request.json()) as Record<string, string>;
      outSum = body.OutSum || "";
      invId = body.InvId || "";
      receivedSig = body.SignatureValue || "";
    } catch {
      return new NextResponse("bad body\n", { status: 400 });
    }
  }

  return verifyAndResponse(outSum, invId, receivedSig);
}
