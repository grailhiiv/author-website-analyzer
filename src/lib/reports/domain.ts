import { getWebsiteDomain, normalizeWebsiteUrl } from "@/lib/urls/normalize";

export function normalizeReportDomain(value: string) {
  try {
    return getWebsiteDomain(normalizeWebsiteUrl(value));
  } catch {
    return null;
  }
}

export function getReportPath(domain: string) {
  return `/report/${encodeURIComponent(domain)}`;
}

export function getDisplayDomain(domain: string) {
  return domain.replace(/^www\./i, "");
}
