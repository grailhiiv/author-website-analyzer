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
import { getPracticalActions } from "@/lib/scoring/recommendation-actions";

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
  practicalActions: string[];
  priority: number;
  checkId?: ScoringCheckId;
};

export type ScoringCheckState =
  | "pass"
  | "fail"
  | "unknown"
  | "not_applicable";

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
  finding: string;
  recommendation: string;
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
    return "Some useful pieces are present, but this area needs attention.";
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
  // ship without its deterministic recommendation actions.
  rules.forEach((rule) => {
    const check = getScoringCheck(rule.checkId);

    if (check.category !== config.category || check.points !== rule.points) {
      throw new Error(
        `Scoring rule ${rule.checkId} does not match its registered category or points.`,
      );
    }

    getPracticalActions(rule.recommendation);
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
    .map<ScoringFinding>((rule) => ({
      category: config.category,
      severity: rule.severity,
      title: rule.title,
      finding: rule.finding,
      recommendation: rule.recommendation,
      practicalActions: getPracticalActions(rule.recommendation),
      priority: rule.priority,
      checkId: rule.checkId,
    }));
  const checkResults = rules.map<ScoringCheckResult>((rule) => {
    const check = getScoringCheck(rule.checkId);
    const state: ScoringCheckState =
      rule.passed === true
        ? "pass"
        : rule.passed === false
          ? "fail"
          : "unknown";

    return {
      registryVersion: SCORING_CHECK_REGISTRY_VERSION,
      checkId: check.id,
      checkVersion: check.version,
      category: check.category,
      state,
      availablePoints: rule.points,
      earnedPoints:
        state === "pass" ? rule.points : state === "unknown" ? rule.points / 2 : 0,
      reasonCode:
        rule.reasonCode ??
        (state === "pass"
          ? "deterministic_evidence_passed"
          : state === "fail"
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
    matchingObservations?.map((observation) => [observation.viewport, observation]) ?? [],
  );
  const requiredObservations = check.requiredViewports.map((viewport) =>
    observationsByViewport.get(viewport),
  );
  const hasConfirmedFailure = requiredObservations.some(
    (observation) => observation?.status === "needs_review",
  );
  const hasMissingEvidence = requiredObservations.some(
    (observation) => !observation,
  );
  const hasInsufficientEvidence = requiredObservations.some(
    (observation) => observation?.status === "unknown",
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
    finding: check.finding,
    recommendation: check.recommendation,
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
      finding:
        "The scan did not find a clear author name in the page title, main heading, or structured data.",
      recommendation:
        "Place the author's name clearly in the homepage title and main heading.",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
      checkId: "brand.genre_positioning",
      points: 3,
      passed: has(signals.authorBrand.genreOrCategoryMentioned),
      title: "Writing category is unclear",
      finding:
        "The scan did not find clear genre, topic, or writing category language.",
      recommendation:
        "Add simple wording that tells readers what kind of books the author writes.",
      severity: FindingSeverity.MEDIUM,
      priority: 2,
    },
    {
      checkId: "brand.homepage_headline",
      points: 4,
      passed: has(signals.authorBrand.clearHomepageHeadline),
      title: "Homepage headline needs clarity",
      finding:
        "The homepage did not provide a clear headline that quickly orients readers.",
      recommendation:
        "Use one clear homepage headline that connects the author name, genre, or main reader promise.",
      severity: FindingSeverity.HIGH,
      priority: 2,
    },
    {
      checkId: "brand.about_path",
      points: 3,
      passed: has(signals.authorBrand.aboutSectionOrPage),
      title: "About path is hard to confirm",
      finding:
        "The scan did not find an about page, author bio path, or clear about section.",
      recommendation:
        "Add an About page or a visible homepage link to the author's bio.",
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
      finding:
        "The homepage scan found limited readable content to explain the author brand.",
      recommendation:
        "Add a short introduction that tells readers who the author is and what to do next.",
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
      finding: "The scan did not find an image that looked like a book cover.",
      recommendation:
        "Show the primary book cover clearly on the homepage or Books page.",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
      checkId: "books.title_visibility",
      points: 3,
      passed: has(signals.bookPromotion.bookTitles),
      title: "Book title was not detected",
      finding:
        "The scan did not find a clear book title in headings or book structured data.",
      recommendation:
        "Make each book title easy to find near the cover and description.",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
      checkId: "books.description",
      points: 4,
      passed: has(signals.bookPromotion.bookDescriptionOrBlurb),
      title: "Book description is missing or unclear",
      finding:
        "The scan did not find a book description, blurb, synopsis, or similar book copy.",
      recommendation:
        "Add a short book description that helps readers understand why the book is for them.",
      severity: FindingSeverity.HIGH,
      priority: 2,
    },
    {
      checkId: "books.purchase_links",
      points: 4,
      passed: has(signals.bookPromotion.buyLinks),
      title: "Buy links were not detected",
      finding:
        "The scan did not find clear buy, order, preorder, or purchase links.",
      recommendation:
        "Add visible buy links near each featured book and on the Books page.",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
      checkId: "books.retailer_options",
      points: 2,
      passed: multipleRetailers(signals),
      title: "Multiple retailer options were not detected",
      finding:
        "The scan did not find links to more than one common book retailer.",
      recommendation:
        "Offer the main retailer links your readers use, such as Amazon, Apple Books, Kobo, Barnes & Noble, or Bookshop.",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "books.reader_proof",
      points: 2,
      passed: has(signals.bookPromotion.reviewsOrPraise),
      title: "Reader proof was not detected",
      finding:
        "The scan did not find reviews, praise, endorsements, awards, or reader proof.",
      recommendation:
        "Add a short praise or reviews section to help new readers trust the book.",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      checkId: "books.featured_book",
      points: 1,
      passed: has(signals.bookPromotion.featuredBookSection),
      title: "Featured book section was not detected",
      finding:
        "The scan did not find a clear featured book, latest release, or available-now section.",
      recommendation:
        "Feature at least one current book prominently with its title, cover, description, and buying action.",
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
      finding:
        "The scan did not find a newsletter, subscribe form, or email signup field.",
      recommendation:
        "Add a simple newsletter signup so interested readers can stay connected.",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
      checkId: "engagement.homepage_signup",
      points: 3,
      passed: homepageNewsletterDetected(signals, pagesScanned),
      title: "Newsletter is not visible on the homepage",
      finding: "The scan did not find the newsletter signup on the homepage.",
      recommendation:
        "Place a newsletter signup or clear subscribe link on the homepage.",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
      checkId: "engagement.reader_magnet",
      points: 4,
      passed: has(signals.newsletter.readerMagnetPhrases),
      title: "Reader magnet was not detected",
      finding:
        "The scan did not find a reader magnet such as a free chapter, bonus scene, free book, or sample download.",
      recommendation:
        "Offer a simple reader magnet if it fits the author's goals and genre.",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "engagement.subscriber_benefit",
      points: 3,
      passed: hasReaderBenefit,
      title: "Subscriber benefit is unclear",
      finding:
        "The scan did not find clear wording that explains why readers should subscribe.",
      recommendation:
        "Tell readers what they will receive, such as book news, release updates, or a free sample.",
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
      finding:
        "The scan did not find a page title tag, which helps browsers and search engines understand the page.",
      recommendation:
        "Add a clear page title that includes the author name and writing category.",
      severity: FindingSeverity.HIGH,
      priority: 2,
    },
    {
      checkId: "search.author_title_format",
      points: 3,
      passed: titleIncludesAuthorOrBrand(signals, pagesScanned),
      title: "Title does not clearly support the author brand",
      finding:
        "The homepage title did not clearly include the author name, author role, books, or writing category.",
      recommendation:
        "Use a homepage title such as 'Author Name | Genre Author' or another clear author-brand format.",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
      checkId: "search.meta_description",
      points: 3,
      passed: has(signals.seo.metaDescriptionExists),
      title: "Meta description is missing",
      finding:
        "The scan did not find a meta description for the scanned pages.",
      recommendation:
        "Add a short meta description that summarizes the author, books, and reader action.",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "search.single_h1",
      points: 2,
      passed: oneH1,
      title: "Main heading structure needs cleanup",
      finding:
        "The scan either did not find an H1 or found multiple H1 headings on a page.",
      recommendation:
        "Use one clear H1 on each important page, especially the homepage.",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "search.h1_clarity",
      points: 3,
      passed: h1GivesAuthorClarity(signals, pagesScanned),
      title: "H1 does not clearly orient readers",
      finding:
        "The main heading did not clearly connect the page to the author, books, or genre.",
      recommendation:
        "Make the homepage H1 clear enough for a new reader to understand the site in a few seconds.",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "search.indexability",
      points: 3,
      passed: pageAppearsIndexable(signals),
      title: "Indexability may be blocked",
      finding:
        "The scan found a noindex or similar signal that may keep the page out of search results.",
      recommendation:
        "Review robots and indexing settings before relying on search visibility.",
      severity: FindingSeverity.CRITICAL,
      priority: 1,
    },
    {
      checkId: "search.internal_links",
      points: 2,
      passed: hasUsefulInternalLinks(pagesScanned),
      title: "Useful internal links are limited",
      finding:
        "The scan did not find enough internal links to key author website pages.",
      recommendation:
        "Link clearly to Books, About, Contact, Newsletter, and other important reader paths.",
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
      finding:
        "PageSpeed measured a mobile performance score below the target.",
      recommendation:
        "Review image sizes, scripts, hosting, and caching so mobile visitors get a faster experience.",
      severity: FindingSeverity.HIGH,
      priority: 3,
    },
    {
      checkId: "mobile.pagespeed_accessibility",
      points: 1,
      passed: scoreAtLeast(technicalAudit?.mobileAccessibility, 90),
      title: "Mobile accessibility score needs attention",
      finding:
        "PageSpeed measured a mobile accessibility score below the target.",
      recommendation:
        "Review mobile accessibility basics such as contrast, labels, alt text, and tap targets.",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    buildVisualCheckRule("mobile.text_contrast", visualDesignAnalysis),
    {
      checkId: "mobile.pagespeed_seo",
      points: 1,
      passed: scoreAtLeast(technicalAudit?.mobileSeo, 90),
      title: "Mobile search audit score needs attention",
      finding:
        "PageSpeed measured a mobile search audit score below the target.",
      recommendation:
        "Review the mobile Lighthouse search checks for crawlability and page metadata issues.",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      checkId: "mobile.image_alt_text",
      points: 1,
      passed: !has(signals.seo.missingAltText),
      title: "Images are missing alt text",
      finding: "The scan found images without alt text.",
      recommendation:
        "Add useful alt text to important images, especially book covers and author photos.",
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
      finding:
        "The scan could not confirm a successful homepage load with a clear main heading.",
      recommendation:
        "Make sure the homepage loads cleanly and presents a readable main heading.",
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
      finding:
        "PageSpeed measured a desktop performance score below the target.",
      recommendation:
        "Review image delivery, scripts, hosting, and caching so desktop pages load more quickly.",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "technical.mobile_best_practices",
      points: 2,
      passed: scoreAtLeast(technicalAudit?.mobileBestPractices, 90),
      title: "Mobile best practices score needs attention",
      finding:
        "PageSpeed measured a mobile best practices score below the target.",
      recommendation:
        "Review browser errors, security settings, and modern web best practices.",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      checkId: "technical.desktop_best_practices",
      points: 1,
      passed: scoreAtLeast(technicalAudit?.desktopBestPractices, 90),
      title: "Desktop best practices score needs attention",
      finding:
        "PageSpeed measured a desktop best practices score below the target.",
      recommendation:
        "Clean up technical issues reported by Lighthouse best practices.",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      checkId: "technical.desktop_accessibility",
      points: 1,
      passed: scoreAtLeast(technicalAudit?.desktopAccessibility, 90),
      title: "Desktop accessibility score needs attention",
      finding:
        "PageSpeed measured a desktop accessibility score below the target.",
      recommendation:
        "Fix accessibility issues that make the site harder to read or navigate.",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      checkId: "technical.https",
      points: 1,
      passed: /^https:\/\//i.test(home?.url ?? ""),
      title: "Secure HTTPS was not confirmed",
      finding: "The scanned homepage did not use a secure HTTPS address.",
      recommendation:
        "Serve the full website over HTTPS and redirect old HTTP addresses.",
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
      finding:
        "The crawl data did not confirm that all scanned pages returned successful responses.",
      recommendation:
        "Fix failed or redirected pages that readers may hit while browsing the site.",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      checkId: "technical.indexability",
      points: 1,
      passed: pageAppearsIndexable(signals),
      title: "Search engine access may be blocked",
      finding:
        "The scan found a noindex signal or could not confirm that the homepage is indexable.",
      recommendation:
        "Review robots settings and remove accidental noindex directives from public pages.",
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
      finding:
        "The scan did not find a canonical URL or basic author/site structured data.",
      recommendation:
        "Add canonical URLs and appropriate Person or Organization schema.",
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
      finding: "The scan did not find a clear author bio or biography page.",
      recommendation:
        "Add a concise author bio that helps readers, press, and event hosts understand the author.",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
      checkId: "trust.author_photo",
      points: 2,
      passed: has(signals.trust.authorPhoto),
      title: "Author photo was not detected",
      finding:
        "The scan did not find an author photo, portrait, or headshot signal.",
      recommendation:
        "Add a professional author photo with descriptive alt text.",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      checkId: "trust.contact_path",
      points: 2,
      passed: hasContact,
      title: "Contact path was not detected",
      finding: "The scan did not find a contact form or contact email.",
      recommendation:
        "Add a simple contact page or email path for readers, press, and opportunities.",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
      checkId: "trust.social_profiles",
      points: 1,
      passed: has(signals.trust.socialLinks),
      title: "Social profile links were not detected",
      finding: "The scan did not find links to author social profiles.",
      recommendation:
        "Link only to active author profiles that help build trust with readers.",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      checkId: "trust.media_kit",
      points: 1,
      passed: has(signals.trust.mediaKit),
      title: "Media kit was not detected",
      finding: "The scan did not find a media kit, press kit, or press page.",
      recommendation:
        "Add a media kit if the author wants interviews, speaking, events, or press opportunities.",
      severity: FindingSeverity.LOW,
      priority: 7,
    },
    {
      checkId: "trust.privacy_policy",
      points: 1,
      passed: has(signals.trust.privacyPolicy),
      title: "Privacy policy was not detected",
      finding: "The scan did not find a visible privacy policy link.",
      recommendation:
        "Add a privacy policy, especially if the site collects email subscribers or contact form messages.",
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
      finding:
        "The scan did not find reviews, praise, ratings, or similar trust proof.",
      recommendation:
        "Add a small section for praise, awards, reviews, or reader testimonials when available.",
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
      finding:
        "The crawl data shows at least one scanned page did not return a successful response.",
      recommendation:
        "Review broken pages, redirects, and unavailable content.",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      checkId: "usability.privacy_policy",
      points: 1,
      passed: has(signals.trust.privacyPolicy),
      title: "Privacy policy is missing from the scan",
      finding:
        "The scan did not find a privacy policy link, which is a maintenance and trust concern for forms and newsletter collection.",
      recommendation:
        "Add or update a privacy policy and link it from the footer.",
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
      finding:
        "The scan did not find a canonical URL or basic site/author structured data.",
      recommendation:
        "Add basic technical structure such as canonical URLs and appropriate Person or Organization schema.",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      checkId: "usability.freshness",
      points: 1,
      passed: !outdated,
      title: "Site content may be out of date",
      finding:
        "The scan found a footer copyright year that appears several years out of date.",
      recommendation:
        "Refresh the footer date and review the site for other stale content.",
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
