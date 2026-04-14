"use client";

import {
  getAnalyticsSessionId,
  getVisitorIdFromStorage,
  setVisitorIdMirror
} from "@/lib/analytics-client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const HOME_SECTIONS = [
  "hero",
  "directions",
  "about",
  "pricing",
  "reviews",
  "portfolio",
  "advantages",
  "faq",
  "contacts",
  "footer"
] as const;

async function collect(payload: Record<string, unknown>, path: string) {
  const sessionId = getAnalyticsSessionId();
  if (!sessionId) return;
  let visitorId = getVisitorIdFromStorage();
  try {
    const res = await fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        visitorId,
        sessionId,
        path: path || "/"
      })
    });
    const data = (await res.json()) as { visitorId?: string };
    if (data.visitorId) setVisitorIdMirror(data.visitorId);
  } catch {
    /* ignore */
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    void collect({ action: "start" }, pathname);

    if (pathname !== "/") {
      void collect({ action: "section", section: "other" }, pathname);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || e.intersectionRatio < 0.2) continue;
          const id = e.target.id;
          if (HOME_SECTIONS.includes(id as (typeof HOME_SECTIONS)[number])) {
            void collect({ action: "section", section: id }, pathname);
          }
        }
      },
      { threshold: [0.2, 0.35], rootMargin: "0px 0px -8% 0px" }
    );

    const t = window.setTimeout(() => {
      for (const id of HOME_SECTIONS) {
        const el = document.getElementById(id);
        if (el) obs.observe(el);
      }
    }, 500);

    return () => {
      window.clearTimeout(t);
      obs.disconnect();
    };
  }, [pathname]);

  return null;
}
