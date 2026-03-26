import { getAdminFromRequest } from "@/lib/admin-auth";
import { getContactBasics, saveClientMessage } from "@/lib/admin-db";
import { sendSmsMessage } from "@/lib/sms-sender";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const contact = getContactBasics(id);
  if (!contact) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const result = await sendSmsMessage(contact.phone, text);
  saveClientMessage(id, "sms", text, admin.id, result.ok ? "sent" : "failed");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 503 });
  return NextResponse.json({ ok: true });
}

