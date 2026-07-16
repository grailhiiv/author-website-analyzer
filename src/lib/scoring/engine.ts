import { FindingSeverity, ReportCategory } from "@/generated/prisma/client";
import type {
  AuthorWebsiteSignals,
  ScannedPageSignalInput,
  SignalDetection,
} from "@/lib/signals/author-website-signals";
import type { VisualDesignAnalysis } from "@/lib/screenshots/visual-design";
import {
  getScoringCheck,
  SCORING_CHECK_REGISTRY_VERSION,
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
};

export type ScoringCheckState = "passed" | "needs_review" | "failed";

export type ScoringCheckResult = {
  registryVersion: number;
  checkId: ScoringCheckId;
  checkVersion: number;
  category: ReportCategory;
  state: ScoringCheckState;
  availablePoints: number;
  earnedPoints: number;
  reasonCode: string;
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
  summary: string;
};

export type ScoringResult = {
  overallScore: number;
  categoryScores: CategoryScoreResult[];
  findings: ScoringFinding[];
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
};

export type DeterministicScoringCategory = {
  category: ReportCategory;
  label: string;
  weight: number;
};

export const DETERMINISTIC_SCORING_CATEGORIES = [
  {
    category: ReportCategory.BRAND_CLARITY,
    label: "Brand Clarity",
    weight: 15,
  },
  {
    category: ReportCategory.BOOK_VISIBILITY,
    label: "Book Visibility",
    weight: 20,
  },
  {
    category: ReportCategory.READER_ENGAGEMENT,
    label: "Reader Engagement",
    weight: 15,
  },
  {
    category: ReportCategory.SEARCH_VISIBILITY,
    label: "Search Visibility",
    weight: 15,
  },
  {
    category: ReportCategory.MOBILE_PERFORMANCE,
    label: "Mobile Performance",
    weight: 10,
  },
  {
    category: ReportCategory.TECHNICAL_HEALTH,
    label: "Technical Health",
    weight: 10,
  },
  {
    category: ReportCategory.AUTHOR_TRUST,
    label: "Author Trust",
    weight: 10,
  },
  {
    category: ReportCategory.SITE_USABILITY,
    label: "Site Usability",
    weight: 5,
  },
] as const satisfies readonly DeterministicScoringCategory[];

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

