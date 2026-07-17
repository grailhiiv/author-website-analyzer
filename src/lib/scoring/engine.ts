import { FindingSeverity, ReportCategory } from "@/generated/prisma/client";
import type {
  AuthorWebsiteSignals,
  ScannedPageSignalInput,
  SignalDetection,
} from "@/lib/signals/author-website-signals";
import type {
  VisualDesignAnalysis,
  VisualDesignObservation,
  VisualViewportVariant,
} from "@/lib/screenshots/visual-design";
import {
  getScoringCheck,
  SCORING_CHECK_REGISTRY,
  SCORING_CHECK_REGISTRY_VERSION,
  type RootCauseKey,
  type ScoringCheckId,
} from "@/lib/scoring/check-registry";
import { getCheckStatusContent } from "@/lib/scoring/check-status-content.generated";

export type TechnicalAuditScoreInput = {
  mobilePerformance?: number | null;
  desktopPerformance?: number | null;
  mobileAccessibility?: number | null;
  desktopAccessibility?: number | null;
  mobileSeo?: number | null;
  desktopSeo?: number | null;
  mobileBestPractices?: number | null;
  desktopBestPractices?: number | null;
};

export type ScoringPageInput = ScannedPageSignalInput & {
  screenshotUrl?: string | null;
};

export type ScoringInput = {
  signals: AuthorWebsiteSignals;
  pagesScanned: ScoringPageInput[];
  technicalAudit?: TechnicalAuditScoreInput | null;
  visualDesignAnalysis?: VisualDesignAnalysis | null;
};

export type ScoringFinding = {
  category: ReportCategory;
  severity: FindingSeverity;
  title: string;
  finding: string;
  recommendation: string;
  priority: number;
  checkId?: ScoringCheckId;
  rootCauseKey: RootCauseKey;
  recoverablePoints: number;
  relatedCheckIds?: ScoringCheckId[];
};

export type ScoringCheckState = "passed" | "needs_review" | "failed";

export type CheckEvidenceSource =
  | "html"
  | "rendered_dom"
  | "screenshot"
  | "http_response"
  | "sitemap"
  | "robots"
  | "pagespeed"
  | "structured_data"
  | "manual_rule";

export type CheckEvidence = {
  source: CheckEvidenceSource;
  pageUrl?: string;
  selector?: string;
  observedText?: string;
  observedValue?: string | number | boolean;
  expectedValue?: string | number | boolean;
  threshold?: string | number;
  confidence: number;
  pagesChecked?: number;
  reasonCode?: string;
  metadata?: Record<string, unknown>;
};

export type ScoringCheckResult = {
  registryVersion: number;
  checkId: ScoringCheckId;
  checkVersion: number;
  category: ReportCategory;
  state: ScoringCheckState;
  availablePoints: number;
  earnedPoints: number;
  reasonCode: string;
  rootCauseKey: RootCauseKey;
  details: string;
  recommendation: string;
  evidence: CheckEvidence[];
  evidenceReferences: Record<string, unknown>;
};

export type CategoryScoreResult = {
  category: ReportCategory;
  label: string;
  weight: number;
  score: number;
  maxScore: number;
  percentageScore: number;
  earnedPoints: number;
  availablePoints: number;
  verifiedPoints: number;
  verifiedScore: number | null;
  coveragePercentage: number;
  statusCounts: Record<ScoringCheckState, number>;
  summary: string;
};

export type ScoringCoverageLevel = "normal" | "provisional" | "insufficient";

export type ScoringCoverage = {
  registeredWeight: number;
  passedWeight: number;
  failedWeight: number;
  needsReviewWeight: number;
  verifiedWeight: number;
  earnedWeight: number;
  coveragePercentage: number;
  calculatedScore: number | null;
  level: ScoringCoverageLevel;
  statusCounts: Record<ScoringCheckState, number>;
};

export type ScoringResult = {
  overallScore: number | null;
  coverage: ScoringCoverage;
  categoryScores: CategoryScoreResult[];
  findings: ScoringFinding[];
  priorityRecommendations: ScoringFinding[];
  quickWins: ScoringFinding[];
  serviceFitLabel: ServiceFitLabel;
  checkResults: ScoringCheckResult[];
};

export type ServiceFitLabel =
  | "Website redesign"
  | "Website management"
  | "SEO improvement"
  | "Newsletter setup"
  | "New author website"
  | "Website optimization";

type ScoreRule = {
  points: number;
  passed: boolean | null;
  title: string;
  severity: FindingSeverity;
  priority: number;
  checkId: ScoringCheckId;
  reasonCode?: string;
  evidenceReferences?: Record<string, unknown>;
  evidence?: CheckEvidence[];
  earnedPoints?: number;
};

export type DeterministicScoringCategory = {
  category: ReportCategory;
  label: string;
  weight: number;
};

const categoryLabels: Record<ReportCategory, string> = {
  BRAND_CLARITY: "Brand Clarity",
  BOOK_VISIBILITY: "Book Visibility",
  READER_ENGAGEMENT: "Email Growth",
  SEARCH_VISIBILITY: "Search Visibility",
  MOBILE_PERFORMANCE: "Mobile Experience",
  TECHNICAL_HEALTH: "Technical Health",
  AUTHOR_TRUST: "Author Trust",
  SITE_USABILITY: "Site Usability",
};

const categoryOrder = [
  ReportCategory.BRAND_CLARITY,
  ReportCategory.BOOK_VISIBILITY,
  ReportCategory.READER_ENGAGEMENT,
  ReportCategory.SEARCH_VISIBILITY,
  ReportCategory.MOBILE_PERFORMANCE,
  ReportCategory.TECHNICAL_HEALTH,
  ReportCategory.AUTHOR_TRUST,
  ReportCategory.SITE_USABILITY,
] as const;

export const DETERMINISTIC_SCORING_CATEGORIES = categoryOrder.map(
  (category): DeterministicScoringCategory => ({
    category,
    label: categoryLabels[category],
    weight: SCORING_CHECK_REGISTRY.filter(
      (check) => check.category === category,
    ).reduce((total, check) => total + check.points, 0),
  }),
);

export const DETERMINISTIC_SCORING_TOTAL =
  DETERMINISTIC_SCORING_CATEGORIES.reduce(
    (total, category) => total + category.weight,
    0,
  );

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function has(signal: SignalDetection) {
  return signal.detected;
}

function getConfig(category: ReportCategory) {
  const config = DETERMINISTIC_SCORING_CATEGORIES.find(
    (item) => item.category === category,
  );

  if (!config) {
    throw new Error(`Unknown scoring category: ${category}`);
  }

  return config;
}

function scoreSummary(score: number) {
  if (score >= 85) {
    return "Strong support for this part of the author website.";
  }

  if (score >= 70) {
    return "Good foundation with a few clear improvements available.";
  }

  if (score >= 50) {
    return "Some useful pieces are present, but this area needs improvement.";
  }

  return "Important author website basics are missing or unclear in the scan.";
}

function safeEvidenceText(value: unknown, fallback: string) {
  const text = textFromUnknown(value)
    .replaceAll(/\s+/g, " ")
    .trim()
    .slice(0, 240);

  return text || fallback;
}

function buildEvidenceDetails(
  title: string,
  state: ScoringCheckState,
  evidence: readonly CheckEvidence[],
  reasonCode: string,
) {
  const primary = evidence[0];
  const page = primary?.pageUrl ? ` on ${primary.pageUrl}` : "";
  const observation = safeEvidenceText(
    primary?.observedText ?? primary?.observedValue,
    state === "needs_review" ? "the required evidence was unavailable" : state,
  );
  const comparison = safeEvidenceText(
    primary?.threshold ?? primary?.expectedValue,
    "the registered audit rule",
  );

  if (state === "passed") {
    return `The scan inspected ${primary?.source ?? "the available evidence"}${page} and observed ${observation}, which met ${comparison} for ${title.toLowerCase()}.`;
  }

  if (state === "failed") {
    return `The scan inspected ${primary?.source ?? "the available evidence"}${page} and observed ${observation}, which did not meet ${comparison} for ${title.toLowerCase()}.`;
  }

  return `The scan inspected ${primary?.source ?? "the available evidence"}${page}, but could not verify ${title.toLowerCase()} because ${observation} (${reasonCode}).`;
}

