import { getContactFromSessionToken } from "@/lib/contacts-db";
import { parseContactTokenFromCookieHeader, CONTACT_COOKIE } from "@/lib/contact-session-cookie";

export { CONTACT_COOKIE, parseContactTokenFromCookieHeader };

export function getContactFromRequest(request: Request) {
  const token = parseContactTokenFromCookieHeader(request.headers.get("cookie"));
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return null;
  return getContactFromSessionToken(token);
}
