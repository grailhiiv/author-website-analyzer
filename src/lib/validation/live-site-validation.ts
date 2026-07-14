import {
  BROWSER_FALLBACK_POLICY_VERSION,
} from "@/lib/crawler/browser-fallback.core";
import {
  CRAWL_DIAGNOSTICS_VERSION,
} from "@/lib/crawler/diagnostics";
import { CRAWLER_EXTRACTION_VERSION } from "@/lib/crawler/extract";
import {
  crawlWebsite,
  type CrawlWebsiteResult,
} from "@/lib/crawler/service.core";
import {
  ANALYZER_DIAGNOSTICS_VERSION,
  SIGNAL_RESOLUTION_VERSION,
  buildAnalyzerDiagnostics,
  type AnalyzerSignalResolution,
} from "@/lib/signals/analyzer-diagnostics";
import {
  detectAuthorWebsiteSignals,
  type AuthorWebsiteSignals,
  type ScannedPageSignalInput,
} from "@/lib/signals/author-website-signals";
import {
  EVIDENCE_OBSERVATION_VERSION,
  PAGE_ROLE_CLASSIFIER_VERSION,
  type PageRole,
} from "@/lib/signals/page-role-classifier";
import { extractedPageToScannedPageSignalInput } from "@/lib/signals/scanned-page-input";

import { z } from "zod";

export const LIVE_SITE_VALIDATION_SCHEMA_VERSION = "1.0.0";
export const LIVE_SITE_VALIDATION_MANIFEST_VERSION = "1.0.0";

const pageRoles = [
  "HOME",
  "ABOUT",
  "BOOKS_INDEX",
  "BOOK_DETAIL",
  "SERIES",
  "NEWSLETTER",
  "CONTACT",
  "EVENTS",
  "MEDIA_KIT",
  "BLOG_INDEX",
  "ARTICLE",
  "PRIVACY",
  "STORE",
  "UTILITY",
  "UNKNOWN",
] as const satisfies readonly PageRole[];

const outcomeStates = [
  "present",
  "absent",
  "unknown",
  "not_applicable",
  "conflicting",
] as const satisfies readonly AnalyzerSignalResolution["state"][];

const approvedUrlSchema = z.string().trim().min(1).max(2_048).superRefine(
  (value, context) => {
    try {
      const url = new URL(value);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        context.addIssue({
          code: "custom",
          message: "Live validation URLs must use http or https.",
        });
      }

      if (url.username || url.password) {
        context.addIssue({
          code: "custom",
          message: "Live validation URLs cannot contain credentials.",
        });
      }
    } catch {
      context.addIssue({
        code: "custom",
        message: "Live validation URLs must be absolute URLs.",
      });
    }
  },
);

const roleExpectationSchema = z
  .object({
    path: z.string().startsWith("/").max(500),
    primaryRole: z.enum(pageRoles),
  })
  .strict();

const liveSiteSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
    url: approvedUrlSchema,
    approved: z.literal(true),
    tags: z.array(z.string().min(1).max(40)).max(20).optional(),
    notes: z.string().max(1_000).optional(),
    expectedSignals: z.record(z.string().min(1), z.boolean()).optional(),
    expectedOutcomes: z
      .record(z.string().min(1), z.enum(outcomeStates))
      .optional(),
    expectedPageRoles: z.array(roleExpectationSchema).max(30).optional(),
  })
  .strict();

