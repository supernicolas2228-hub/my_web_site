import { getAdminFromRequest } from "@/lib/admin-auth";
import { getAnalyticsSummary } from "@/lib/analytics-db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const summary = getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (e) {
    console.error("[admin/analytics]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
