import { getContactFromRequest } from "@/lib/contact-auth";
import { getClientById, saveClientInboundChatMessage } from "@/lib/admin-db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const contact = getContactFromRequest(request);
  if (!contact) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = getClientById(contact.id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    messages: data.messages
  });
}

export async function POST(request: Request) {
  const contact = getContactFromRequest(request);
  if (!contact) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text) return NextResponse.json({ error: "Введите текст" }, { status: 400 });

  saveClientInboundChatMessage(contact.id, text);
  return NextResponse.json({ ok: true });
}
