/** Cookie parsing only — safe for Edge (middleware). */

export const CONTACT_COOKIE = "tw_contact_session";

export function parseContactTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const chunks = cookieHeader.split(";").map((x) => x.trim());
  const pair = chunks.find((x) => x.startsWith(`${CONTACT_COOKIE}=`));
  if (!pair) return null;
  return decodeURIComponent(pair.slice(`${CONTACT_COOKIE}=`.length));
}
