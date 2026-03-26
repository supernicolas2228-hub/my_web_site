/** Cookie parsing only — safe for Edge (middleware). */

export const ADMIN_COOKIE = "tw_admin_session";

export function parseAdminTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const chunks = cookieHeader.split(";").map((x) => x.trim());
  const pair = chunks.find((x) => x.startsWith(`${ADMIN_COOKIE}=`));
  if (!pair) return null;
  return decodeURIComponent(pair.slice(`${ADMIN_COOKIE}=`.length));
}