function scoreCategory(
  config: DeterministicScoringCategory,
  rules: ScoreRule[],
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
  const earnedPoints = rules.reduce(
    (sum, rule) =>
      rule.passed === true
        ? sum + rule.points
        : rule.passed === null
          ? sum + rule.points / 2
          : sum,
    0,
  );
  const score =
    availablePoints > 0
      ? Math.max(
          0,
          Math.min(
            config.weight,
            Math.round((earnedPoints / availablePoints) * config.weight),
          ),
        )
      : 0;
  const percentageScore =
    config.weight > 0 ? clampScore((score / config.weight) * 100) : 0;
  const findings = rules
    .filter((rule) => rule.passed === false)
    .map<ScoringFinding>((rule) => {
      const content = getCheckStatusContent(rule.checkId, "failed");

      return {
        category: config.category,
        severity: rule.severity,
        title: rule.title,
        finding: content.details,
        recommendation: content.recommendation,
        priority: rule.priority,
        checkId: rule.checkId,
      };
    });
  const checkResults = rules.map<ScoringCheckResult>((rule) => {
    const check = getScoringCheck(rule.checkId);
    const state: ScoringCheckState =
      rule.passed === true
        ? "passed"
        : rule.passed === false
          ? "failed"
          : "needs_review";

    return {
      registryVersion: SCORING_CHECK_REGISTRY_VERSION,
      checkId: check.id,
      checkVersion: check.version,
      category: check.category,
      state,
      availablePoints: rule.points,
      earnedPoints:
        state === "passed"
          ? rule.points
          : state === "needs_review"
            ? rule.points / 2
            : 0,
      reasonCode:
        rule.reasonCode ??
        (state === "passed"
          ? "deterministic_evidence_passed"
          : state === "failed"
            ? "deterministic_evidence_failed"
            : "required_evidence_missing"),
      evidenceReferences: rule.evidenceReferences ?? {},
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

function hasFailedPages(pages: ScoringPageInput[]) {
  return pages.some((page) => !successfulPage(page));
}

function buildVisualCheckRule(
  checkId: ScoringCheckId,
  analysis: VisualDesignAnalysis | null | undefined,
): ScoreRule {
  const check = getScoringCheck(checkId);
  if (check.source !== "rendered") {
    throw new Error(`Scoring check ${checkId} is not a rendered check.`);
  }
  const matchingObservations = analysis?.observations.filter(
    (observation) =>
      observation.id === check.requiredObservationId &&
      check.requiredViewports.includes(observation.viewport as never),
  );
  const observationsByViewport = new Map(
    matchingObservations?.map((observation) => [
      observation.viewport,
      observation,
    ]) ?? [],
  );
  const requiredObservations = check.requiredViewports.map((viewport) =>
    observationsByViewport.get(viewport),
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

  return {
    points: check.points,
    passed,
    title: check.findingTitle,
    severity: check.severity,
    priority: check.priority,
    checkId,
    reasonCode: hasConfirmedFailure
      ? "rendered_evidence_failed"
      : hasMissingEvidence
        ? "required_viewport_evidence_missing"
        : hasInsufficientEvidence
          ? "evidence_coverage_insufficient"
          : "rendered_evidence_passed",
    evidenceReferences: {
      analysisVersion: analysis?.version ?? null,
      observationId: check.requiredObservationId,
      requiredViewports: [...check.requiredViewports],
      observations: requiredObservations.filter(Boolean).map((observation) => ({
        viewport: observation?.viewport,
        status: observation?.status,
        evidence: observation?.evidence,
      })),
      errors: analysis?.errors ?? [],
    },
  };
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

function multipleRetailers(signals: AuthorWebsiteSignals) {
  return (
    Object.values(signals.retailers).filter((retailer) => retailer.detected)
      .length >= 2
  );
}

function scoreAtLeast(score: number | null | undefined, target: number) {
  return typeof score === "number" ? score >= target : null;
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

function pageAppearsIndexable(signals: AuthorWebsiteSignals) {
  return (
    !signals.seo.indexabilitySignals.detected ||
    signals.seo.indexabilitySignals.indexable !== false
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

  return [
    {
      checkId: "brand.author_name",
      points: 4,
      passed: has(signals.authorBrand.authorNameVisible),
      title: "Author name is not clear",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
      checkId: "brand.genre_positioning",
      points: 3,
      passed: has(signals.authorBrand.genreOrCategoryMentioned),
      title: "Writing category is unclear",
      severity: FindingSeverity.MEDIUM,
      priority: 2,
    },
    {
      checkId: "brand.homepage_headline",
      points: 4,
      passed: has(signals.authorBrand.clearHomepageHeadline),
      title: "Homepage headline needs clarity",
      severity: FindingSeverity.HIGH,
      priority: 2,
    },
    {
      checkId: "brand.about_path",
      points: 3,
      passed: has(signals.authorBrand.aboutSectionOrPage),
      title: "About path is hard to confirm",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "brand.homepage_content_depth",
      points: 1,
      passed: Boolean(
        home && successfulPage(home) && (home.wordCount ?? 0) >= 50,
      ),
      title: "Homepage content looks thin",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
  ];
}

function buildBookRules(input: ScoringInput): ScoreRule[] {
  const { signals } = input;

  return [
    {
      checkId: "books.cover_visibility",
      points: 4,
      passed: has(signals.bookPromotion.bookCoverImages),
      title: "Book cover was not detected",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
      checkId: "books.title_visibility",
      points: 3,
      passed: has(signals.bookPromotion.bookTitles),
      title: "Book title was not detected",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
      checkId: "books.description",
      points: 4,
      passed: has(signals.bookPromotion.bookDescriptionOrBlurb),
      title: "Book description is missing or unclear",
      severity: FindingSeverity.HIGH,
      priority: 2,
    },
    {
      checkId: "books.purchase_links",
      points: 4,
      passed: has(signals.bookPromotion.buyLinks),
      title: "Buy links were not detected",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
      checkId: "books.retailer_options",
      points: 2,
      passed: multipleRetailers(signals),
      title: "Multiple retailer options were not detected",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "books.reader_proof",
      points: 2,
      passed: has(signals.bookPromotion.reviewsOrPraise),
      title: "Reader proof was not detected",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      checkId: "books.featured_book",
      points: 1,
      passed: has(signals.bookPromotion.featuredBookSection),
      title: "Featured book section was not detected",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
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
    {
      checkId: "engagement.newsletter_signup",
      points: 5,
      passed: hasForm,
      title: "Newsletter signup was not detected",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
      checkId: "engagement.homepage_signup",
      points: 3,
      passed: homepageNewsletterDetected(signals, pagesScanned),
      title: "Newsletter is not visible on the homepage",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
      checkId: "engagement.reader_magnet",
      points: 4,
      passed: has(signals.newsletter.readerMagnetPhrases),
      title: "Reader magnet was not detected",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "engagement.subscriber_benefit",
      points: 3,
      passed: hasReaderBenefit,
      title: "Subscriber benefit is unclear",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
  ];
}

function buildSeoRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned } = input;
  const oneH1 = has(signals.seo.h1Exists) && !has(signals.seo.multipleH1Issue);

  return [
    {
      checkId: "search.title_tag",
      points: 2,
      passed: has(signals.seo.titleTagExists),
      title: "Title tag is missing",
      severity: FindingSeverity.HIGH,
      priority: 2,
    },
    {
      checkId: "search.author_title_format",
      points: 3,
      passed: titleIncludesAuthorOrBrand(signals, pagesScanned),
      title: "Title does not clearly support the author brand",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
      checkId: "search.meta_description",
      points: 3,
      passed: has(signals.seo.metaDescriptionExists),
      title: "Meta description is missing",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "search.single_h1",
      points: 2,
      passed: oneH1,
      title: "Main heading structure needs cleanup",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "search.h1_clarity",
      points: 3,
      passed: h1GivesAuthorClarity(signals, pagesScanned),
      title: "H1 does not clearly orient readers",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "search.indexability",
      points: 3,
      passed: pageAppearsIndexable(signals),
      title: "Indexability may be blocked",
      severity: FindingSeverity.CRITICAL,
      priority: 1,
    },
    {
      checkId: "search.internal_links",
      points: 2,
      passed: hasUsefulInternalLinks(pagesScanned),
      title: "Useful internal links are limited",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
  ];
}

function buildMobileRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned, technicalAudit, visualDesignAnalysis } = input;
  const home = homepage(pagesScanned);

  return [
    {
      checkId: "mobile.pagespeed_performance",
      points: 4,
      passed: scoreAtLeast(technicalAudit?.mobilePerformance, 70),
      title: "Mobile performance score is below target",
      severity: FindingSeverity.HIGH,
      priority: 3,
    },
    {
      checkId: "mobile.pagespeed_accessibility",
      points: 1,
      passed: scoreAtLeast(technicalAudit?.mobileAccessibility, 90),
      title: "Mobile accessibility score is below target",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    buildVisualCheckRule("mobile.text_contrast", visualDesignAnalysis),
    {
      checkId: "mobile.pagespeed_seo",
      points: 1,
      passed: scoreAtLeast(technicalAudit?.mobileSeo, 90),
      title: "Mobile search audit score is below target",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      checkId: "mobile.image_alt_text",
      points: 1,
      passed: !has(signals.seo.missingAltText),
      title: "Images are missing alt text",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "mobile.homepage_structure",
      points: 1,
      passed: Boolean(
        home && successfulPage(home) && has(signals.seo.h1Exists),
      ),
      title: "Homepage structure was not fully confirmed",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    buildVisualCheckRule("mobile.viewport_fit", visualDesignAnalysis),
  ];
}

function buildTechnicalRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned, technicalAudit } = input;
  const home = homepage(pagesScanned);

  return [
    {
      checkId: "technical.desktop_performance",
      points: 2,
      passed: scoreAtLeast(technicalAudit?.desktopPerformance, 70),
      title: "Desktop performance score is below target",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "technical.mobile_best_practices",
      points: 2,
      passed: scoreAtLeast(technicalAudit?.mobileBestPractices, 90),
      title: "Mobile best practices score is below target",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      checkId: "technical.desktop_best_practices",
      points: 1,
      passed: scoreAtLeast(technicalAudit?.desktopBestPractices, 90),
      title: "Desktop best practices score is below target",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      checkId: "technical.desktop_accessibility",
      points: 1,
      passed: scoreAtLeast(technicalAudit?.desktopAccessibility, 90),
      title: "Desktop accessibility score is below target",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      checkId: "technical.https",
      points: 1,
      passed: /^https:\/\//i.test(home?.url ?? ""),
      title: "Secure HTTPS was not confirmed",
      severity: FindingSeverity.HIGH,
      priority: 2,
    },
    {
      checkId: "technical.page_responses",
      points: 1,
      passed: Boolean(
        home && successfulPage(home) && !hasFailedPages(pagesScanned),
      ),
      title: "Some scanned pages did not load cleanly",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      checkId: "technical.indexability",
      points: 1,
      passed: pageAppearsIndexable(signals),
      title: "Search engine access may be blocked",
      severity: FindingSeverity.HIGH,
      priority: 2,
    },
    {
      checkId: "technical.canonical_or_schema",
      points: 1,
      passed:
        has(signals.seo.canonicalUrl) ||
        has(signals.schema.person) ||
        has(signals.schema.organization),
      title: "Technical structure signals are limited",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
  ];
}

function buildTrustRules(input: ScoringInput): ScoreRule[] {
  const { signals } = input;
  const hasContact =
    has(signals.trust.contactForm) || has(signals.trust.contactEmail);

  return [
    {
      checkId: "trust.author_bio",
      points: 2,
      passed: has(signals.trust.authorBio),
      title: "Author bio was not detected",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
      checkId: "trust.author_photo",
      points: 2,
      passed: has(signals.trust.authorPhoto),
      title: "Author photo was not detected",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "trust.contact_path",
      points: 2,
      passed: hasContact,
      title: "Contact path was not detected",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
      checkId: "trust.social_profiles",
      points: 1,
      passed: has(signals.trust.socialLinks),
      title: "Social profile links were not detected",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      checkId: "trust.media_kit",
      points: 1,
      passed: has(signals.trust.mediaKit),
      title: "Media kit was not detected",
      severity: FindingSeverity.LOW,
      priority: 7,
    },
    {
      checkId: "trust.privacy_policy",
      points: 1,
      passed: has(signals.trust.privacyPolicy),
      title: "Privacy policy was not detected",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      checkId: "trust.reader_proof",
      points: 1,
      passed:
        has(signals.bookPromotion.reviewsOrPraise) ||
        has(signals.schema.review) ||
        has(signals.schema.aggregateRating),
      title: "Trust proof was not detected",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
  ];
}

function buildMaintenanceRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned, visualDesignAnalysis } = input;
  const outdated = oldCopyrightYear(pagesScanned);

  return [
    buildVisualCheckRule("usability.primary_navigation", visualDesignAnalysis),
    {
      checkId: "usability.page_responses",
      points: 1,
      passed: !hasFailedPages(pagesScanned),
      title: "A scanned page returned an unsuccessful status",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      checkId: "usability.privacy_policy",
      points: 1,
      passed: has(signals.trust.privacyPolicy),
      title: "Privacy policy is missing from the scan",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      checkId: "usability.canonical_or_schema",
      points: 1,
      passed:
        has(signals.seo.canonicalUrl) ||
        has(signals.schema.person) ||
        has(signals.schema.organization),
      title: "Technical structure signals are limited",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      checkId: "usability.freshness",
      points: 1,
      passed: !outdated,
      title: "Site content may be out of date",
      severity: FindingSeverity.LOW,
      priority: 7,
    },
  ];
}

function buildQuickWins(findings: ScoringFinding[]) {
  return [...findings]
    .filter((finding) => finding.severity !== FindingSeverity.CRITICAL)
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title))
    .slice(0, 5);
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
  const categoryResults = [
    scoreCategory(
      getConfig(ReportCategory.BRAND_CLARITY),
      buildBrandRules(input),
    ),
    scoreCategory(
      getConfig(ReportCategory.BOOK_VISIBILITY),
      buildBookRules(input),
    ),
    scoreCategory(
      getConfig(ReportCategory.READER_ENGAGEMENT),
      buildNewsletterRules(input),
    ),
    scoreCategory(
      getConfig(ReportCategory.SEARCH_VISIBILITY),
      buildSeoRules(input),
    ),
    scoreCategory(
      getConfig(ReportCategory.MOBILE_PERFORMANCE),
      buildMobileRules(input),
    ),
    scoreCategory(
      getConfig(ReportCategory.TECHNICAL_HEALTH),
      buildTechnicalRules(input),
    ),
    scoreCategory(
      getConfig(ReportCategory.AUTHOR_TRUST),
      buildTrustRules(input),
    ),
    scoreCategory(
      getConfig(ReportCategory.SITE_USABILITY),
      buildMaintenanceRules(input),
    ),
  ];
  const categoryScores = categoryResults.map((result) => result.score);
  const findings = categoryResults
    .flatMap((result) => result.findings)
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
  const overallScore = clampScore(
    categoryScores.reduce((sum, categoryScore) => sum + categoryScore.score, 0),
  );
  const checkResults = categoryResults.flatMap((result) => result.checkResults);

  return {
    overallScore,
    categoryScores,
    findings,
    quickWins: buildQuickWins(findings),
    serviceFitLabel: serviceFitLabel(categoryScores, input.pagesScanned),
    checkResults,
  };
}
