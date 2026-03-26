import { getAdminFromRequest } from "@/lib/admin-auth";
import { listClients } from "@/lib/admin-db";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ clients: listClients() });
  } catch (e) {
    console.error("[admin/clients]", e);
    return NextResponse.json(
      { error: "Ошибка SQLite при загрузке клиентов. Смотрите pm2 logs business-card-site." },
      { status: 500 }
    );
  }
}

