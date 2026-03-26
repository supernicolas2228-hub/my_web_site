import { getAdminFromRequest } from "@/lib/admin-auth";
import { getClientById } from "@/lib/admin-db";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const data = getClientById(id);
    if (!data) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[admin/clients/id]", e);
    return NextResponse.json({ error: "Ошибка чтения базы данных" }, { status: 500 });
  }
}

