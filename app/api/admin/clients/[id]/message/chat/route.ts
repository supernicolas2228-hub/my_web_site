import { getAdminFromRequest } from "@/lib/admin-auth";
import { getContactBasics, saveClientMessage } from "@/lib/admin-db";
import { isSmtpConfigured, sendEmailMessage } from "@/lib/email-sender";
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

  saveClientMessage(id, "chat", text, admin.id, "saved", "outbound");

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (isSmtpConfigured() && siteUrl) {
    const preview = text.length > 400 ? `${text.slice(0, 400)}…` : text;
    void sendEmailMessage(
      contact.email,
      "Новое сообщение в личном кабинете TrueWeb",
      `Здравствуйте!\n\nУ вас новое сообщение от менеджера. Откройте личный кабинет:\n${siteUrl}/account\n\n---\n${preview}`
    );
  }

  return NextResponse.json({ ok: true });
}
