import {
  ensureVisitRow,
  lookupVisitorIdBySession,
  newVisitorId,
  updateVisitCart,
  updateVisitSection
} from "@/lib/analytics-db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE = "tw_vid";
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export async function POST(request: Request) {
  let body: {
    action?: string;
    visitorId?: string;
    sessionId?: string;
    path?: string;
    section?: string;
    cartLines?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const action = (body.action || "").trim();
  const path = (body.path || "/").trim() || "/";
  let visitorId = (body.visitorId || "").trim();
  const sessionId = (body.sessionId || "").trim();

  if (!sessionId || sessionId.length > 80) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const existingCookie = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  const fromCookie = existingCookie?.[1]?.trim();

  if (!visitorId || visitorId.length > 64) {
    visitorId = fromCookie && /^[a-f0-9]{32}$/i.test(fromCookie) ? fromCookie : "";
  }
  if (!visitorId) {
    const bySession = lookupVisitorIdBySession(sessionId);
    if (bySession) visitorId = bySession;
  }
  if (!visitorId) {
    visitorId = newVisitorId();
  }

  try {
    if (action === "start") {
      ensureVisitRow(visitorId, sessionId, path);
    } else if (action === "section") {
      const section = (body.section || "").trim();
      if (!section) return NextResponse.json({ error: "section required" }, { status: 400 });
      ensureVisitRow(visitorId, sessionId, path);
      updateVisitSection(visitorId, sessionId, section);
    } else if (action === "cart") {
      const raw = body.cartLines;
      const cartJson = JSON.stringify(raw ?? []);
      ensureVisitRow(visitorId, sessionId, path);
      updateVisitCart(visitorId, sessionId, cartJson);
    } else {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[analytics/collect]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, visitorId });
  if (!fromCookie || fromCookie !== visitorId) {
    res.cookies.set(COOKIE, visitorId, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE
    });
  }
  return res;
}
