import { getAdminFromRequest } from "@/lib/admin-auth";
import { broadcastChatToAllContacts } from "@/lib/admin-db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text) return NextResponse.json({ error: "Введите текст сообщения" }, { status: 400 });

  const { sent } = broadcastChatToAllContacts(text, admin.id);
  return NextResponse.json({ ok: true, sent });
}
