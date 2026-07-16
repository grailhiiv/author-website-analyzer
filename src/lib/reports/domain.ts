import { getWebsiteDomain, normalizeWebsiteUrl } from "@/lib/urls/normalize";

export function normalizeReportDomain(value: string) {
  try {
    return getWebsiteDomain(normalizeWebsiteUrl(value));
  } catch {
    return null;
  }
}

export function getReportDomainCandidates(domain: string) {
  const normalizedDomain = domain.toLowerCase();

  return normalizedDomain.startsWith("www.")
    ? [normalizedDomain, normalizedDomain.slice(4)]
    : [normalizedDomain, `www.${normalizedDomain}`];
}

export function getReportPath(domain: string) {
  return `/report/${encodeURIComponent(domain)}`;
}

export function getHomepageReportPath(domain: string) {
  return `/?domain=${encodeURIComponent(domain)}#website-audit-result`;
}

export function getAdminReportPath(domain: string) {
  return `/reports/${encodeURIComponent(domain)}`;
}

export function getDisplayDomain(domain: string) {
  return domain.replace(/^www\./i, "");
}