function primitiveEvidenceValue(
  value: unknown,
  fallback: string | number | boolean,
) {
  return typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
    ? value
    : fallback;
}

function scoreCategory(
  config: DeterministicScoringCategory,
  rules: ScoreRule[],
  defaultPageUrl: string | null,
): {
  score: CategoryScoreResult;
  findings: ScoringFinding[];
  checkResults: ScoringCheckResult[];
} {
  // Validate every rule, including passing rules, so a new scoring check cannot
  // ship without complete deterministic content for every active status.
  rules.forEach((rule) => {
    const check = getScoringCheck(rule.checkId);

    if (check.category !== config.category || check.points !== rule.points) {
      throw new Error(
        `Scoring rule ${rule.checkId} does not match its registered category or points.`,
      );
    }

    getCheckStatusContent(rule.checkId, "passed");
    getCheckStatusContent(rule.checkId, "needs_review");
    getCheckStatusContent(rule.checkId, "failed");
  });

  const availablePoints = rules.reduce((sum, rule) => sum + rule.points, 0);
  const verifiedPoints = rules.reduce(
    (sum, rule) => sum + (rule.passed === null ? 0 : rule.points),
    0,
  );
  const earnedPoints = rules.reduce((sum, rule) => {
    if (rule.passed === null) return sum;
    if (typeof rule.earnedPoints === "number") return sum + rule.earnedPoints;
    return sum + (rule.passed ? rule.points : 0);
  }, 0);
  const verifiedScore =
    verifiedPoints > 0
      ? Math.max(
          0,
          Math.min(
            config.weight,
            Math.round((earnedPoints / verifiedPoints) * config.weight),
          ),
        )
      : null;
  const score = verifiedScore ?? 0;
  const percentageScore =
    config.weight > 0 ? clampScore((score / config.weight) * 100) : 0;
  const checkResults = rules.map<ScoringCheckResult>((rule) => {
    const check = getScoringCheck(rule.checkId);
    const state: ScoringCheckState =
      rule.passed === true
        ? "passed"
        : rule.passed === false
          ? "failed"
          : "needs_review";

    const reasonCode =
      rule.reasonCode ??
      (state === "passed"
        ? "DETERMINISTIC_EVIDENCE_PASSED"
        : state === "failed"
          ? "DETERMINISTIC_EVIDENCE_FAILED"
          : "PAGE_NOT_CRAWLED");
    const content = getCheckStatusContent(check.id, state);
    const evidence = rule.evidence?.length
      ? rule.evidence
      : [
          {
            source:
              check.source === "rendered"
                ? "rendered_dom"
                : check.source === "pagespeed"
                  ? "pagespeed"
                  : check.source === "crawl"
                    ? "http_response"
                    : check.source === "signals"
                      ? "html"
                      : "manual_rule",
            ...(defaultPageUrl ? { pageUrl: defaultPageUrl } : {}),
            observedValue: primitiveEvidenceValue(
              rule.evidenceReferences?.observedValue,
              state,
            ),
            expectedValue: check.evidencePolicyId,
            confidence: state === "needs_review" ? 0 : 1,
            reasonCode,
            metadata: rule.evidenceReferences,
          } satisfies CheckEvidence,
        ];
    const details = buildEvidenceDetails(
      check.title,
      state,
      evidence,
      reasonCode,
    );
    const earnedPoints =
      state === "needs_review"
        ? 0
        : typeof rule.earnedPoints === "number"
          ? rule.earnedPoints
          : state === "passed"
            ? rule.points
            : 0;

    return {
      registryVersion: SCORING_CHECK_REGISTRY_VERSION,
      checkId: check.id,
      checkVersion: check.version,
      category: check.category,
      state,
      availablePoints: rule.points,
      earnedPoints,
      reasonCode,
      rootCauseKey: check.rootCauseKey,
      details,
      recommendation: content.recommendation,
      evidence,
      evidenceReferences: {
        details,
        recommendation: content.recommendation,
        rootCauseKey: check.rootCauseKey,
        evidence,
      },
    };
  });
  const checkResultById = new Map(
    checkResults.map((result) => [result.checkId, result]),
  );
  const findings = rules
    .filter((rule) => rule.passed === false)
    .map<ScoringFinding>((rule) => {
      const result = checkResultById.get(rule.checkId);
      const content = getCheckStatusContent(rule.checkId, "failed");

      return {
        category: config.category,
        severity: rule.severity,
        title: rule.title,
        finding: result?.details ?? content.details,
        recommendation: result?.recommendation ?? content.recommendation,
        priority: rule.priority,
        checkId: rule.checkId,
        rootCauseKey: getScoringCheck(rule.checkId).rootCauseKey,
        recoverablePoints: rule.points - (rule.earnedPoints ?? 0),
      };
    });

  return {
    score: {
      category: config.category,
      label: config.label,
      weight: config.weight,
      score,
      maxScore: config.weight,
      percentageScore,
      earnedPoints,
      availablePoints,
      verifiedPoints,
      verifiedScore,
      coveragePercentage: Math.round((verifiedPoints / config.weight) * 100),
      statusCounts: checkResults.reduce<Record<ScoringCheckState, number>>(
        (counts, check) => {
          counts[check.state] += 1;
          return counts;
        },
        { passed: 0, needs_review: 0, failed: 0 },
      ),
      summary: scoreSummary(percentageScore),
    },
    findings,
    checkResults,
  };
}

function homepage(pages: ScoringPageInput[]) {
  return (
    pages.find((page) => page.pageType === "HOME") ??
    pages.find((page) => page.url.endsWith("/")) ??
    pages[0] ??
    null
  );
}

function detectAuthorName(signals: AuthorWebsiteSignals) {
  const evidence = signals.authorBrand.authorNameVisible.evidence.join(" ");
  const match = evidence.match(
    /(?:Author name|Likely author name(?: from biography)?):\s*([^|(]+)/i,
  );

  return match?.[1]?.trim() ?? null;
}

function textFromUnknown(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(textFromUnknown).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(textFromUnknown).join(" ");
  }

  return "";
}

function pageText(page: ScoringPageInput) {
  return [
    page.url,
    page.title,
    page.metaDescription,
    page.h1,
    page.contentText,
    textFromUnknown(page.headingsJson),
    textFromUnknown(page.linksJson),
    textFromUnknown(page.imagesJson),
    textFromUnknown(page.formsJson),
  ]
    .filter(Boolean)
    .join(" ");
}

function allPageText(pages: ScoringPageInput[]) {
  return pages.map(pageText).join(" ");
}

