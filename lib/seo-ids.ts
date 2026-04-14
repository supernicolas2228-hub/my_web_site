import { getSiteUrl } from "@/lib/site-legal";

export function organizationJsonLdId(): string {
  return `${getSiteUrl()}#organization`;
}

export function websiteJsonLdId(): string {
  return `${getSiteUrl()}#website`;
}
