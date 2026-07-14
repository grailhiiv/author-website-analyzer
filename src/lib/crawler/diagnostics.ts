import type { PageType } from "@/generated/prisma/client";
import {
  getCrawlContentFingerprint,
  normalizeCandidateUrl,
} from "@/lib/crawler/prioritize";

export const CRAWL_DIAGNOSTICS_VERSION = "1.2.0";

export type BrowserFallbackDiagnostics = {
  policyVersion: string;
  enabled: boolean;
  status: "disabled" | "not_needed" | "completed" | "partial" | "failed";
  limits: {
    maxRenderedPages: number;
    navigationTimeoutMs: number;
    maxRequestsPerPage: number;
    maxRequestsPerReport: number;
  };
  triggerCandidates: Array<{ url: string; codes: string[] }>;
  attemptedUrls: string[];
  renderedUrls: string[];
  adoptedUrls: string[];
  requestCount: number;
  abortedRequestCount: number;
  discoveredFromRenderedDom: number;
  failures: Array<{ url: string; code: string; message: string }>;
};

type CrawlIdentityPage = {
  finalUrl: string;
  statusCode: number | null;
  extracted: {
    title?: string | null;
    h1?: string | null;
    bodyText?: string | null;
    seo: {
      canonicalUrl?: string | null;
    };
  } | null;
};

export type CrawlDiagnosticReason =
  | "duplicate"
  | "non_html"
  | "request_failed"
  | "unsuccessful_status";

export type CrawlDiagnosticUrl = {
  requestedUrl: string;
  finalUrl?: string;
  statusCode?: number | null;
  reason: CrawlDiagnosticReason;
  message?: string;
};

export type CrawlSavedUrl = {
  requestedUrl: string;
  finalUrl: string;
  canonicalUrl?: string;
  pageType: PageType;
};

export type CrawlDiagnostics = {
  schemaVersion: string;
  extractionVersion: string;
  limits: {
    maxSavedHtmlPages: number;
    maxRequests: number;
    maxRenderedPages: number;
  };
  submittedUrl: string;
  homepageFinalUrl: string;
  allowedHostnames: string[];
  discoveredFromHomepage: number;
  discoveredFromSitemap: number;
  discoveredFromRobotsSitemaps: number;
  candidateUrls: number;
  discoveredUrls: string[];
  attemptedRequests: number;
  attemptedUrls: string[];
  savedHtmlPages: number;
  failedHttpPagesRecorded: number;
  skippedDuplicates: number;
  skippedNonHtml: number;
  skippedUnsuccessfulStatus: number;
  skippedUrls: CrawlDiagnosticUrl[];
  failedRequests: CrawlDiagnosticUrl[];
  savedUrls: CrawlSavedUrl[];
  browserFallback: BrowserFallbackDiagnostics;
};

type SuccessfulHtmlPage<T extends CrawlIdentityPage> = T & {
  statusCode: number;
  extracted: NonNullable<T["extracted"]>;
};

export function isSuccessfulHtmlPage<T extends CrawlIdentityPage>(
  page: T,
): page is SuccessfulHtmlPage<T> {
  return Boolean(
    page.extracted &&
      page.statusCode !== null &&
      page.statusCode >= 200 &&
      page.statusCode < 300,
  );
}

export function createCrawlPageDeduplicator(homepageUrl: string) {
  const seenUrls = new Set<string>();
  const seenCanonicalUrls = new Set<string>();
  const seenContent = new Set<string>();

  const getIdentity = (page: CrawlIdentityPage) => ({
    normalizedUrl: normalizeCandidateUrl(page.finalUrl, homepageUrl),
    canonicalUrl: page.extracted?.seo.canonicalUrl
      ? normalizeCandidateUrl(page.extracted.seo.canonicalUrl, homepageUrl)
      : null,
    fingerprint: page.extracted
      ? getCrawlContentFingerprint(page.extracted)
      : null,
  });

  return {
    has(page: CrawlIdentityPage) {
      const { normalizedUrl, canonicalUrl, fingerprint } = getIdentity(page);

      return Boolean(
        (normalizedUrl && seenUrls.has(normalizedUrl)) ||
          (canonicalUrl &&
            (seenUrls.has(canonicalUrl) ||
              seenCanonicalUrls.has(canonicalUrl))) ||
          (fingerprint && seenContent.has(fingerprint)),
      );
    },
    remember(page: CrawlIdentityPage) {
      const { normalizedUrl, canonicalUrl, fingerprint } = getIdentity(page);

      if (normalizedUrl) {
        seenUrls.add(normalizedUrl);
      }

      if (canonicalUrl) {
        seenCanonicalUrls.add(canonicalUrl);
      }

      if (fingerprint) {
        seenContent.add(fingerprint);
      }
    },
    hasSeenUrl(url: string) {
      const normalizedUrl = normalizeCandidateUrl(url, homepageUrl);
      return Boolean(normalizedUrl && seenUrls.has(normalizedUrl));
    },
  };
}
