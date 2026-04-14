"use client";

import { useCart } from "@/context/CartContext";
import { getAnalyticsSessionId, getVisitorIdFromStorage, setVisitorIdMirror } from "@/lib/analytics-client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function AnalyticsCartBridge() {
  const { resolvedLines, totalCount } = useCart();
  const pathname = usePathname() || "/";
  const prevCount = useRef(0);

  useEffect(() => {
    if (totalCount <= 0) return;
    if (totalCount === prevCount.current) return;
    prevCount.current = totalCount;

    const sessionId = getAnalyticsSessionId();
    if (!sessionId) return;

    const lines = resolvedLines.map((l) => ({
      title: l.title,
      lineKey: l.lineKey,
      kind: l.kind,
      qty: l.quantity
    }));

    const run = async () => {
      try {
        const res = await fetch("/api/analytics/collect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cart",
            visitorId: getVisitorIdFromStorage(),
            sessionId,
            path: pathname,
            cartLines: lines
          })
        });
        const data = (await res.json()) as { visitorId?: string };
        if (data.visitorId) setVisitorIdMirror(data.visitorId);
      } catch {
        /* ignore */
      }
    };

    void run();
  }, [resolvedLines, totalCount, pathname]);

  return null;
}