function successfulPage(page: ScoringPageInput) {
  return (
    typeof page.statusCode !== "number" ||
    (page.statusCode >= 200 && page.statusCode < 400)
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pageEvidence(
  source: CheckEvidenceSource,
  pageUrl: string | null | undefined,
  observedValue: string | number | boolean | undefined,
  expectedValue: string | number | boolean,
  reasonCode: string,
  extras: Partial<CheckEvidence> = {},
): CheckEvidence {
  return {
    source,
    ...(pageUrl ? { pageUrl } : {}),
    ...(observedValue !== undefined ? { observedValue } : {}),
    expectedValue,
    confidence: reasonCode.includes("MISSING") ? 0 : 1,
    reasonCode,
    ...extras,
  };
}

function signalRule(
  input: ScoringInput,
  checkId: ScoringCheckId,
  signal: SignalDetection,
  title: string,
  severity: FindingSeverity,
  priority: number,
  pageUrl = homepage(input.pagesScanned)?.url ?? null,
): ScoreRule {
  const hasCrawlEvidence = input.pagesScanned.length > 0;
  const passed = hasCrawlEvidence ? signal.detected : null;
  const reasonCode = !hasCrawlEvidence
    ? "PAGE_NOT_CRAWLED"
    : signal.detected
      ? "SIGNAL_DETECTED"
      : "SIGNAL_NOT_DETECTED";

  return {
    checkId,
    points: getScoringCheck(checkId).points,
    passed,
    title,
    severity,
    priority,
    reasonCode,
    evidence: [
      pageEvidence(
        "html",
        pageUrl,
        signal.evidence.join("; ") || "No matching signal was found",
        getScoringCheck(checkId).evidencePolicyId,
        reasonCode,
        { confidence: passed === null ? 0 : 1 },
      ),
    ],
    evidenceReferences: { signalEvidence: signal.evidence },
  };
}

function observationEvidence(
  observation: VisualDesignObservation,
  pageUrl: string | null,
): CheckEvidence {
  return pageEvidence(
    "rendered_dom",
    pageUrl,
    observation.evidence,
    "passed rendered observation",
    `RENDERED_${observation.status.toUpperCase()}`,
    {
      confidence: observation.status === "needs_review" ? 0 : 1,
      metadata: {
        observationId: observation.id,
        viewport: observation.viewport,
        summary: observation.summary,
      },
    },
  );
}

function buildObservationRule(
  checkId: ScoringCheckId,
  analysis: VisualDesignAnalysis | null | undefined,
  observationIds: readonly VisualDesignObservation["id"][],
  requiredViewports: readonly VisualViewportVariant[],
  pageUrl: string | null,
  title: string,
  severity: FindingSeverity,
  priority: number,
): ScoreRule {
  const requiredKeys = observationIds.flatMap((observationId) =>
    requiredViewports.map((viewport) => `${observationId}:${viewport}`),
  );
  const observationsByKey = new Map(
    analysis?.observations.map((observation) => [
      `${observation.id}:${observation.viewport}`,
      observation,
    ]) ?? [],
  );
  const requiredObservations = requiredKeys.map((key) =>
    observationsByKey.get(key),
  );
  const hasConfirmedFailure = requiredObservations.some(
    (observation) => observation?.status === "failed",
  );
  const hasMissingEvidence = requiredObservations.some(
    (observation) => !observation,
  );
  const hasInsufficientEvidence = requiredObservations.some(
    (observation) => observation?.status === "needs_review",
  );
  const passed = hasConfirmedFailure
    ? false
    : hasMissingEvidence || hasInsufficientEvidence
      ? null
      : true;
  const reasonCode = hasConfirmedFailure
    ? "RENDERED_EVIDENCE_FAILED"
    : hasMissingEvidence
      ? "REQUIRED_VIEWPORT_EVIDENCE_MISSING"
      : hasInsufficientEvidence
        ? "EVIDENCE_COVERAGE_INSUFFICIENT"
        : "RENDERED_EVIDENCE_PASSED";

  return {
    points: getScoringCheck(checkId).points,
    passed,
    title,
    severity,
    priority,
    checkId,
    reasonCode,
    evidence: requiredObservations
      .filter((observation): observation is VisualDesignObservation =>
        Boolean(observation),
      )
      .map((observation) => observationEvidence(observation, pageUrl)),
    evidenceReferences: {
      analysisVersion: analysis?.version ?? null,
      observationIds,
      requiredViewports,
      errors: analysis?.errors ?? [],
    },
  };
}

function buildVisualCheckRule(
  checkId: ScoringCheckId,
  analysis: VisualDesignAnalysis | null | undefined,
  pageUrl: string | null,
): ScoreRule {
  const check = getScoringCheck(checkId);
  if (check.source !== "rendered") {
    throw new Error(`Scoring check ${checkId} is not a rendered check.`);
  }

  return buildObservationRule(
    checkId,
    analysis,
    [check.requiredObservationId],
    check.requiredViewports,
    pageUrl,
    check.findingTitle,
    check.severity,
    check.priority,
  );
}

function hasUsefulInternalLinks(pages: ScoringPageInput[]) {
  if (pages.length > 1) {
    return true;
  }

  const home = homepage(pages);
  const linksText = textFromUnknown(home?.linksJson);

  return /href["']?\s*:\s*["']?\/|\/about|\/books?|\/contact|\/newsletter|\/blog/i.test(
    linksText,
  );
}

function homepageNewsletterDetected(
  signals: AuthorWebsiteSignals,
  pages: ScoringPageInput[],
) {
  const homeUrl = homepage(pages)?.url;

  if (!homeUrl) {
    return false;
  }

  const evidence = [
    ...signals.newsletter.newsletterSignupForm.evidence,
    ...signals.newsletter.subscribeForm.evidence,
    ...signals.newsletter.emailInput.evidence,
  ].join(" ");

  return evidence.includes(homeUrl);
}

function retailerCount(signals: AuthorWebsiteSignals) {
  return Object.values(signals.retailers).filter(
    (retailer) => retailer.detected,
  ).length;
}

function scoreAtLeast(score: number | null | undefined, target: number) {
  return typeof score === "number" ? score >= target : null;
}

function pageSpeedRule(
  checkId: ScoringCheckId,
  score: number | null | undefined,
  target: number,
  pageUrl: string | null,
  title: string,
  severity: FindingSeverity,
  priority: number,
  earnedPoints?: number,
): ScoreRule {
  const passed = scoreAtLeast(score, target);
  const reasonCode =
    typeof score !== "number"
      ? "PAGESPEED_RESULT_MISSING"
      : score >= target
        ? "PAGESPEED_TARGET_MET"
        : "PAGESPEED_TARGET_NOT_MET";

  return {
    checkId,
    points: getScoringCheck(checkId).points,
    passed,
    title,
    severity,
    priority,
    reasonCode,
    ...(typeof earnedPoints === "number" ? { earnedPoints } : {}),
    evidence: [
      pageEvidence(
        "pagespeed",
        pageUrl,
        typeof score === "number" ? score : "PageSpeed result unavailable",
        target,
        reasonCode,
        {
          threshold: target,
          confidence: typeof score === "number" ? 1 : 0,
          metadata: { score, target },
        },
      ),
    ],
    evidenceReferences: { score: score ?? null, target },
  };
}

function mobilePerformancePoints(score: number | null | undefined) {
  if (typeof score !== "number" || score < 40) return 0;
  if (score < 60) return 1;
  if (score < 75) return 2;
  if (score < 90) return 3;
  return 4;
}

function headingRecord(page: ScoringPageInput | null) {
  return asRecord(page?.headingsJson);
}

function homepageRobots(page: ScoringPageInput | null) {
  const headings = headingRecord(page);
  const seo = asRecord(headings?.seo);
  const value = headings?.robots ?? seo?.robots;
  return typeof value === "string" ? value.trim() : "";
}

function homepageH1Count(page: ScoringPageInput | null) {
  const value = headingRecord(page)?.h1Count;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : page?.h1
      ? 1
      : 0;
}

function homepageCanonical(page: ScoringPageInput | null) {
  const headings = headingRecord(page);
  const seo = asRecord(headings?.seo);
  const value = headings?.canonicalUrl ?? seo?.canonicalUrl;
  return typeof value === "string" ? value.trim() : "";
}

function validCanonicalUrl(value: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type ExtractedCta = { text: string; href: string | null };

function extractedCtas(pages: ScoringPageInput[]) {
  const results: Array<ExtractedCta & { pageUrl: string }> = [];

  for (const page of pages) {
    const links = asRecord(page.linksJson);
    const candidates = Array.isArray(links?.ctas) ? links.ctas : [];

    for (const candidate of candidates) {
      const record = asRecord(candidate);
      if (!record) continue;
      const text = typeof record.text === "string" ? record.text.trim() : "";
      const href = typeof record.href === "string" ? record.href.trim() : null;
      if (text || href) results.push({ text, href, pageUrl: page.url });
    }
  }

  return results;
}

function genericCtaText(value: string) {
  return /^(?:click here|here|learn more|read more|more|submit|go)$/i.test(
    value.trim(),
  );
}

type ExtractedInternalLink = {
  text: string;
  href: string;
  pageUrl: string;
};

function extractedInternalLinks(pages: ScoringPageInput[]) {
  const results: ExtractedInternalLink[] = [];

  for (const page of pages) {
    const links = asRecord(page.linksJson);
    const candidates = Array.isArray(links?.internal) ? links.internal : [];

    for (const candidate of candidates) {
      const record = asRecord(candidate);
      if (!record || typeof record.href !== "string") continue;
      results.push({
        text: typeof record.text === "string" ? record.text.trim() : "",
        href: record.href.trim(),
        pageUrl: page.url,
      });
    }
  }

  return results;
}

function canonicalMatchesHomepage(canonical: string, homepageUrl: string) {
  try {
    const canonicalUrl = new URL(canonical);
    const homeUrl = new URL(homepageUrl);
    const normalizePath = (path: string) =>
      path === "/" ? path : path.replace(/\/+$/, "");

    return (
      canonicalUrl.protocol === homeUrl.protocol &&
      canonicalUrl.host === homeUrl.host &&
      normalizePath(canonicalUrl.pathname) === normalizePath(homeUrl.pathname)
    );
  } catch {
    return false;
  }
}

type StructuredIdentityCandidate = {
  type: string;
  name: string;
  url: string | null;
};

function structuredIdentityCandidates(page: ScoringPageInput | null) {
  const candidates: StructuredIdentityCandidate[] = [];
  const roots = headingRecord(page)?.jsonLd;

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const record = asRecord(value);
    if (!record) return;

    const rawTypes = Array.isArray(record["@type"])
      ? record["@type"]
      : [record["@type"]];
    const types = rawTypes.filter(
      (entry): entry is string => typeof entry === "string",
    );
    const matchedType = types.find((type) =>
      /^(?:Person|Organization)$/i.test(type),
    );
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const url = typeof record.url === "string" ? record.url.trim() : null;

    if (matchedType && name) {
      candidates.push({ type: matchedType, name, url });
    }

    Object.values(record).forEach(visit);
  };

  visit(roots);
  return candidates;
}

function structuredIdentityIsValid(
  candidate: StructuredIdentityCandidate,
  homeUrl: string,
  expectedAuthorName: string | null,
) {
  const nameMatches = expectedAuthorName
    ? candidate.name
        .toLocaleLowerCase()
        .includes(expectedAuthorName.toLocaleLowerCase()) ||
      expectedAuthorName
        .toLocaleLowerCase()
        .includes(candidate.name.toLocaleLowerCase())
    : true;
  const urlMatches = candidate.url
    ? (() => {
        try {
          return new URL(candidate.url, homeUrl).host === new URL(homeUrl).host;
        } catch {
          return false;
        }
      })()
    : true;

  return nameMatches && urlMatches;
}

function authorLevelTrustProof(pages: ScoringPageInput[]) {
  const pattern =
    /\b(?:award[- ]winning author|bestselling author|winner of|recipient of|featured in|appeared on|media coverage|published by|keynote speaker|speaking appearance|professional endorsement)\b/i;

  for (const page of pages) {
    const match = pageText(page).match(pattern);
    if (match) return { pageUrl: page.url, observation: match[0] };
  }

  return null;
}

function titleIncludesAuthorOrBrand(
  signals: AuthorWebsiteSignals,
  pages: ScoringPageInput[],
) {
  const title = homepage(pages)?.title ?? "";
  const authorName = detectAuthorName(signals);

  if (authorName && title.toLowerCase().includes(authorName.toLowerCase())) {
    return true;
  }

  return /\b(author|writer|novelist|poet|memoirist|books?|fiction|nonfiction|series)\b/i.test(
    title,
  );
}

function h1GivesAuthorClarity(
  signals: AuthorWebsiteSignals,
  pages: ScoringPageInput[],
) {
  const h1 = homepage(pages)?.h1 ?? "";

  return (
    h1.length > 3 &&
    (has(signals.authorBrand.authorNameVisible) ||
      has(signals.authorBrand.genreOrCategoryMentioned) ||
      has(signals.bookPromotion.bookTitles))
  );
}

function siteLooksWordPress(pages: ScoringPageInput[]) {
  return /\bwp-content\b|\bwp-includes\b|\bwordpress\b/i.test(
    allPageText(pages),
  );
}

function oldCopyrightYear(pages: ScoringPageInput[]) {
  const currentYear = new Date().getFullYear();
  const years = [
    ...allPageText(pages).matchAll(/copyright[^0-9]*(20[0-9]{2})/gi),
  ]
    .map((match) => Number(match[1]))
    .filter((year) => Number.isInteger(year));

  return years.some((year) => currentYear - year >= 3);
}

function buildBrandRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned } = input;
  const home = homepage(pagesScanned);
  const homepageDepthPassed = home
    ? successfulPage(home) && (home.wordCount ?? 0) >= 50
    : null;
  const homepageDepthReason = !home
    ? "PAGE_NOT_CRAWLED"
    : homepageDepthPassed
      ? "HOMEPAGE_CONTENT_DEPTH_MET"
      : "HOMEPAGE_CONTENT_TOO_THIN";

  return [
    signalRule(
      input,
      "brand.author_name",
      signals.authorBrand.authorNameVisible,
      "Author name is not clear",
      FindingSeverity.HIGH,
      1,
    ),
    signalRule(
      input,
      "brand.genre_positioning",
      signals.authorBrand.genreOrCategoryMentioned,
      "Writing category is unclear",
      FindingSeverity.MEDIUM,
      2,
    ),
    signalRule(
      input,
      "brand.homepage_headline",
      signals.authorBrand.clearHomepageHeadline,
      "Homepage headline needs clarity",
      FindingSeverity.HIGH,
      2,
    ),
    signalRule(
      input,
      "brand.about_path",
      signals.authorBrand.aboutSectionOrPage,
      "About path is hard to confirm",
      FindingSeverity.MEDIUM,
      4,
    ),
    {
      checkId: "brand.homepage_content_depth",
      points: 1,
      passed: homepageDepthPassed,
      title: "Homepage content looks thin",
      severity: FindingSeverity.LOW,
      priority: 6,
      reasonCode: homepageDepthReason,
      evidence: [
        pageEvidence(
          "html",
          home?.url,
          home ? `${home.wordCount ?? 0} words` : "Homepage was not crawled",
          "at least 50 words of useful introductory content",
          homepageDepthReason,
          { threshold: 50, confidence: home ? 1 : 0 },
        ),
      ],
    },
  ];
}

function buildBookRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned } = input;
  const homeUrl = homepage(pagesScanned)?.url ?? null;
  const retailers = retailerCount(signals);
  const retailerPassed =
    pagesScanned.length === 0
      ? null
      : retailers >= 2
        ? true
        : retailers === 0
          ? false
          : null;
  const retailerReason =
    pagesScanned.length === 0
      ? "PAGE_NOT_CRAWLED"
      : retailers >= 2
        ? "MULTIPLE_RETAILERS_DETECTED"
        : retailers === 1
          ? "RETAILER_AVAILABILITY_UNCLEAR"
          : "RETAILER_OPTIONS_NOT_DETECTED";

  return [
    signalRule(
      input,
      "books.cover_visibility",
      signals.bookPromotion.bookCoverImages,
      "Book cover was not detected",
      FindingSeverity.HIGH,
      1,
    ),
    signalRule(
      input,
      "books.title_visibility",
      signals.bookPromotion.bookTitles,
      "Book title was not detected",
      FindingSeverity.HIGH,
      1,
    ),
    signalRule(
      input,
      "books.description",
      signals.bookPromotion.bookDescriptionOrBlurb,
      "Book description is missing or unclear",
      FindingSeverity.HIGH,
      2,
    ),
    signalRule(
      input,
      "books.purchase_links",
      signals.bookPromotion.buyLinks,
      "Buy links were not detected",
      FindingSeverity.HIGH,
      1,
    ),
    {
      checkId: "books.retailer_options",
      points: 2,
      passed: retailerPassed,
      title: "Purchase options do not match confirmed availability",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
      reasonCode: retailerReason,
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          `${retailers} retailer option(s) detected`,
          "at least two confirmed retailer options, or enough availability evidence to verify the offered options",
          retailerReason,
          { confidence: retailerPassed === null ? 0 : 1 },
        ),
      ],
    },
    signalRule(
      input,
      "books.reader_proof",
      signals.bookPromotion.reviewsOrPraise,
      "Reader proof was not detected",
      FindingSeverity.MEDIUM,
      5,
    ),
    signalRule(
      input,
      "books.featured_book",
      signals.bookPromotion.featuredBookSection,
      "Featured book section was not detected",
      FindingSeverity.LOW,
      6,
    ),
  ];
}

function buildNewsletterRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned } = input;
  const hasForm =
    has(signals.newsletter.newsletterSignupForm) ||
    has(signals.newsletter.subscribeForm) ||
    has(signals.newsletter.emailInput);
  const hasReaderBenefit =
    has(signals.newsletter.readerMagnetPhrases) ||
    has(signals.newsletter.freeChapter) ||
    has(signals.newsletter.bonusScene) ||
    has(signals.newsletter.freeBook) ||
    has(signals.newsletter.updatesSignup);

  return [
    signalRule(
      input,
      "engagement.newsletter_signup",
      {
        detected: hasForm,
        evidence: [
          ...signals.newsletter.newsletterSignupForm.evidence,
          ...signals.newsletter.subscribeForm.evidence,
          ...signals.newsletter.emailInput.evidence,
        ],
      },
      "Newsletter signup was not detected",
      FindingSeverity.HIGH,
      1,
    ),
    {
      checkId: "engagement.homepage_signup",
      points: 3,
      passed:
        pagesScanned.length > 0
          ? homepageNewsletterDetected(signals, pagesScanned)
          : null,
      title: "Newsletter is not visible on the homepage",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
      reasonCode:
        pagesScanned.length === 0
          ? "PAGE_NOT_CRAWLED"
          : homepageNewsletterDetected(signals, pagesScanned)
            ? "HOMEPAGE_SIGNUP_DETECTED"
            : "HOMEPAGE_SIGNUP_NOT_DETECTED",
      evidence: [
        pageEvidence(
          "html",
          homepage(pagesScanned)?.url,
          homepageNewsletterDetected(signals, pagesScanned)
            ? "Newsletter form evidence references the homepage"
            : "No newsletter form evidence references the homepage",
          "a newsletter signup visible on the homepage",
          pagesScanned.length === 0
            ? "PAGE_NOT_CRAWLED"
            : homepageNewsletterDetected(signals, pagesScanned)
              ? "HOMEPAGE_SIGNUP_DETECTED"
              : "HOMEPAGE_SIGNUP_NOT_DETECTED",
          { confidence: pagesScanned.length > 0 ? 1 : 0 },
        ),
      ],
    },
    signalRule(
      input,
      "engagement.reader_magnet",
      signals.newsletter.readerMagnetPhrases,
      "Reader magnet was not detected",
      FindingSeverity.MEDIUM,
      4,
    ),
    signalRule(
      input,
      "engagement.subscriber_benefit",
      {
        detected: hasReaderBenefit,
        evidence: [
          ...signals.newsletter.readerMagnetPhrases.evidence,
          ...signals.newsletter.freeChapter.evidence,
          ...signals.newsletter.bonusScene.evidence,
          ...signals.newsletter.freeBook.evidence,
          ...signals.newsletter.updatesSignup.evidence,
        ],
      },
      "Subscriber benefit is unclear",
      FindingSeverity.MEDIUM,
      4,
    ),
  ];
}

function buildSeoRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned } = input;
  const home = homepage(pagesScanned);
  const homeUrl = home?.url ?? null;
  const h1Count = home ? homepageH1Count(home) : null;
  const indexability = signals.seo.indexabilitySignals;
  const indexable =
    pagesScanned.length === 0
      ? null
      : indexability.indexable === false
        ? false
        : true;
  const robots = homepageRobots(home);
  const internalLinksPresent = home
    ? hasUsefulInternalLinks(pagesScanned)
    : null;

  return [
    signalRule(
      input,
      "search.title_tag",
      signals.seo.titleTagExists,
      "Title tag is missing",
      FindingSeverity.HIGH,
      2,
    ),
    {
      checkId: "search.author_title_format",
      points: 2,
      passed: home ? titleIncludesAuthorOrBrand(signals, pagesScanned) : null,
      title: "Title does not clearly support the author brand",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : titleIncludesAuthorOrBrand(signals, pagesScanned)
          ? "TITLE_SUPPORTS_AUTHOR_BRAND"
          : "TITLE_AUTHOR_BRAND_NOT_DETECTED",
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          home?.title ?? "Homepage title unavailable",
          "a title that identifies the author or writing brand",
          !home
            ? "PAGE_NOT_CRAWLED"
            : titleIncludesAuthorOrBrand(signals, pagesScanned)
              ? "TITLE_SUPPORTS_AUTHOR_BRAND"
              : "TITLE_AUTHOR_BRAND_NOT_DETECTED",
          { confidence: home ? 1 : 0 },
        ),
      ],
    },
    signalRule(
      input,
      "search.meta_description",
      signals.seo.metaDescriptionExists,
      "Meta description is missing",
      FindingSeverity.MEDIUM,
      4,
    ),
    {
      checkId: "search.single_h1",
      points: 2,
      passed: home ? h1Count !== null && h1Count > 0 : null,
      title: "Main heading structure needs cleanup",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : h1Count && h1Count > 0
          ? "PRIMARY_HEADING_PRESENT"
          : "PRIMARY_HEADING_MISSING",
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          h1Count === null
            ? "Heading structure unavailable"
            : `${h1Count} H1 element(s)`,
          "at least one clear primary heading",
          !home
            ? "PAGE_NOT_CRAWLED"
            : h1Count && h1Count > 0
              ? "PRIMARY_HEADING_PRESENT"
              : "PRIMARY_HEADING_MISSING",
          { threshold: 1, confidence: home ? 1 : 0 },
        ),
      ],
    },
    {
      checkId: "search.h1_clarity",
      points: 3,
      passed: home ? h1GivesAuthorClarity(signals, pagesScanned) : null,
      title: "H1 does not clearly orient readers",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : h1GivesAuthorClarity(signals, pagesScanned)
          ? "H1_GIVES_AUTHOR_CLARITY"
          : "H1_AUTHOR_CLARITY_NOT_DETECTED",
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          home?.h1 ?? "Homepage H1 unavailable",
          "a main heading that identifies the author, category, or book",
          !home
            ? "PAGE_NOT_CRAWLED"
            : h1GivesAuthorClarity(signals, pagesScanned)
              ? "H1_GIVES_AUTHOR_CLARITY"
              : "H1_AUTHOR_CLARITY_NOT_DETECTED",
          { confidence: home ? 1 : 0 },
        ),
      ],
    },
    {
      checkId: "search.indexability",
      points: 3,
      passed: indexable,
      title: "Indexability may be blocked",
      severity: FindingSeverity.CRITICAL,
      priority: 1,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : indexability.indexable === false
          ? "NOINDEX_DETECTED"
          : "NO_INDEXING_BLOCK_DETECTED",
      evidence: [
        pageEvidence(
          "robots",
          homeUrl,
          robots ||
            indexability.evidence.join("; ") ||
            "No noindex directive was detected",
          "no blocking noindex directive on the inspected page",
          !home
            ? "PAGE_NOT_CRAWLED"
            : indexability.indexable === false
              ? "NOINDEX_DETECTED"
              : "NO_INDEXING_BLOCK_DETECTED",
          { confidence: home ? 1 : 0 },
        ),
      ],
    },
    {
      checkId: "search.internal_links",
      points: 2,
      passed: internalLinksPresent,
      title: "Useful internal links are limited",
      severity: FindingSeverity.LOW,
      priority: 6,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : internalLinksPresent
          ? "USEFUL_INTERNAL_LINKS_DETECTED"
          : "USEFUL_INTERNAL_LINKS_NOT_DETECTED",
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          safeEvidenceText(
            home?.linksJson,
            "No useful internal links were detected",
          ),
          "useful internal links to author-site content",
          !home
            ? "PAGE_NOT_CRAWLED"
            : internalLinksPresent
              ? "USEFUL_INTERNAL_LINKS_DETECTED"
              : "USEFUL_INTERNAL_LINKS_NOT_DETECTED",
          { confidence: home ? 1 : 0 },
        ),
      ],
    },
  ];
}

function buildMobileRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned, technicalAudit, visualDesignAnalysis } = input;
  const home = homepage(pagesScanned);
  const homeUrl = home?.url ?? null;
  const performanceScore = technicalAudit?.mobilePerformance;
  const altTextPassed =
    pagesScanned.length > 0 ? !has(signals.seo.missingAltText) : null;
  const homepageStructurePassed = home
    ? successfulPage(home) && homepageH1Count(home) > 0
    : null;

  return [
    pageSpeedRule(
      "mobile.pagespeed_performance",
      performanceScore,
      90,
      homeUrl,
      "Mobile performance score is below target",
      FindingSeverity.HIGH,
      3,
      mobilePerformancePoints(performanceScore),
    ),
    pageSpeedRule(
      "mobile.pagespeed_accessibility",
      technicalAudit?.mobileAccessibility,
      90,
      homeUrl,
      "Mobile accessibility score is below target",
      FindingSeverity.MEDIUM,
      4,
    ),
    buildVisualCheckRule("mobile.text_contrast", visualDesignAnalysis, homeUrl),
    buildObservationRule(
      "mobile.interactive_controls",
      visualDesignAnalysis,
      ["mobile-tap-targets"],
      ["mobile"],
      homeUrl,
      "Mobile interactive controls are too small",
      FindingSeverity.MEDIUM,
      4,
    ),
    {
      checkId: "mobile.image_alt_text",
      points: 1,
      passed: altTextPassed,
      title: "Images are missing alt text",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
      reasonCode:
        pagesScanned.length === 0
          ? "PAGE_NOT_CRAWLED"
          : altTextPassed
            ? "APPROPRIATE_ALT_TEXT_BASELINE_MET"
            : "MISSING_ALT_TEXT_DETECTED",
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          signals.seo.missingAltText.evidence.join("; ") ||
            "No missing-alt finding was detected",
          "no content images with missing alternative text",
          pagesScanned.length === 0
            ? "PAGE_NOT_CRAWLED"
            : altTextPassed
              ? "APPROPRIATE_ALT_TEXT_BASELINE_MET"
              : "MISSING_ALT_TEXT_DETECTED",
          { confidence: pagesScanned.length > 0 ? 1 : 0 },
        ),
      ],
    },
    {
      checkId: "mobile.homepage_structure",
      points: 1,
      passed: homepageStructurePassed,
      title: "Homepage structure was not fully confirmed",
      severity: FindingSeverity.LOW,
      priority: 6,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : homepageStructurePassed
          ? "HOMEPAGE_LOADED_WITH_MAIN_HEADING"
          : "HOMEPAGE_OR_MAIN_HEADING_FAILED",
      evidence: [
        pageEvidence(
          "http_response",
          homeUrl,
          home
            ? `HTTP ${home.statusCode ?? "unknown"}; ${homepageH1Count(home)} H1 element(s)`
            : "Homepage was not crawled",
          "a successful homepage response with at least one main heading",
          !home
            ? "PAGE_NOT_CRAWLED"
            : homepageStructurePassed
              ? "HOMEPAGE_LOADED_WITH_MAIN_HEADING"
              : "HOMEPAGE_OR_MAIN_HEADING_FAILED",
          { confidence: home ? 1 : 0 },
        ),
      ],
    },
    buildVisualCheckRule("mobile.viewport_fit", visualDesignAnalysis, homeUrl),
  ];
}

function buildTechnicalRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned, technicalAudit } = input;
  const home = homepage(pagesScanned);
  const homeUrl = home?.url ?? null;
  const bestPracticeScores = [
    technicalAudit?.mobileBestPractices,
    technicalAudit?.desktopBestPractices,
  ];
  const hasBothBestPracticeScores = bestPracticeScores.every(
    (score) => typeof score === "number",
  );
  const bestPracticesPassed = hasBothBestPracticeScores
    ? bestPracticeScores.every((score) => (score as number) >= 90)
    : null;
  const criticalPages = pagesScanned.filter((page) =>
    ["HOME", "BOOKS", "ABOUT", "CONTACT", "NEWSLETTER"].includes(
      page.pageType ?? "",
    ),
  );
  const confirmedCriticalFailure = criticalPages.some(
    (page) => typeof page.statusCode === "number" && !successfulPage(page),
  );
  const indexable = signals.seo.indexabilitySignals.indexable;
  const canonical = homepageCanonical(home);
  const canonicalPassed = home
    ? validCanonicalUrl(canonical) &&
      canonicalMatchesHomepage(canonical, home.url)
    : null;
  const identityCandidates = structuredIdentityCandidates(home);
  const authorName = detectAuthorName(signals);
  const validIdentityCandidate = home
    ? (identityCandidates.find((candidate) =>
        structuredIdentityIsValid(candidate, home.url, authorName),
      ) ?? null)
    : null;

  return [
    pageSpeedRule(
      "technical.desktop_performance",
      technicalAudit?.desktopPerformance,
      70,
      homeUrl,
      "Desktop performance score is below target",
      FindingSeverity.MEDIUM,
      4,
    ),
    {
      checkId: "technical.browser_best_practices",
      points: 2,
      passed: bestPracticesPassed,
      title: "Browser best practices scores are below target",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
      reasonCode: !hasBothBestPracticeScores
        ? "PAGESPEED_RESULT_MISSING"
        : bestPracticesPassed
          ? "PAGESPEED_TARGET_MET"
          : "PAGESPEED_TARGET_NOT_MET",
      evidence: [
        pageEvidence(
          "pagespeed",
          homeUrl,
          `Mobile ${technicalAudit?.mobileBestPractices ?? "unavailable"}; desktop ${technicalAudit?.desktopBestPractices ?? "unavailable"}`,
          "both mobile and desktop scores at or above 90",
          !hasBothBestPracticeScores
            ? "PAGESPEED_RESULT_MISSING"
            : bestPracticesPassed
              ? "PAGESPEED_TARGET_MET"
              : "PAGESPEED_TARGET_NOT_MET",
          {
            threshold: 90,
            confidence: hasBothBestPracticeScores ? 1 : 0,
            metadata: {
              mobileScore: technicalAudit?.mobileBestPractices ?? null,
              desktopScore: technicalAudit?.desktopBestPractices ?? null,
            },
          },
        ),
      ],
    },
    pageSpeedRule(
      "technical.desktop_accessibility",
      technicalAudit?.desktopAccessibility,
      90,
      homeUrl,
      "Desktop accessibility score is below target",
      FindingSeverity.LOW,
      6,
    ),
    {
      checkId: "technical.https",
      points: 1,
      passed: home ? /^https:\/\//i.test(home.url) : null,
      title: "Secure HTTPS was not confirmed",
      severity: FindingSeverity.HIGH,
      priority: 2,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : /^https:\/\//i.test(home.url)
          ? "HTTPS_CONFIRMED"
          : "HTTPS_NOT_USED",
      evidence: [
        pageEvidence(
          "http_response",
          homeUrl,
          homeUrl ?? "Homepage was not crawled",
          "an HTTPS homepage URL",
          !home
            ? "PAGE_NOT_CRAWLED"
            : /^https:\/\//i.test(home.url)
              ? "HTTPS_CONFIRMED"
              : "HTTPS_NOT_USED",
          { confidence: home ? 1 : 0 },
        ),
      ],
    },
    {
      checkId: "technical.page_responses",
      points: 1,
      passed: criticalPages.length === 0 ? null : !confirmedCriticalFailure,
      title: "A critical scanned page did not load successfully",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
      reasonCode:
        criticalPages.length === 0
          ? "CRITICAL_PAGE_EVIDENCE_MISSING"
          : confirmedCriticalFailure
            ? "CRITICAL_PAGE_RESPONSE_FAILED"
            : "CRITICAL_PAGE_RESPONSES_PASSED",
      evidence: criticalPages.map((page) =>
        pageEvidence(
          "http_response",
          page.url,
          `HTTP ${page.statusCode ?? "unknown"}`,
          "HTTP 2xx or 3xx",
          successfulPage(page)
            ? "CRITICAL_PAGE_RESPONSE_PASSED"
            : "CRITICAL_PAGE_RESPONSE_FAILED",
          { confidence: typeof page.statusCode === "number" ? 1 : 0 },
        ),
      ),
    },
    {
      checkId: "technical.indexability",
      points: 1,
      passed: indexable,
      title: "Search engine access may be blocked",
      severity: FindingSeverity.HIGH,
      priority: 2,
      reasonCode:
        indexable === null
          ? "INDEXABILITY_EVIDENCE_MISSING"
          : indexable
            ? "SEARCH_ENGINE_ACCESS_AVAILABLE"
            : "SEARCH_ENGINE_ACCESS_BLOCKED",
      evidence: [
        pageEvidence(
          "robots",
          homeUrl,
          signals.seo.indexabilitySignals.evidence.join("; ") ||
            homepageRobots(home) ||
            "Indexability evidence was unavailable",
          "no blocking robots directive or crawler restriction",
          indexable === null
            ? "INDEXABILITY_EVIDENCE_MISSING"
            : indexable
              ? "SEARCH_ENGINE_ACCESS_AVAILABLE"
              : "SEARCH_ENGINE_ACCESS_BLOCKED",
          { confidence: indexable === null ? 0 : 1 },
        ),
      ],
    },
    {
      checkId: "technical.canonical_url",
      points: 1,
      passed: canonicalPassed,
      title: "Homepage canonical URL is missing or invalid",
      severity: FindingSeverity.LOW,
      priority: 6,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : canonicalPassed
          ? "CANONICAL_URL_VALID"
          : canonical
            ? "CANONICAL_URL_MISMATCH"
            : "CANONICAL_URL_MISSING",
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          canonical || "No canonical URL was detected",
          homeUrl ?? "a valid self-referencing homepage canonical URL",
          !home
            ? "PAGE_NOT_CRAWLED"
            : canonicalPassed
              ? "CANONICAL_URL_VALID"
              : canonical
                ? "CANONICAL_URL_MISMATCH"
                : "CANONICAL_URL_MISSING",
          { confidence: home ? 1 : 0 },
        ),
      ],
    },
    {
      checkId: "technical.structured_data",
      points: 1,
      passed: home ? Boolean(validIdentityCandidate) : null,
      title: "Valid author or site structured data was not detected",
      severity: FindingSeverity.LOW,
      priority: 6,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : validIdentityCandidate
          ? "STRUCTURED_IDENTITY_VALID"
          : "STRUCTURED_IDENTITY_MISSING_OR_INVALID",
      evidence: [
        pageEvidence(
          "structured_data",
          homeUrl,
          validIdentityCandidate
            ? `${validIdentityCandidate.type}: ${validIdentityCandidate.name}${validIdentityCandidate.url ? ` (${validIdentityCandidate.url})` : ""}`
            : `${identityCandidates.length} validly shaped Person or Organization candidate(s)`,
          "Person or Organization data with a valid name and consistent site identity",
          !home
            ? "PAGE_NOT_CRAWLED"
            : validIdentityCandidate
              ? "STRUCTURED_IDENTITY_VALID"
              : "STRUCTURED_IDENTITY_MISSING_OR_INVALID",
          {
            confidence: home ? 1 : 0,
            metadata: { candidates: identityCandidates },
          },
        ),
      ],
    },
  ];
}

function buildTrustRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned } = input;
  const homeUrl = homepage(pagesScanned)?.url ?? null;
  const hasContact =
    has(signals.trust.contactForm) || has(signals.trust.contactEmail);
  const contactEvidence = [
    ...signals.trust.contactForm.evidence,
    ...signals.trust.contactEmail.evidence,
  ];
  const mediaKitCoverage = pagesScanned.some((page) =>
    ["ABOUT", "CONTACT"].includes(page.pageType ?? ""),
  );
  const trustProof = authorLevelTrustProof(pagesScanned);

  return [
    signalRule(
      input,
      "trust.author_bio",
      signals.trust.authorBio,
      "Author bio was not detected",
      FindingSeverity.MEDIUM,
      3,
    ),
    signalRule(
      input,
      "trust.author_photo",
      signals.trust.authorPhoto,
      "Author photo was not detected",
      FindingSeverity.MEDIUM,
      4,
    ),
    {
      checkId: "trust.contact_path",
      points: 2,
      passed: pagesScanned.length === 0 ? null : hasContact,
      title: "Contact path was not detected",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
      reasonCode:
        pagesScanned.length === 0
          ? "PAGE_NOT_CRAWLED"
          : hasContact
            ? "CONTACT_PATH_DETECTED"
            : "CONTACT_PATH_NOT_DETECTED",
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          contactEvidence.join("; ") ||
            "No contact form or email link was detected",
          "a contact form or contact email path",
          pagesScanned.length === 0
            ? "PAGE_NOT_CRAWLED"
            : hasContact
              ? "CONTACT_PATH_DETECTED"
              : "CONTACT_PATH_NOT_DETECTED",
          { confidence: pagesScanned.length > 0 ? 1 : 0 },
        ),
      ],
    },
    signalRule(
      input,
      "trust.social_profiles",
      signals.trust.socialLinks,
      "Social profile links were not detected",
      FindingSeverity.LOW,
      6,
    ),
    {
      checkId: "trust.media_kit",
      points: 1,
      passed: has(signals.trust.mediaKit)
        ? true
        : mediaKitCoverage
          ? false
          : null,
      title: "Media kit was not detected",
      severity: FindingSeverity.LOW,
      priority: 7,
      reasonCode: has(signals.trust.mediaKit)
        ? "MEDIA_KIT_DETECTED"
        : mediaKitCoverage
          ? "MEDIA_KIT_NOT_DETECTED"
          : "MEDIA_KIT_PAGE_COVERAGE_INSUFFICIENT",
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          signals.trust.mediaKit.evidence.join("; ") ||
            "No media kit link was detected in the scanned About or Contact evidence",
          "a media kit or press kit path",
          has(signals.trust.mediaKit)
            ? "MEDIA_KIT_DETECTED"
            : mediaKitCoverage
              ? "MEDIA_KIT_NOT_DETECTED"
              : "MEDIA_KIT_PAGE_COVERAGE_INSUFFICIENT",
          {
            confidence: has(signals.trust.mediaKit) || mediaKitCoverage ? 1 : 0,
          },
        ),
      ],
    },
    signalRule(
      input,
      "trust.privacy_policy",
      signals.trust.privacyPolicy,
      "Privacy policy was not detected",
      FindingSeverity.MEDIUM,
      5,
    ),
    {
      checkId: "trust.reader_proof",
      points: 1,
      passed: pagesScanned.length === 0 ? null : Boolean(trustProof),
      title: "Trust proof was not detected",
      severity: FindingSeverity.LOW,
      priority: 6,
      reasonCode:
        pagesScanned.length === 0
          ? "PAGE_NOT_CRAWLED"
          : trustProof
            ? "AUTHOR_LEVEL_TRUST_PROOF_DETECTED"
            : "AUTHOR_LEVEL_TRUST_PROOF_NOT_DETECTED",
      evidence: [
        pageEvidence(
          "html",
          trustProof?.pageUrl ?? homeUrl,
          trustProof?.observation ??
            "No author-level credential, media, publisher, award, or professional endorsement signal was detected",
          "author-level credibility proof distinct from book reviews",
          pagesScanned.length === 0
            ? "PAGE_NOT_CRAWLED"
            : trustProof
              ? "AUTHOR_LEVEL_TRUST_PROOF_DETECTED"
              : "AUTHOR_LEVEL_TRUST_PROOF_NOT_DETECTED",
          { confidence: pagesScanned.length > 0 ? 1 : 0 },
        ),
      ],
    },
  ];
}

function buildUsabilityRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned, visualDesignAnalysis } = input;
  const home = homepage(pagesScanned);
  const homeUrl = home?.url ?? null;
  const homeLinks = extractedInternalLinks(home ? [home] : []);
  const homeCtas = extractedCtas(home ? [home] : []);
  const linkText = homeLinks
    .map((link) => `${link.text} ${link.href}`)
    .join(" ");
  const requiredPaths = {
    books: /\b(?:books?|novels?|stories|series)\b/i.test(linkText),
    about: /\b(?:about|bio|biography)\b/i.test(linkText),
    newsletter:
      /\b(?:newsletter|subscribe|mailing list|reader list)\b/i.test(linkText) ||
      homepageNewsletterDetected(signals, pagesScanned),
    contact: /\b(?:contact|connect)\b/i.test(linkText),
    purchase:
      homeCtas.some((cta) =>
        /\b(?:buy|order|purchase|shop|retailer)\b/i.test(
          `${cta.text} ${cta.href ?? ""}`,
        ),
      ) ||
      signals.bookPromotion.buyLinks.evidence.some((evidence) =>
        homeUrl ? evidence.includes(homeUrl) : false,
      ),
  };
  const allReaderPathsPresent = Object.values(requiredPaths).every(Boolean);
  const descriptiveCtasPassed =
    homeCtas.length > 0 &&
    homeCtas.every((cta) => Boolean(cta.text) && !genericCtaText(cta.text));

  return [
    buildVisualCheckRule(
      "usability.primary_navigation",
      visualDesignAnalysis,
      homeUrl,
    ),
    {
      checkId: "usability.priority_reader_paths",
      points: 1,
      passed: home ? allReaderPathsPresent : null,
      title: "Priority reader paths are difficult to reach",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : allReaderPathsPresent
          ? "PRIORITY_READER_PATHS_PRESENT"
          : "PRIORITY_READER_PATHS_MISSING",
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          Object.entries(requiredPaths)
            .map(
              ([path, present]) =>
                `${path}: ${present ? "reachable" : "not found"}`,
            )
            .join("; "),
          "Books, About, newsletter, Contact, and a featured purchase path reachable from the homepage",
          !home
            ? "PAGE_NOT_CRAWLED"
            : allReaderPathsPresent
              ? "PRIORITY_READER_PATHS_PRESENT"
              : "PRIORITY_READER_PATHS_MISSING",
          { confidence: home ? 1 : 0, metadata: { requiredPaths } },
        ),
      ],
    },
    {
      checkId: "usability.descriptive_calls_to_action",
      points: 1,
      passed: home ? descriptiveCtasPassed : null,
      title: "Calls to action are missing or use vague labels",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
      reasonCode: !home
        ? "PAGE_NOT_CRAWLED"
        : descriptiveCtasPassed
          ? "DESCRIPTIVE_CTA_LABELS_PRESENT"
          : "CTA_LABELS_MISSING_OR_VAGUE",
      evidence: [
        pageEvidence(
          "html",
          homeUrl,
          homeCtas.length > 0
            ? homeCtas.map((cta) => cta.text || "[unlabeled]").join("; ")
            : "No homepage calls to action were extracted",
          "homepage calls to action with clear, context-specific labels",
          !home
            ? "PAGE_NOT_CRAWLED"
            : descriptiveCtasPassed
              ? "DESCRIPTIVE_CTA_LABELS_PRESENT"
              : "CTA_LABELS_MISSING_OR_VAGUE",
          { confidence: home ? 1 : 0, metadata: { ctas: homeCtas } },
        ),
      ],
    },
    buildObservationRule(
      "usability.forms_and_controls",
      visualDesignAnalysis,
      ["form-length"],
      ["desktop", "tablet", "mobile"],
      homeUrl,
      "Forms or interactive controls may not be usable",
      FindingSeverity.MEDIUM,
      5,
    ),
    buildObservationRule(
      "usability.unblocked_content",
      visualDesignAnalysis,
      ["obstructive-overlay"],
      ["desktop", "tablet", "mobile"],
      homeUrl,
      "Important content is blocked or visually broken",
      FindingSeverity.HIGH,
      3,
    ),
  ];
}

function buildQuickWins(findings: ScoringFinding[]) {
  return [...findings]
    .filter((finding) => finding.severity !== FindingSeverity.CRITICAL)
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title))
    .slice(0, 5);
}

function buildPriorityRecommendations(findings: ScoringFinding[]) {
  const grouped = new Map<RootCauseKey, ScoringFinding[]>();

  for (const finding of findings) {
    const existing = grouped.get(finding.rootCauseKey) ?? [];
    existing.push(finding);
    grouped.set(finding.rootCauseKey, existing);
  }

  return [...grouped.values()]
    .map((group) => {
      const ordered = [...group].sort(
        (a, b) =>
          a.priority - b.priority || b.recoverablePoints - a.recoverablePoints,
      );
      const primary = ordered[0];
      const relatedCheckIds = ordered.flatMap((finding) =>
        finding.checkId ? [finding.checkId] : [],
      );

      return {
        ...primary,
        recoverablePoints: ordered.reduce(
          (total, finding) => total + finding.recoverablePoints,
          0,
        ),
        relatedCheckIds,
      };
    })
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        b.recoverablePoints - a.recoverablePoints ||
        a.title.localeCompare(b.title),
    );
}

function buildCoverage(checkResults: ScoringCheckResult[]): ScoringCoverage {
  const registeredWeight = SCORING_CHECK_REGISTRY.reduce(
    (total, check) => total + check.points,
    0,
  );
  const weightsByState = checkResults.reduce<Record<ScoringCheckState, number>>(
    (weights, check) => {
      weights[check.state] += check.availablePoints;
      return weights;
    },
    { passed: 0, needs_review: 0, failed: 0 },
  );
  const statusCounts = checkResults.reduce<Record<ScoringCheckState, number>>(
    (counts, check) => {
      counts[check.state] += 1;
      return counts;
    },
    { passed: 0, needs_review: 0, failed: 0 },
  );
  const verifiedWeight = weightsByState.passed + weightsByState.failed;
  const earnedWeight = checkResults.reduce(
    (total, check) => total + check.earnedPoints,
    0,
  );
  const coveragePercentage = clampScore(
    (verifiedWeight / registeredWeight) * 100,
  );
  const calculatedScore =
    verifiedWeight > 0
      ? clampScore((earnedWeight / verifiedWeight) * 100)
      : null;
  const level: ScoringCoverageLevel =
    coveragePercentage >= 85
      ? "normal"
      : coveragePercentage >= 60
        ? "provisional"
        : "insufficient";

  return {
    registeredWeight,
    passedWeight: weightsByState.passed,
    failedWeight: weightsByState.failed,
    needsReviewWeight: weightsByState.needs_review,
    verifiedWeight,
    earnedWeight,
    coveragePercentage,
    calculatedScore,
    level,
    statusCounts,
  };
}

function serviceFitLabel(
  categoryScores: CategoryScoreResult[],
  pagesScanned: ScoringPageInput[],
): ServiceFitLabel {
  const scoreFor = (category: ReportCategory) =>
    categoryScores.find((score) => score.category === category)
      ?.percentageScore ?? 0;
  const brand = scoreFor(ReportCategory.BRAND_CLARITY);
  const book = scoreFor(ReportCategory.BOOK_VISIBILITY);
  const newsletter = scoreFor(ReportCategory.READER_ENGAGEMENT);
  const seo = scoreFor(ReportCategory.SEARCH_VISIBILITY);
  const technical = Math.min(
    scoreFor(ReportCategory.TECHNICAL_HEALTH),
    scoreFor(ReportCategory.SITE_USABILITY),
  );
  const lowCategories = categoryScores.filter(
    (score) => score.percentageScore < 60,
  ).length;

  if (lowCategories >= 5) {
    return "New author website";
  }

  if (book < 60 && brand < 60) {
    return "Website redesign";
  }

  if (
    technical < 60 &&
    (siteLooksWordPress(pagesScanned) || oldCopyrightYear(pagesScanned))
  ) {
    return "Website management";
  }

  if (seo < 60 && brand >= 70) {
    return "SEO improvement";
  }

  if (newsletter < 60) {
    return "Newsletter setup";
  }

  return "Website optimization";
}

export function scoreAuthorWebsite(input: ScoringInput): ScoringResult {
  const defaultPageUrl = homepage(input.pagesScanned)?.url ?? null;
  const categoryResults = [
    scoreCategory(
      getConfig(ReportCategory.BRAND_CLARITY),
      buildBrandRules(input),
      defaultPageUrl,
    ),
    scoreCategory(
      getConfig(ReportCategory.BOOK_VISIBILITY),
      buildBookRules(input),
      defaultPageUrl,
    ),
    scoreCategory(
      getConfig(ReportCategory.READER_ENGAGEMENT),
      buildNewsletterRules(input),
      defaultPageUrl,
    ),
    scoreCategory(
      getConfig(ReportCategory.SEARCH_VISIBILITY),
      buildSeoRules(input),
      defaultPageUrl,
    ),
    scoreCategory(
      getConfig(ReportCategory.MOBILE_PERFORMANCE),
      buildMobileRules(input),
      defaultPageUrl,
    ),
    scoreCategory(
      getConfig(ReportCategory.TECHNICAL_HEALTH),
      buildTechnicalRules(input),
      defaultPageUrl,
    ),
    scoreCategory(
      getConfig(ReportCategory.AUTHOR_TRUST),
      buildTrustRules(input),
      defaultPageUrl,
    ),
    scoreCategory(
      getConfig(ReportCategory.SITE_USABILITY),
      buildUsabilityRules(input),
      defaultPageUrl,
    ),
  ];
  const categoryScores = categoryResults.map((result) => result.score);
  const findings = categoryResults
    .flatMap((result) => result.findings)
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
  const checkResults = categoryResults.flatMap((result) => result.checkResults);
  const coverage = buildCoverage(checkResults);
  const overallScore =
    coverage.level === "insufficient" ? null : coverage.calculatedScore;

  return {
    overallScore,
    coverage,
    categoryScores,
    findings,
    priorityRecommendations: buildPriorityRecommendations(findings),
    quickWins: buildQuickWins(findings),
    serviceFitLabel: serviceFitLabel(categoryScores, input.pagesScanned),
    checkResults,
  };
}
