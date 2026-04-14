const SESSION_KEY = "tw_analytics_session_v1";
const VISITOR_MIRROR = "tw_vid_mirror";

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let v = sessionStorage.getItem(SESSION_KEY);
    if (!v) {
      v =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, v);
    }
    return v;
  } catch {
    return `s-${Date.now()}`;
  }
}

export function getVisitorIdFromStorage(): string {
  if (typeof window === "undefined") return "";
  try {
    const m = sessionStorage.getItem(VISITOR_MIRROR);
    if (m) return m;
  } catch {
    /* ignore */
  }
  const fromCookie = document.cookie.match(/(?:^|;\s*)tw_vid=([^;]+)/)?.[1]?.trim();
  return fromCookie ?? "";
}

export function setVisitorIdMirror(id: string) {
  try {
    sessionStorage.setItem(VISITOR_MIRROR, id);
  } catch {
    /* ignore */
  }
}