const liveManifestSchema = z
  .object({
    schemaVersion: z.literal(LIVE_SITE_VALIDATION_MANIFEST_VERSION),
    sites: z.array(liveSiteSchema).max(25),
  })
  .strict()
  .superRefine((manifest, context) => {
    const seenIds = new Set<string>();

    manifest.sites.forEach((site, index) => {
      if (seenIds.has(site.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate live validation site id: ${site.id}`,
          path: ["sites", index, "id"],
        });
      }

      seenIds.add(site.id);
    });
  });

export type LiveSiteValidationManifest = z.infer<typeof liveManifestSchema>;

export type LiveExpectationMismatch =
  | {
      kind: "signal";
      id: string;
      expected: boolean;
      actual: boolean | null;
    }
  | {
      kind: "outcome";
      id: string;
      expected: AnalyzerSignalResolution["state"];
      actual: AnalyzerSignalResolution["state"] | null;
    }
  | {
      kind: "page_role";
      id: string;
      expected: PageRole;
      actual: PageRole | null;
    };

export type LiveSiteValidationResult = {
  id: string;
  approvedUrl: string;
  status: "completed" | "crawl_failed" | "runner_error";
  failureCode: "no_successful_html_pages" | "unexpected_crawl_error" | null;
  homepageUrl: string | null;
  crawl: {
    candidateUrlCount: number;
    attemptedRequestCount: number;
    successfulHtmlPageCount: number;
    failedHttpPageCount: number;
    skippedDuplicateCount: number;
    skippedNonHtmlCount: number;
    skippedUnsuccessfulStatusCount: number;
    browserFallback: {
      status: CrawlWebsiteResult["diagnostics"]["browserFallback"]["status"];
      triggerCandidateCount: number;
      attemptedPageCount: number;
      renderedPageCount: number;
      adoptedPageCount: number;
      requestCount: number;
      abortedRequestCount: number;
      failureCount: number;
    } | null;
  } | null;
  coverage: {
    staticHtmlState: "complete" | "partial" | "limited";
    stopReason:
      | "queue_exhausted"
      | "page_limit_reached"
      | "request_limit_reached"
      | "homepage_failed"
      | "stopped_error";
    discoveredUrlCount: number;
    attemptedUrlCount: number;
    successfulHtmlPageCount: number;
    failedUrlCount: number;
    unattemptedCandidateCount: number;
    likelyJavaScriptDependentPageCount: number;
    renderingRequiredPageCount: number;
  } | null;
  pages: Array<{
    url: string;
    statusCode: number | null;
    declaredPageType: string | null;
    primaryRole: PageRole | null;
    secondaryRoles: PageRole[];
    confidence: "high" | "medium" | "low" | null;
    browserRendered: boolean;
    renderedExtractionAdopted: boolean;
  }>;
  signals: Record<string, boolean>;
  outcomes: Record<
    string,
    {
      state: AnalyzerSignalResolution["state"];
      reasonCode: AnalyzerSignalResolution["reasonCode"];
    }
  >;
  expectations: {
    labeled: number;
    passed: number;
    failed: number;
    mismatches: LiveExpectationMismatch[];
  };
};

export type LiveSiteValidationReport = {
  schemaVersion: string;
  manifestSchemaVersion: string;
  generatedAt: string;
  versions: {
    crawlDiagnostics: string;
    extraction: string;
    browserFallbackPolicy: string;
    analyzerDiagnostics: string;
    signalResolution: string;
    pageRoleClassifier: string;
    evidenceObservation: string;
  };
  summary: {
    totalSites: number;
    completedSites: number;
    crawlFailedSites: number;
    runnerErrorSites: number;
    labeledExpectations: number;
    passedExpectations: number;
    failedExpectations: number;
  };
  sites: LiveSiteValidationResult[];
};

type CrawlSite = (url: string) => Promise<CrawlWebsiteResult>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function sanitizeLiveValidationUrl(value: string) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "[invalid-url]";
  }
}

function collectSignalDetections(
  value: unknown,
  path: string[] = [],
  output: Record<string, boolean> = {},
) {
  const record = asRecord(value);

  if (!record) return output;

  if (typeof record.detected === "boolean" && path.length > 0) {
    output[path.join(".")] = record.detected;
    return output;
  }

  for (const key of Object.keys(record).sort()) {
    if (["observations", "pageRoles"].includes(key)) continue;
    collectSignalDetections(record[key], [...path, key], output);
  }

  return output;
}

function pageInputs(result: CrawlWebsiteResult): ScannedPageSignalInput[] {
  return result.pages.map((page) =>
    page.extracted
      ? extractedPageToScannedPageSignalInput(page.extracted, page.statusCode)
      : { url: page.finalUrl, statusCode: page.statusCode },
  );
}

function expectedPath(value: string) {
  try {
    const path = new URL(value).pathname;
    return path.length > 1 ? path.replace(/\/+$/, "") : path;
  } catch {
    return value;
  }
}

function compareExpectations(
  site: LiveSiteValidationManifest["sites"][number],
  signals: Record<string, boolean>,
  outcomes: LiveSiteValidationResult["outcomes"],
  pageRoleByPath: Map<string, PageRole>,
) {
  const mismatches: LiveExpectationMismatch[] = [];
  let labeled = 0;

  for (const [id, expected] of Object.entries(site.expectedSignals ?? {})) {
    labeled += 1;
    const actual = signals[id] ?? null;

    if (actual !== expected) {
      mismatches.push({ kind: "signal", id, expected, actual });
    }
  }

  for (const [id, expected] of Object.entries(site.expectedOutcomes ?? {})) {
    labeled += 1;
    const actual = outcomes[id]?.state ?? null;

    if (actual !== expected) {
      mismatches.push({ kind: "outcome", id, expected, actual });
    }
  }

  for (const expectation of site.expectedPageRoles ?? []) {
    labeled += 1;
    const path = expectedPath(new URL(expectation.path, site.url).toString());
    const actual = pageRoleByPath.get(path) ?? null;

    if (actual !== expectation.primaryRole) {
      mismatches.push({
        kind: "page_role",
        id: path,
        expected: expectation.primaryRole,
        actual,
      });
    }
  }

  return {
    labeled,
    passed: labeled - mismatches.length,
    failed: mismatches.length,
    mismatches,
  };
}

function emptyExpectations() {
  return { labeled: 0, passed: 0, failed: 0, mismatches: [] };
}

function buildSiteResult(
  site: LiveSiteValidationManifest["sites"][number],
  result: CrawlWebsiteResult,
  analyzedAt: string,
): LiveSiteValidationResult {
  const inputs = pageInputs(result);
  const detectedSignals: AuthorWebsiteSignals =
    detectAuthorWebsiteSignals(inputs);
  const diagnostics = buildAnalyzerDiagnostics({
    crawlDiagnostics: result.diagnostics,
    pages: inputs,
    signals: detectedSignals,
    analyzedAt,
  });
  const signals = collectSignalDetections(detectedSignals);
  const outcomes = Object.fromEntries(
    [...diagnostics.outcomes]
      .sort((left, right) => left.signalId.localeCompare(right.signalId))
      .map((outcome) => [
        outcome.signalId,
        { state: outcome.state, reasonCode: outcome.reasonCode },
      ]),
  );
  const classifications = new Map(
    diagnostics.pageRoles.map((classification) => [
      classification.sourceUrl,
      classification,
    ]),
  );
  const pages = result.pages
    .map((page) => {
      const sourceUrl = page.extracted?.url ?? page.finalUrl;
      const classification = classifications.get(sourceUrl);

      return {
        url: sanitizeLiveValidationUrl(sourceUrl),
        statusCode: page.statusCode,
        declaredPageType: page.extracted?.pageType ?? null,
        primaryRole: classification?.primaryRole ?? null,
        secondaryRoles: classification?.secondaryRoles ?? [],
        confidence: classification?.confidence ?? null,
        browserRendered: Boolean(page.renderedEvidence),
        renderedExtractionAdopted: page.renderedEvidence?.adopted ?? false,
      };
    })
    .sort((left, right) => left.url.localeCompare(right.url));
  const pageRoleByPath = new Map(
    pages
      .filter(
        (page): page is typeof page & { primaryRole: PageRole } =>
          page.primaryRole !== null,
      )
      .map((page) => [expectedPath(page.url), page.primaryRole]),
  );
  const expectations = compareExpectations(
    site,
    signals,
    outcomes,
    pageRoleByPath,
  );
  const browserFallback = result.diagnostics.browserFallback;

  return {
    id: site.id,
    approvedUrl: sanitizeLiveValidationUrl(site.url),
    status: result.failureMessage ? "crawl_failed" : "completed",
    failureCode: result.failureMessage ? "no_successful_html_pages" : null,
    homepageUrl: sanitizeLiveValidationUrl(result.homepageUrl),
    crawl: {
      candidateUrlCount: result.diagnostics.candidateUrls,
      attemptedRequestCount: result.diagnostics.attemptedRequests,
      successfulHtmlPageCount: result.successfulHtmlPages,
      failedHttpPageCount: result.diagnostics.failedHttpPagesRecorded,
      skippedDuplicateCount: result.diagnostics.skippedDuplicates,
      skippedNonHtmlCount: result.diagnostics.skippedNonHtml,
      skippedUnsuccessfulStatusCount:
        result.diagnostics.skippedUnsuccessfulStatus,
      browserFallback: {
        status: browserFallback.status,
        triggerCandidateCount: browserFallback.triggerCandidates.length,
        attemptedPageCount: browserFallback.attemptedUrls.length,
        renderedPageCount: browserFallback.renderedUrls.length,
        adoptedPageCount: browserFallback.adoptedUrls.length,
        requestCount: browserFallback.requestCount,
        abortedRequestCount: browserFallback.abortedRequestCount,
        failureCount: browserFallback.failures.length,
      },
    },
    coverage: {
      staticHtmlState: diagnostics.coverage.staticHtmlState,
      stopReason: diagnostics.coverage.stopReason,
      discoveredUrlCount: diagnostics.coverage.discoveredUrlCount,
      attemptedUrlCount: diagnostics.coverage.attemptedUrlCount,
      successfulHtmlPageCount:
        diagnostics.coverage.successfulHtmlPageCount,
      failedUrlCount: diagnostics.coverage.failedUrlCount,
      unattemptedCandidateCount:
        diagnostics.coverage.unattemptedCandidateUrls.length,
      likelyJavaScriptDependentPageCount:
        diagnostics.coverage.likelyJavaScriptDependentUrls.length,
      renderingRequiredPageCount:
        diagnostics.coverage.renderingRequiredUrls.length,
    },
    pages,
    signals,
    outcomes,
    expectations,
  };
}

export function parseLiveSiteValidationManifest(
  value: unknown,
): LiveSiteValidationManifest {
  return liveManifestSchema.parse(value);
}

export async function runLiveSiteValidation({
  manifest: manifestInput,
  crawl = crawlWebsite,
  generatedAt = new Date().toISOString(),
}: {
  manifest: unknown;
  crawl?: CrawlSite;
  generatedAt?: string;
}): Promise<LiveSiteValidationReport> {
  const manifest = parseLiveSiteValidationManifest(manifestInput);
  const sites: LiveSiteValidationResult[] = [];

  // Sequential execution is intentional: this is an operator-controlled
  // validation tool and must not create a burst of production-like crawls.
  for (const site of manifest.sites) {
    try {
      const result = await crawl(site.url);
      sites.push(buildSiteResult(site, result, generatedAt));
    } catch {
      sites.push({
        id: site.id,
        approvedUrl: sanitizeLiveValidationUrl(site.url),
        status: "runner_error",
        failureCode: "unexpected_crawl_error",
        homepageUrl: null,
        crawl: null,
        coverage: null,
        pages: [],
        signals: {},
        outcomes: {},
        expectations: emptyExpectations(),
      });
    }
  }

  return {
    schemaVersion: LIVE_SITE_VALIDATION_SCHEMA_VERSION,
    manifestSchemaVersion: LIVE_SITE_VALIDATION_MANIFEST_VERSION,
    generatedAt,
    versions: {
      crawlDiagnostics: CRAWL_DIAGNOSTICS_VERSION,
      extraction: CRAWLER_EXTRACTION_VERSION,
      browserFallbackPolicy: BROWSER_FALLBACK_POLICY_VERSION,
      analyzerDiagnostics: ANALYZER_DIAGNOSTICS_VERSION,
      signalResolution: SIGNAL_RESOLUTION_VERSION,
      pageRoleClassifier: PAGE_ROLE_CLASSIFIER_VERSION,
      evidenceObservation: EVIDENCE_OBSERVATION_VERSION,
    },
    summary: {
      totalSites: sites.length,
      completedSites: sites.filter((site) => site.status === "completed").length,
      crawlFailedSites: sites.filter((site) => site.status === "crawl_failed")
        .length,
      runnerErrorSites: sites.filter((site) => site.status === "runner_error")
        .length,
      labeledExpectations: sites.reduce(
        (total, site) => total + site.expectations.labeled,
        0,
      ),
      passedExpectations: sites.reduce(
        (total, site) => total + site.expectations.passed,
        0,
      ),
      failedExpectations: sites.reduce(
        (total, site) => total + site.expectations.failed,
        0,
      ),
    },
    sites,
  };
}
