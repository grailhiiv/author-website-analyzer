import {
  FindingSeverity,
  ReportCategory,
} from "@/generated/prisma/client";
import type {
  AuthorWebsiteSignals,
  ScannedPageSignalInput,
  SignalDetection,
} from "@/lib/signals/author-website-signals";

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
  authorType: string;
  websiteGoal?: string | null;
};

export type ScoringFinding = {
  category: ReportCategory;
  severity: FindingSeverity;
  title: string;
  finding: string;
  recommendation: string;
  priority: number;
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
  passed: boolean;
  title: string;
  finding: string;
  recommendation: string;
  severity: FindingSeverity;
  priority: number;
};

export type DeterministicScoringCategory = {
  category: ReportCategory;
  label: string;
  weight: number;
};

export const DETERMINISTIC_SCORING_CATEGORIES = [
  {
    category: ReportCategory.BRAND_CLARITY,
    label: "First Impression and Author Brand Clarity",
    weight: 15,
  },
  {
    category: ReportCategory.BOOK_PROMOTION,
    label: "Book Promotion and Sales Readiness",
    weight: 20,
  },
  {
    category: ReportCategory.READER_CONVERSION,
    label: "Reader Conversion and Newsletter Growth",
    weight: 15,
  },
  {
    category: ReportCategory.SEO_DISCOVERABILITY,
    label: "SEO Discoverability",
    weight: 15,
  },
  {
    category: ReportCategory.MOBILE_ACCESSIBILITY,
    label: "Mobile Experience and Accessibility",
    weight: 10,
  },
  {
    category: ReportCategory.PERFORMANCE_HEALTH,
    label: "Performance and Technical Health",
    weight: 10,
  },
  {
    category: ReportCategory.TRUST_CREDIBILITY,
    label: "Trust and Credibility",
    weight: 10,
  },
  {
    category: ReportCategory.MAINTENANCE_RISK,
    label: "Maintenance and Website Risk",
    weight: 5,
  },
] as const satisfies readonly DeterministicScoringCategory[];

export const DETERMINISTIC_SCORING_TOTAL =
  DETERMINISTIC_SCORING_CATEGORIES.reduce(
    (total, category) => total + category.weight,
    0
  );

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function has(signal: SignalDetection) {
  return signal.detected;
}

