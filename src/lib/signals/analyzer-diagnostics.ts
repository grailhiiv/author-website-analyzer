import type {
  AuthorWebsiteSignals,
  ScannedPageSignalInput,
  SignalDetection,
} from "@/lib/signals/author-website-signals";
import {
  EVIDENCE_OBSERVATION_VERSION,
  PAGE_ROLE_CLASSIFIER_VERSION,
  type EvidenceObservationState,
  type PageRole,
  type PageRoleClassification,
} from "@/lib/signals/page-role-classifier";

export const ANALYZER_DIAGNOSTICS_VERSION = "1.1.0";
export const SIGNAL_RESOLUTION_VERSION = "1.1.0";

type InspectionState =
  | "inspected"
  | "partially_inspected"
  | "not_inspected"
  | "failed"
  | "unsupported";

export type AnalyzerSignalResolution = {
  signalId: string;
  state: EvidenceObservationState;
  reasonCode:
    | "evidence_found"
    | "eligible_surface_inspected_no_evidence"
    | "candidate_not_requested"
    | "request_failed"
    | "rendering_required"
    | "extractor_unsupported"
    | "no_eligible_surface_inspected";
  relevantPageRoles: PageRole[];
  inspectedUrls: string[];
  relatedUninspectedCandidateUrls: string[];
  evidence: string[];
  explanation: string;
  ruleVersion: string;
};

export type AnalyzerCoverage = {
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
  unattemptedCandidateUrls: string[];
  likelyJavaScriptDependentUrls: string[];
  renderingRequiredUrls: string[];
  capabilities: {
    staticHtml: InspectionState;
    metadata: InspectionState;
    links: InspectionState;
    forms: InspectionState;
    imageSrc: InspectionState;
    imageSrcset: InspectionState;
    commonLazyImageAttributes: InspectionState;
    renderedDom: InspectionState;
    cssBackgroundImages: InspectionState;
  };
  limitations: string[];
};

