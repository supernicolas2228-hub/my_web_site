import { isValidPhone, verifyCode } from "@/lib/contacts-db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  phone?: string;
  code?: string;
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = body.phone?.trim() || "";
  const code = body.code?.trim() || "";
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "Укажите корректный номер телефона" }, { status: 400 });
  }
  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: "Введите 4-значный код" }, { status: 400 });
  }

  const result = verifyCode(phone, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

