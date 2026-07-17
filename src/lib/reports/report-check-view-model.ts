import type { ReportCategory } from "@/generated/prisma/client";
import {
  reportCategoryDisplay,
  reportCategoryOrder,
} from "@/lib/reports/category-display";
import {
  SCORING_CHECK_REGISTRY,
  type ScoringCheckId,
} from "@/lib/scoring/check-registry";
import { getCheckStatusGuidance } from "@/lib/scoring/check-status-guidance";

export type ReportCheckState = "PASSED" | "NEEDS_REVIEW" | "FAILED";

export type ReportCheckLink = {
  href: string;
  label: string;
};

export type ReportCheckViewModel = {
  id: ScoringCheckId;
  title: string;
  category: ReportCategory;
  state: ReportCheckState;
  statusLabel: string;
  details: string;
  inspectedPageUrl: string | null;
  whyItMatters: string;
  recommendation: string;
  evidenceLinks: ReportCheckLink[];
  standardReferences: string[];
};

export type ReportAuditSectionViewModel = {
  category: ReportCategory;
  title: string;
  description: string;
  score: number | null;
  maxScore: number | null;
  checks: ReportCheckViewModel[];
  counts: Record<ReportCheckState, number>;
};

type StoredCheckResult = {
  checkId: string;
  state: ReportCheckState;
  reasonCode: string;
  evidenceReferences: unknown;
};

type StoredScore = {
  category: ReportCategory;
  score: number;
  maxScore: number;
};

const statusLabels: Record<ReportCheckState, string> = {
  PASSED: "Passed",
  NEEDS_REVIEW: "Needs Review",
  FAILED: "Failed",
};

const whyItMattersByCategory: Record<ReportCategory, string> = {
  BRAND_CLARITY:
    "Clear author positioning helps a new visitor understand who you are and what you write.",
  BOOK_VISIBILITY:
    "Readers need an obvious path from discovering a book to learning more or buying it.",
  READER_ENGAGEMENT:
    "Useful calls to action turn a one-time website visit into an ongoing reader relationship.",
  SEARCH_VISIBILITY:
    "Clear page structure and search metadata help readers and search engines understand the site.",
  MOBILE_PERFORMANCE:
    "A readable, responsive mobile experience helps readers browse without friction on smaller screens.",
  TECHNICAL_HEALTH:
    "Reliable technical foundations keep the website accessible, secure, and easier to discover.",
  AUTHOR_TRUST:
    "Credibility signals help readers, press, and event organizers feel confident about the author.",
  SITE_USABILITY:
    "Simple navigation and working paths help visitors reach books, author information, and next steps.",
};

function collectHttpUrls(value: unknown, urls: Set<string>) {
  if (typeof value === "string") {
    try {
      const url = new URL(value);

      if (url.protocol === "http:" || url.protocol === "https:") {
        urls.add(url.toString());
      }
    } catch {
      // Evidence frequently contains prose. Only complete, safe web URLs are links.
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectHttpUrls(entry, urls));
    return;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => collectHttpUrls(entry, urls));
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function storedText(value: unknown, key: "details" | "recommendation") {
  const text = asRecord(value)?.[key];

  return typeof text === "string" && text.trim().length > 0
    ? text.trim()
    : null;
}

function safeHttpUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function inspectedPageUrl(siteUrl: string, evidenceReferences: unknown) {
  const evidence = asRecord(evidenceReferences)?.evidence;

  if (Array.isArray(evidence)) {
    for (const entry of evidence) {
      const pageUrl = safeHttpUrl(asRecord(entry)?.pageUrl);

      if (pageUrl) {
        return pageUrl;
      }
    }
  }

  return safeHttpUrl(siteUrl);
}

function buildEvidenceLinks(siteUrl: string, evidenceReferences: unknown) {
  const urls = new Set<string>();
  let normalizedSiteUrl: string | null = null;

  collectHttpUrls(evidenceReferences, urls);

  try {
    normalizedSiteUrl = new URL(siteUrl).toString();
    urls.add(normalizedSiteUrl);
  } catch {
    // The normalized report URL should be valid, but an invalid value is not linked.
  }

  return [...urls].slice(0, 4).map<ReportCheckLink>((href) => ({
    href,
    label:
      href === normalizedSiteUrl
        ? "View analyzed website"
        : "View supporting evidence",
  }));
}

function formatStandardReference(reference: string) {
  return reference
    .split(".")
    .flatMap((part) => part.split("-"))
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" / ");
}

export function buildReportAuditSections({
  checkResults,
  scores,
  siteUrl,
}: {
  checkResults: readonly StoredCheckResult[];
  scores: readonly StoredScore[];
  siteUrl: string;
}): ReportAuditSectionViewModel[] {
  const resultsByCheck = new Map(
    checkResults.map((result) => [result.checkId, result]),
  );
  const scoresByCategory = new Map(
    scores.map((score) => [score.category, score]),
  );

  return reportCategoryOrder.map((category) => {
    const categoryChecks = SCORING_CHECK_REGISTRY.filter(
      (check) => check.category === category,
    ).map<ReportCheckViewModel>((check) => {
      const result = resultsByCheck.get(check.id);
      const state = result?.state ?? "NEEDS_REVIEW";
      const statusGuidance = getCheckStatusGuidance(
        check,
        state === "PASSED"
          ? "passed"
          : state === "FAILED"
            ? "failed"
            : "needs_review",
      );

      return {
        id: check.id,
        title: check.title,
        category,
        state,
        statusLabel: statusLabels[state],
        details:
          storedText(result?.evidenceReferences, "details") ??
          statusGuidance.details,
        inspectedPageUrl: inspectedPageUrl(siteUrl, result?.evidenceReferences),
        whyItMatters: whyItMattersByCategory[category],
        recommendation:
          storedText(result?.evidenceReferences, "recommendation") ??
          statusGuidance.recommendation,
        evidenceLinks: buildEvidenceLinks(siteUrl, result?.evidenceReferences),
        standardReferences: check.standardReferences.map(
          formatStandardReference,
        ),
      };
    });
    const score = scoresByCategory.get(category);

    return {
      category,
      title: reportCategoryDisplay[category].title,
      description: reportCategoryDisplay[category].description,
      score: score?.score ?? null,
      maxScore: score?.maxScore ?? null,
      checks: categoryChecks,
      counts: categoryChecks.reduce<Record<ReportCheckState, number>>(
        (counts, check) => {
          counts[check.state] += 1;
          return counts;
        },
        { PASSED: 0, NEEDS_REVIEW: 0, FAILED: 0 },
      ),
    };
  });
}
