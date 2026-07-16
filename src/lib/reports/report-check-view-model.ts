import type { ReportCategory } from "@/generated/prisma/client";
import {
  reportCategoryDisplay,
  reportCategoryOrder,
} from "@/lib/reports/category-display";
import { parsePracticalActions } from "@/lib/reports/practical-actions";
import {
  SCORING_CHECK_REGISTRY,
  type ScoringCheckId,
} from "@/lib/scoring/check-registry";
import {
  getPassedCheckGuidance,
  getUnknownCheckGuidance,
} from "@/lib/scoring/check-status-guidance";

export type ReportCheckState = "PASS" | "FAIL" | "UNKNOWN" | "NOT_APPLICABLE";

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
  whyItMatters: string;
  recommendation: string;
  practicalActions: string[];
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

type StoredFinding = {
  checkId: string | null;
  finding: string;
  recommendation: string;
  practicalActions: unknown;
};

type StoredScore = {
  category: ReportCategory;
  score: number;
  maxScore: number;
};

const statusLabels: Record<ReportCheckState, string> = {
  PASS: "Passed",
  FAIL: "Needs attention",
  UNKNOWN: "Couldn't verify",
  NOT_APPLICABLE: "Not applicable",
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

function stateDetails(
  state: ReportCheckState,
  reasonCode: string,
  finding?: StoredFinding,
) {
  if (state === "FAIL") {
    return (
      finding?.finding ??
      "The deterministic scan found that this check did not meet the current website standard."
    );
  }

  if (state === "PASS") {
    return "The scan found enough reliable evidence for this check to meet the current website standard.";
  }

  if (state === "NOT_APPLICABLE") {
    return "This check did not apply to the pages or website features available in this scan.";
  }

  if (reasonCode === "required_viewport_evidence_missing") {
    return "The scan could not capture every required screen size, so this result could not be confirmed reliably.";
  }

  if (reasonCode === "evidence_coverage_insufficient") {
    return "The page loaded, but the scan did not collect enough reliable evidence to confirm this check.";
  }

  if (reasonCode === "stored_result_missing") {
    return "This check was not recorded in the saved scan. Run a new analysis to collect a current result.";
  }

  return "The scan did not collect enough reliable evidence to confirm whether this check passed or needs attention.";
}

function stateRecommendation(state: ReportCheckState, finding?: StoredFinding) {
  if (state === "FAIL") {
    return (
      finding?.recommendation ??
      "Review this item on the analyzed website and update it before running another scan."
    );
  }

  if (state === "PASS") {
    return "Keep this element in place and recheck it after major website or theme changes.";
  }

  if (state === "UNKNOWN") {
    return "Review this item manually, or run a new scan after confirming the page is public and fully accessible.";
  }

  return "No action is required for this report.";
}

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
  findings,
  scores,
  siteUrl,
}: {
  checkResults: readonly StoredCheckResult[];
  findings: readonly StoredFinding[];
  scores: readonly StoredScore[];
  siteUrl: string;
}): ReportAuditSectionViewModel[] {
  const resultsByCheck = new Map(
    checkResults.map((result) => [result.checkId, result]),
  );
  const findingsByCheck = new Map(
    findings
      .filter((finding): finding is StoredFinding & { checkId: string } =>
        Boolean(finding.checkId),
      )
      .map((finding) => [finding.checkId, finding]),
  );
  const scoresByCategory = new Map(
    scores.map((score) => [score.category, score]),
  );

  return reportCategoryOrder.map((category) => {
    const categoryChecks = SCORING_CHECK_REGISTRY.filter(
      (check) => check.category === category,
    ).map<ReportCheckViewModel>((check) => {
      const result = resultsByCheck.get(check.id);
      const state = result?.state ?? "UNKNOWN";
      const finding = findingsByCheck.get(check.id);
      const reasonCode = result?.reasonCode ?? "stored_result_missing";
      const statusGuidance =
        state === "PASS"
          ? getPassedCheckGuidance(check)
          : state === "UNKNOWN"
            ? getUnknownCheckGuidance(check, reasonCode)
            : null;

      return {
        id: check.id,
        title: check.title,
        category,
        state,
        statusLabel: statusLabels[state],
        details:
          statusGuidance?.details ?? stateDetails(state, reasonCode, finding),
        whyItMatters: whyItMattersByCategory[category],
        recommendation:
          statusGuidance?.recommendation ?? stateRecommendation(state, finding),
        practicalActions: statusGuidance
          ? statusGuidance.practicalActions
          : state === "FAIL" && finding
            ? parsePracticalActions(finding.practicalActions)
            : [],
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
        { PASS: 0, FAIL: 0, UNKNOWN: 0, NOT_APPLICABLE: 0 },
      ),
    };
  });
}