function getConfig(category: ReportCategory) {
  const config = DETERMINISTIC_SCORING_CATEGORIES.find(
    (item) => item.category === category
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
  rules: ScoreRule[]
): { score: CategoryScoreResult; findings: ScoringFinding[] } {
  const availablePoints = rules.reduce((sum, rule) => sum + rule.points, 0);
  const earnedPoints = rules.reduce(
    (sum, rule) => (rule.passed ? sum + rule.points : sum),
    0
  );
  const score =
    availablePoints > 0
      ? Math.max(
          0,
          Math.min(
            config.weight,
            Math.round((earnedPoints / availablePoints) * config.weight)
          )
        )
      : 0;
  const percentageScore =
    config.weight > 0 ? clampScore((score / config.weight) * 100) : 0;
  const findings = rules
    .filter((rule) => !rule.passed)
    .map<ScoringFinding>((rule) => ({
      category: config.category,
      severity: rule.severity,
      title: rule.title,
      finding: rule.finding,
      recommendation: rule.recommendation,
      priority: rule.priority,
    }));

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
  const match = evidence.match(/(?:Author name|Likely author name):\s*([^|]+)/i);

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

function hasScreenshot(pages: ScoringPageInput[]) {
  return pages.some(
    (page) =>
      typeof page.screenshotUrl === "string" && page.screenshotUrl.length > 0
  );
}

function hasUsefulInternalLinks(pages: ScoringPageInput[]) {
  if (pages.length > 1) {
    return true;
  }

  const home = homepage(pages);
  const linksText = textFromUnknown(home?.linksJson);

  return /href["']?\s*:\s*["']?\/|\/about|\/books?|\/contact|\/newsletter|\/blog/i.test(
    linksText
  );
}

function homepageNewsletterDetected(
  signals: AuthorWebsiteSignals,
  pages: ScoringPageInput[]
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
  return Object.values(signals.retailers).filter((retailer) => retailer.detected)
    .length >= 2;
}

function pageSpeedAvailable(audit?: TechnicalAuditScoreInput | null) {
  return Boolean(
    audit &&
      [
        audit.mobilePerformance,
        audit.desktopPerformance,
        audit.mobileAccessibility,
        audit.desktopAccessibility,
        audit.mobileSeo,
        audit.desktopSeo,
        audit.mobileBestPractices,
        audit.desktopBestPractices,
      ].some((score) => typeof score === "number")
  );
}

function scoreAtLeast(score: number | null | undefined, target: number) {
  return typeof score === "number" && score >= target;
}

function titleIncludesAuthorOrBrand(
  signals: AuthorWebsiteSignals,
  pages: ScoringPageInput[]
) {
  const title = homepage(pages)?.title ?? "";
  const authorName = detectAuthorName(signals);

  if (authorName && title.toLowerCase().includes(authorName.toLowerCase())) {
    return true;
  }

  return /\b(author|writer|novelist|poet|memoirist|books?|fiction|nonfiction|series)\b/i.test(
    title
  );
}

function h1GivesAuthorClarity(
  signals: AuthorWebsiteSignals,
  pages: ScoringPageInput[]
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
  return /\bwp-content\b|\bwp-includes\b|\bwordpress\b/i.test(allPageText(pages));
}

function oldCopyrightYear(pages: ScoringPageInput[]) {
  const currentYear = new Date().getFullYear();
  const years = [...allPageText(pages).matchAll(/copyright[^0-9]*(20[0-9]{2})/gi)]
    .map((match) => Number(match[1]))
    .filter((year) => Number.isInteger(year));

  return years.some((year) => currentYear - year >= 3);
}

function buildBrandRules(input: ScoringInput): ScoreRule[] {
  const { signals, pagesScanned } = input;
  const home = homepage(pagesScanned);

  return [
    {
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
      points: 1,
      passed: Boolean(home && successfulPage(home) && (home.wordCount ?? 0) >= 50),
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
  const { signals, authorType } = input;
  const rules: ScoreRule[] = [
    {
      points: 4,
      passed: has(signals.bookPromotion.bookCoverImages),
      title: "Book cover was not detected",
      finding:
        "The scan did not find an image that looked like a book cover.",
      recommendation:
        "Show the primary book cover clearly on the homepage or Books page.",
      severity: FindingSeverity.HIGH,
      priority: 1,
    },
    {
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
  ];

  if (/series/i.test(authorType)) {
    rules.push({
      points: 1,
      passed: has(signals.bookPromotion.seriesPage),
      title: "Series page was not detected",
      finding:
        "The author type is Series Author, but the scan did not find a clear series page or series signal.",
      recommendation:
        "Add a series page that explains reading order and links to each book.",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    });
  }

  return rules;
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
      points: 3,
      passed: homepageNewsletterDetected(signals, pagesScanned),
      title: "Newsletter is not visible on the homepage",
      finding:
        "The scan did not find the newsletter signup on the homepage.",
      recommendation:
        "Place a newsletter signup or clear subscribe link on the homepage.",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
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
  const oneH1 =
    has(signals.seo.h1Exists) && !has(signals.seo.multipleH1Issue);

  return [
    {
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
  const { signals, pagesScanned, technicalAudit } = input;
  const home = homepage(pagesScanned);

  return [
    {
      points: 3,
      passed: scoreAtLeast(technicalAudit?.mobileAccessibility, 90),
      title: "Mobile accessibility score needs attention",
      finding:
        "PageSpeed data did not confirm a strong mobile accessibility score.",
      recommendation:
        "Review mobile accessibility basics such as contrast, labels, alt text, and tap targets.",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      points: 2,
      passed: scoreAtLeast(technicalAudit?.desktopAccessibility, 90),
      title: "Desktop accessibility score needs attention",
      finding:
        "PageSpeed data did not confirm a strong desktop accessibility score.",
      recommendation:
        "Fix accessibility issues that make the site harder to read or navigate.",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      points: 3,
      passed: !has(signals.seo.missingAltText),
      title: "Images are missing alt text",
      finding:
        "The scan found images without alt text.",
      recommendation:
        "Add useful alt text to important images, especially book covers and author photos.",
      severity: FindingSeverity.MEDIUM,
      priority: 4,
    },
    {
      points: 1,
      passed: Boolean(home && successfulPage(home) && has(signals.seo.h1Exists)),
      title: "Homepage structure was not fully confirmed",
      finding:
        "The scan could not confirm a successful homepage load with a clear main heading.",
      recommendation:
        "Make sure the homepage loads cleanly and presents a readable main heading.",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      points: 1,
      passed: hasScreenshot(pagesScanned),
      title: "Mobile visual check is limited",
      finding:
        "The scan did not include a saved screenshot for visual review.",
      recommendation:
        "Capture screenshots during analysis so mobile layout issues can be reviewed more confidently.",
      severity: FindingSeverity.LOW,
      priority: 7,
    },
  ];
}

function buildPerformanceRules(input: ScoringInput): ScoreRule[] {
  const { pagesScanned, technicalAudit } = input;
  const home = homepage(pagesScanned);

  return [
    {
      points: 4,
      passed: scoreAtLeast(technicalAudit?.mobilePerformance, 90),
      title: "Mobile performance score is below target or unavailable",
      finding:
        "PageSpeed did not confirm strong mobile performance for the homepage.",
      recommendation:
        "Review image sizes, scripts, hosting, and caching so mobile visitors get a faster experience.",
      severity: FindingSeverity.HIGH,
      priority: 3,
    },
    {
      points: 2,
      passed: scoreAtLeast(technicalAudit?.desktopPerformance, 90),
      title: "Desktop performance score is below target or unavailable",
      finding:
        "PageSpeed did not confirm strong desktop performance for the homepage.",
      recommendation:
        "Improve the technical setup so the site loads reliably on desktop browsers.",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      points: 2,
      passed: scoreAtLeast(technicalAudit?.mobileBestPractices, 90),
      title: "Mobile best practices score needs attention",
      finding:
        "PageSpeed did not confirm a strong mobile best practices score.",
      recommendation:
        "Review browser console errors, security settings, and modern web best practices.",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
      points: 1,
      passed: scoreAtLeast(technicalAudit?.desktopBestPractices, 90),
      title: "Desktop best practices score needs attention",
      finding:
        "PageSpeed did not confirm a strong desktop best practices score.",
      recommendation:
        "Clean up technical issues reported by Lighthouse best practices.",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      points: 1,
      passed: Boolean(home && successfulPage(home) && !hasFailedPages(pagesScanned)),
      title: "Some scanned pages did not load cleanly",
      finding:
        "The crawl data did not confirm that all scanned pages returned successful responses.",
      recommendation:
        "Fix failed or redirected pages that readers may hit while browsing the site.",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
  ];
}

function buildTrustRules(input: ScoringInput): ScoreRule[] {
  const { signals } = input;
  const hasContact = has(signals.trust.contactForm) || has(signals.trust.contactEmail);

  return [
    {
      points: 2,
      passed: has(signals.trust.authorBio),
      title: "Author bio was not detected",
      finding:
        "The scan did not find a clear author bio or biography page.",
      recommendation:
        "Add a concise author bio that helps readers, press, and event hosts understand the author.",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
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
      points: 2,
      passed: hasContact,
      title: "Contact path was not detected",
      finding:
        "The scan did not find a contact form or contact email.",
      recommendation:
        "Add a simple contact page or email path for readers, press, and opportunities.",
      severity: FindingSeverity.MEDIUM,
      priority: 3,
    },
    {
      points: 1,
      passed: has(signals.trust.socialLinks),
      title: "Social profile links were not detected",
      finding:
        "The scan did not find links to author social profiles.",
      recommendation:
        "Link only to active author profiles that help build trust with readers.",
      severity: FindingSeverity.LOW,
      priority: 6,
    },
    {
      points: 1,
      passed: has(signals.trust.mediaKit),
      title: "Media kit was not detected",
      finding:
        "The scan did not find a media kit, press kit, or press page.",
      recommendation:
        "Add a media kit if the author wants interviews, speaking, events, or press opportunities.",
      severity: FindingSeverity.LOW,
      priority: 7,
    },
    {
      points: 1,
      passed: has(signals.trust.privacyPolicy),
      title: "Privacy policy was not detected",
      finding:
        "The scan did not find a visible privacy policy link.",
      recommendation:
        "Add a privacy policy, especially if the site collects email subscribers or contact form messages.",
      severity: FindingSeverity.MEDIUM,
      priority: 5,
    },
    {
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
  const { signals, pagesScanned, technicalAudit } = input;
  const hasTechnicalData = pageSpeedAvailable(technicalAudit);
  const outdated = oldCopyrightYear(pagesScanned);

  return [
    {
      points: 1,
      passed: pagesScanned.length >= 2,
      title: "Only limited crawl data is available",
      finding:
        "The analyzer did not scan multiple pages, so maintenance risk is harder to judge.",
      recommendation:
        "Make sure important pages are linked clearly from the homepage so they can be reviewed.",
      severity: FindingSeverity.LOW,
      priority: 7,
    },
    {
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
      points: 1,
      passed: hasTechnicalData && !outdated,
      title: "Maintenance confidence is limited",
      finding:
        "The scan did not confirm complete technical audit data, or it found content that appears several years out of date.",
      recommendation:
        "Review the site for outdated footer dates, stale content, and missing technical audit data.",
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
  pagesScanned: ScoringPageInput[]
): ServiceFitLabel {
  const scoreFor = (category: ReportCategory) =>
    categoryScores.find((score) => score.category === category)
      ?.percentageScore ?? 0;
  const brand = scoreFor(ReportCategory.BRAND_CLARITY);
  const book = scoreFor(ReportCategory.BOOK_PROMOTION);
  const newsletter = scoreFor(ReportCategory.READER_CONVERSION);
  const seo = scoreFor(ReportCategory.SEO_DISCOVERABILITY);
  const technical = Math.min(
    scoreFor(ReportCategory.PERFORMANCE_HEALTH),
    scoreFor(ReportCategory.MAINTENANCE_RISK)
  );
  const lowCategories = categoryScores.filter(
    (score) => score.percentageScore < 60
  ).length;

  if (lowCategories >= 5) {
    return "New author website";
  }

  if (book < 60 && brand < 60) {
    return "Website redesign";
  }

  if (technical < 60 && (siteLooksWordPress(pagesScanned) || oldCopyrightYear(pagesScanned))) {
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
    scoreCategory(getConfig(ReportCategory.BRAND_CLARITY), buildBrandRules(input)),
    scoreCategory(getConfig(ReportCategory.BOOK_PROMOTION), buildBookRules(input)),
    scoreCategory(
      getConfig(ReportCategory.READER_CONVERSION),
      buildNewsletterRules(input)
    ),
    scoreCategory(getConfig(ReportCategory.SEO_DISCOVERABILITY), buildSeoRules(input)),
    scoreCategory(
      getConfig(ReportCategory.MOBILE_ACCESSIBILITY),
      buildMobileRules(input)
    ),
    scoreCategory(
      getConfig(ReportCategory.PERFORMANCE_HEALTH),
      buildPerformanceRules(input)
    ),
    scoreCategory(getConfig(ReportCategory.TRUST_CREDIBILITY), buildTrustRules(input)),
    scoreCategory(
      getConfig(ReportCategory.MAINTENANCE_RISK),
      buildMaintenanceRules(input)
    ),
  ];
  const categoryScores = categoryResults.map((result) => result.score);
  const findings = categoryResults
    .flatMap((result) => result.findings)
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
  const overallScore = clampScore(
    categoryScores.reduce((sum, categoryScore) => sum + categoryScore.score, 0)
  );

  return {
    overallScore,
    categoryScores,
    findings,
    quickWins: buildQuickWins(findings),
    serviceFitLabel: serviceFitLabel(categoryScores, input.pagesScanned),
  };
}