export type PersistedAnalyzerDiagnostics = {
  schemaVersion: string;
  analyzedAt: string;
  pageRoleClassifierVersion: string;
  evidenceObservationVersion: string;
  signalResolutionVersion: string;
  pageRoles: PageRoleClassification[];
  observations: NonNullable<AuthorWebsiteSignals["observations"]>;
  coverage: AnalyzerCoverage;
  outcomes: AnalyzerSignalResolution[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
}

function isSuccessfulPage(page: ScannedPageSignalInput) {
  return (
    page.statusCode === null ||
    page.statusCode === undefined ||
    (page.statusCode >= 200 && page.statusCode < 300)
  );
}

function getBodyText(page: ScannedPageSignalInput) {
  const headings = asRecord(page.headingsJson);
  return typeof headings?.bodyText === "string"
    ? headings.bodyText
    : page.contentText ?? "";
}

function hasExtractedForms(page: ScannedPageSignalInput) {
  return Array.isArray(page.formsJson) && page.formsJson.length > 0;
}

function isLikelyJavaScriptDependent(page: ScannedPageSignalInput) {
  if (!isSuccessfulPage(page)) {
    return false;
  }

  const bodyText = getBodyText(page).trim();
  const wordCount = page.wordCount ?? bodyText.split(/\s+/).filter(Boolean).length;

  return wordCount < 20 && !page.h1 && !hasExtractedForms(page);
}

function classificationsForRoles(
  classifications: PageRoleClassification[],
  roles: PageRole[],
) {
  return classifications.filter((classification) => {
    const classifiedRoles = [
      classification.primaryRole,
      ...classification.secondaryRoles,
    ];
    return roles.some((role) => classifiedRoles.includes(role));
  });
}

const ROLE_PATH_PATTERNS: Partial<Record<PageRole, RegExp>> = {
  ABOUT: /\/(?:about|about-me|author|bio|meet-[^/]+)(?:\/|$)/i,
  BOOKS_INDEX: /\/(?:books?|novels?|works|bibliography|titles)(?:\/|$)/i,
  BOOK_DETAIL: /\/(?:books?|novels?|titles)\/[^/]+(?:\/|$)/i,
  SERIES: /\/(?:series|[^/]+-(?:series|saga|trilogy))(?:\/|$)/i,
  NEWSLETTER: /\/(?:newsletter|subscribe|reader-list|sign-up)(?:\/|$)/i,
  CONTACT: /\/(?:contact|contact-me)(?:\/|$)/i,
  MEDIA_KIT: /\/(?:media|press|press-kit|media-kit)(?:\/|$)/i,
  PRIVACY: /\/(?:privacy|privacy-policy)(?:\/|$)/i,
};

function relatedCandidates(urls: string[], roles: PageRole[]) {
  const patterns = roles
    .map((role) => ROLE_PATH_PATTERNS[role])
    .filter((pattern): pattern is RegExp => Boolean(pattern));

  return urls
    .filter((url) => patterns.some((pattern) => pattern.test(url)))
    .slice(0, 20);
}

function buildCoverage(
  crawlDiagnostics: unknown,
  pages: ScannedPageSignalInput[],
): AnalyzerCoverage {
  const diagnostics = asRecord(crawlDiagnostics);
  const limits = asRecord(diagnostics?.limits);
  const browserFallback = asRecord(diagnostics?.browserFallback);
  const discoveredUrls = stringArray(diagnostics?.discoveredUrls).map(normalizeUrl);
  const attemptedUrls = new Set(
    [
      ...stringArray(diagnostics?.attemptedUrls),
      ...stringArray(browserFallback?.attemptedUrls),
    ].map(normalizeUrl),
  );
  const unattemptedCandidateUrls = discoveredUrls
    .filter((url) => !attemptedUrls.has(url))
    .slice(0, 100);
  const failedRequests = Array.isArray(diagnostics?.failedRequests)
    ? diagnostics.failedRequests.length
    : 0;
  const skippedUrls = Array.isArray(diagnostics?.skippedUrls)
    ? diagnostics.skippedUrls
    : [];
  const failedOutcomes = skippedUrls.filter((item) => {
    const reason = asRecord(item)?.reason;
    return reason === "request_failed" || reason === "unsuccessful_status";
  }).length;
  const failedUrlCount = failedRequests + failedOutcomes;
  const successfulPages = pages.filter(isSuccessfulPage);
  const triggerCandidates = Array.isArray(browserFallback?.triggerCandidates)
    ? browserFallback.triggerCandidates
        .map((item) => asRecord(item)?.url)
        .filter((url): url is string => typeof url === "string")
        .map(normalizeUrl)
    : [];
  const renderedUrls = new Set(
    stringArray(browserFallback?.renderedUrls).map(normalizeUrl),
  );
  const likelyJavaScriptDependentUrls = [
    ...new Set(
      triggerCandidates.length > 0
        ? triggerCandidates
        : successfulPages
            .filter(isLikelyJavaScriptDependent)
            .map((page) => normalizeUrl(page.url)),
    ),
  ].slice(0, 100);
  const renderingRequiredUrls = likelyJavaScriptDependentUrls.filter(
    (url) => !renderedUrls.has(url),
  );
  const successfulHtmlPageCount = asNumber(
    diagnostics?.savedHtmlPages,
    successfulPages.length,
  );
  const attemptedRequestCount = asNumber(
    diagnostics?.attemptedRequests,
    attemptedUrls.size,
  );
  const maxRequests = asNumber(limits?.maxRequests, 30);
  const maxSavedHtmlPages = asNumber(limits?.maxSavedHtmlPages, 10);
  const hasSuccessfulHtml = successfulHtmlPageCount > 0;
  const staticHtmlState = !hasSuccessfulHtml
    ? "limited"
    : unattemptedCandidateUrls.length === 0 && failedUrlCount === 0
      ? "complete"
      : "partial";
  const stopReason = !hasSuccessfulHtml
    ? "homepage_failed"
    : unattemptedCandidateUrls.length === 0
      ? "queue_exhausted"
      : attemptedRequestCount >= maxRequests
        ? "request_limit_reached"
        : successfulHtmlPageCount >= maxSavedHtmlPages
          ? "page_limit_reached"
          : "stopped_error";
  const staticInspectionState: InspectionState = hasSuccessfulHtml
    ? staticHtmlState === "complete"
      ? "inspected"
      : "partially_inspected"
    : "failed";
  const browserStatus =
    typeof browserFallback?.status === "string" ? browserFallback.status : null;
  const renderedInspectionState: InspectionState =
    browserStatus === "completed"
      ? "inspected"
      : browserStatus === "partial"
        ? "partially_inspected"
        : browserStatus === "failed"
          ? "failed"
          : browserStatus === "disabled"
            ? "unsupported"
            : "not_inspected";

  return {
    staticHtmlState,
    stopReason,
    discoveredUrlCount: discoveredUrls.length,
    attemptedUrlCount: attemptedUrls.size,
    successfulHtmlPageCount,
    failedUrlCount,
    unattemptedCandidateUrls,
    likelyJavaScriptDependentUrls,
    renderingRequiredUrls,
    capabilities: {
      staticHtml: staticInspectionState,
      metadata: staticInspectionState,
      links: staticInspectionState,
      forms: staticInspectionState,
      imageSrc: staticInspectionState,
      imageSrcset: staticInspectionState,
      commonLazyImageAttributes: staticInspectionState,
      renderedDom: renderedInspectionState,
      cssBackgroundImages: "unsupported",
    },
    limitations: [
      ...(browserStatus === "disabled"
        ? ["Rendered DOM fallback is disabled for this scan."]
        : browserStatus === "failed"
          ? ["Rendered DOM fallback was attempted but failed."]
          : browserStatus === "partial"
            ? ["Rendered DOM fallback completed for only part of the selected scope."]
            : browserStatus === "not_needed"
              ? ["No page met the deterministic browser-fallback trigger."]
              : browserStatus === null
                ? ["Rendered DOM inspection was not available for this earlier scan."]
                : []),
      "CSS background images are not extracted.",
      ...(renderingRequiredUrls.length > 0
        ? ["One or more saved pages still require JavaScript rendering."]
        : []),
    ],
  };
}

type ResolutionInput = {
  signalId: string;
  detection: SignalDetection;
  relevantPageRoles: PageRole[];
  allowBoundedStaticAbsence?: boolean;
  unsupportedWhenMissing?: boolean;
};

function resolveSignal({
  input,
  classifications,
  pages,
  coverage,
}: {
  input: ResolutionInput;
  classifications: PageRoleClassification[];
  pages: ScannedPageSignalInput[];
  coverage: AnalyzerCoverage;
}): AnalyzerSignalResolution {
  const relevantClassifications = classificationsForRoles(
    classifications,
    input.relevantPageRoles,
  );
  const relevantUrls = new Set(
    relevantClassifications.map((classification) =>
      normalizeUrl(classification.sourceUrl),
    ),
  );
  const inspectedPages = pages.filter(
    (page) => isSuccessfulPage(page) && relevantUrls.has(normalizeUrl(page.url)),
  );
  const inspectedUrls = inspectedPages.map((page) => page.url).slice(0, 20);
  const uninspectedCandidates = relatedCandidates(
    coverage.unattemptedCandidateUrls,
    input.relevantPageRoles,
  );
  let state: EvidenceObservationState;
  let reasonCode: AnalyzerSignalResolution["reasonCode"];
  let explanation: string;

  if (input.detection.detected) {
    state = "present";
    reasonCode = "evidence_found";
    explanation = "Accepted deterministic evidence was found.";
  } else if (uninspectedCandidates.length > 0) {
    state = "unknown";
    reasonCode = "candidate_not_requested";
    explanation = "A relevant discovered candidate was not inspected.";
  } else if (
    inspectedPages.some((page) =>
      coverage.renderingRequiredUrls.includes(normalizeUrl(page.url)),
    )
  ) {
    state = "unknown";
    reasonCode = "rendering_required";
    explanation = "The relevant saved surface appears to require rendering.";
  } else if (input.unsupportedWhenMissing) {
    state = "unknown";
    reasonCode = "extractor_unsupported";
    explanation = "A required evidence source is not supported by static extraction.";
  } else if (inspectedPages.length > 0) {
    state = "absent";
    reasonCode = "eligible_surface_inspected_no_evidence";
    explanation =
      "The relevant static HTML surface was inspected and accepted evidence was not found.";
  } else if (
    input.allowBoundedStaticAbsence &&
    coverage.staticHtmlState === "complete"
  ) {
    state = "absent";
    reasonCode = "eligible_surface_inspected_no_evidence";
    explanation =
      "The bounded static discovery queue was exhausted without accepted evidence.";
  } else if (coverage.failedUrlCount > 0) {
    state = "unknown";
    reasonCode = "request_failed";
    explanation = "One or more crawl failures prevent a defensible absence result.";
  } else {
    state = "unknown";
    reasonCode = "no_eligible_surface_inspected";
    explanation = "No eligible surface was successfully inspected.";
  }

  return {
    signalId: input.signalId,
    state,
    reasonCode,
    relevantPageRoles: input.relevantPageRoles,
    inspectedUrls,
    relatedUninspectedCandidateUrls: uninspectedCandidates,
    evidence: input.detection.evidence
      .slice(0, 8)
      .map((item) => item.slice(0, 240)),
    explanation,
    ruleVersion: SIGNAL_RESOLUTION_VERSION,
  };
}

function homepageDetection(
  signalId: string,
  pages: ScannedPageSignalInput[],
  classifications: PageRoleClassification[],
  select: (page: ScannedPageSignalInput) => string | null | undefined,
): ResolutionInput {
  const homeUrls = new Set(
    classificationsForRoles(classifications, ["HOME"]).map((classification) =>
      normalizeUrl(classification.sourceUrl),
    ),
  );
  const homepage = pages.find(
    (page) => isSuccessfulPage(page) && homeUrls.has(normalizeUrl(page.url)),
  );
  const value = homepage ? select(homepage)?.trim() : "";

  return {
    signalId,
    relevantPageRoles: ["HOME"],
    detection: {
      detected: Boolean(value),
      evidence: value && homepage ? [`${signalId}: ${value}`] : [],
    },
  };
}

function inspectedRoleDetection(
  signalId: string,
  pages: ScannedPageSignalInput[],
  classifications: PageRoleClassification[],
  roles: PageRole[],
): SignalDetection {
  const eligibleUrls = new Set(
    classificationsForRoles(classifications, roles).map((classification) =>
      normalizeUrl(classification.sourceUrl),
    ),
  );
  const inspectedUrls = pages
    .filter(
      (page) =>
        isSuccessfulPage(page) && eligibleUrls.has(normalizeUrl(page.url)),
    )
    .map((page) => page.url);

  return {
    detected: inspectedUrls.length > 0,
    evidence: inspectedUrls.map(
      (url) => `${signalId}: eligible content inspected at ${url}`,
    ),
  };
}

export function buildAnalyzerDiagnostics({
  crawlDiagnostics,
  pages,
  signals,
  analyzedAt = new Date().toISOString(),
}: {
  crawlDiagnostics: unknown;
  pages: ScannedPageSignalInput[];
  signals: AuthorWebsiteSignals;
  analyzedAt?: string;
}): PersistedAnalyzerDiagnostics {
  const pageRoles = signals.pageRoles ?? [];
  const coverage = buildCoverage(crawlDiagnostics, pages);
  const combinedDetection = (...detections: SignalDetection[]): SignalDetection => ({
    detected: detections.some((detection) => detection.detected),
    evidence: detections.flatMap((detection) => detection.evidence),
  });
  const resolutionInputs: ResolutionInput[] = [
    {
      signalId: "brand.about_presence",
      detection: inspectedRoleDetection(
        "brand.about_presence",
        pages,
        pageRoles,
        ["ABOUT"],
      ),
      relevantPageRoles: ["ABOUT"],
      allowBoundedStaticAbsence: true,
    },
    {
      signalId: "books.cover_image",
      detection: signals.bookPromotion.bookCoverImages,
      relevantPageRoles: ["BOOKS_INDEX", "BOOK_DETAIL", "SERIES"],
      unsupportedWhenMissing: true,
    },
    {
      signalId: "books.purchase_path",
      detection: combinedDetection(
        signals.bookPromotion.buyLinks,
        signals.bookPromotion.retailerLinks,
      ),
      relevantPageRoles: ["BOOKS_INDEX", "BOOK_DETAIL", "SERIES", "STORE"],
    },
    {
      signalId: "engagement.newsletter_signup",
      detection: signals.newsletter.newsletterSignupForm,
      relevantPageRoles: ["NEWSLETTER"],
      allowBoundedStaticAbsence: true,
    },
    {
      signalId: "trust.contact_route",
      detection: combinedDetection(
        signals.trust.contactForm,
        signals.trust.contactEmail,
      ),
      relevantPageRoles: ["CONTACT"],
      allowBoundedStaticAbsence: true,
    },
    {
      signalId: "trust.privacy_information",
      detection: inspectedRoleDetection(
        "trust.privacy_information",
        pages,
        pageRoles,
        ["PRIVACY"],
      ),
      relevantPageRoles: ["PRIVACY"],
      allowBoundedStaticAbsence: true,
    },
    homepageDetection(
      "search.home_title",
      pages,
      pageRoles,
      (page) => page.title,
    ),
    homepageDetection(
      "search.home_meta_description",
      pages,
      pageRoles,
      (page) => page.metaDescription,
    ),
    homepageDetection("search.home_h1", pages, pageRoles, (page) => page.h1),
  ];

  return {
    schemaVersion: ANALYZER_DIAGNOSTICS_VERSION,
    analyzedAt,
    pageRoleClassifierVersion: PAGE_ROLE_CLASSIFIER_VERSION,
    evidenceObservationVersion: EVIDENCE_OBSERVATION_VERSION,
    signalResolutionVersion: SIGNAL_RESOLUTION_VERSION,
    pageRoles,
    observations: signals.observations ?? [],
    coverage,
    outcomes: resolutionInputs.map((input) =>
      resolveSignal({ input, classifications: pageRoles, pages, coverage }),
    ),
  };
}

export function mergeAnalyzerDiagnostics(
  crawlDiagnostics: unknown,
  analysis: PersistedAnalyzerDiagnostics,
): Record<string, unknown> & { analysis: PersistedAnalyzerDiagnostics } {
  return {
    ...(asRecord(crawlDiagnostics) ?? {}),
    analysis,
  };
}
