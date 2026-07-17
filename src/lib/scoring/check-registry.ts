import { FindingSeverity, ReportCategory } from "@/generated/prisma/client";
import type {
  VisualDesignObservation,
  VisualViewportVariant,
} from "@/lib/screenshots/visual-design";

export const SCORING_CHECK_REGISTRY_VERSION = 3;

export type ScoringCheckId =
  | "brand.author_name"
  | "brand.genre_positioning"
  | "brand.homepage_headline"
  | "brand.about_path"
  | "brand.homepage_content_depth"
  | "books.cover_visibility"
  | "books.title_visibility"
  | "books.description"
  | "books.purchase_links"
  | "books.retailer_options"
  | "books.reader_proof"
  | "books.featured_book"
  | "engagement.newsletter_signup"
  | "engagement.homepage_signup"
  | "engagement.reader_magnet"
  | "engagement.subscriber_benefit"
  | "search.title_tag"
  | "search.author_title_format"
  | "search.meta_description"
  | "search.single_h1"
  | "search.h1_clarity"
  | "search.indexability"
  | "search.internal_links"
  | "mobile.pagespeed_performance"
  | "mobile.pagespeed_accessibility"
  | "mobile.text_contrast"
  | "mobile.interactive_controls"
  | "mobile.image_alt_text"
  | "mobile.homepage_structure"
  | "mobile.viewport_fit"
  | "technical.desktop_performance"
  | "technical.browser_best_practices"
  | "technical.desktop_accessibility"
  | "technical.https"
  | "technical.page_responses"
  | "technical.indexability"
  | "technical.canonical_url"
  | "technical.structured_data"
  | "trust.author_bio"
  | "trust.author_photo"
  | "trust.contact_path"
  | "trust.social_profiles"
  | "trust.media_kit"
  | "trust.privacy_policy"
  | "trust.reader_proof"
  | "usability.primary_navigation"
  | "usability.priority_reader_paths"
  | "usability.descriptive_calls_to_action"
  | "usability.forms_and_controls"
  | "usability.unblocked_content";

export type RootCauseKey =
  | "AUTHOR_POSITIONING"
  | "FEATURED_BOOK_PRESENTATION"
  | "PURCHASE_PATH"
  | "NEWSLETTER_ACQUISITION"
  | "SEARCH_METADATA"
  | "HEADING_STRUCTURE"
  | "CRAWLER_ACCESS"
  | "MOBILE_LAYOUT"
  | "SITE_NAVIGATION"
  | "AUTHOR_CREDIBILITY"
  | "PRIVACY_AND_DATA_TRUST";

type ScoringCheckBase = {
  id: ScoringCheckId;
  version: number;
  title: string;
  category: ReportCategory;
  points: number;
  status: "active";
  applicablePageRoles: readonly ("SITE" | "HOME")[];
  applicabilityRuleId: string;
  evidencePolicyId: string;
  passRuleId: string;
  needsReviewRuleId: string;
  deduplicationGroupId: string;
  standardReferences: readonly string[];
  rootCauseKey: RootCauseKey;
};

export type SignalScoringCheckDefinition = ScoringCheckBase & {
  source: "signals" | "crawl" | "pagespeed" | "derived";
};

export type VisualScoringCheckDefinition = ScoringCheckBase & {
  source: "rendered";
  viewportPolicyId: string;
  requiredObservationId: VisualDesignObservation["id"];
  requiredViewports: readonly VisualViewportVariant[];
  findingTitle: string;
  severity: FindingSeverity;
  priority: number;
};

export type ScoringCheckDefinition =
  SignalScoringCheckDefinition | VisualScoringCheckDefinition;

type RegisteredCheckInput = Pick<
  SignalScoringCheckDefinition,
  "id" | "title" | "category" | "points" | "source" | "evidencePolicyId"
> &
  Partial<
    Pick<
      SignalScoringCheckDefinition,
      | "applicablePageRoles"
      | "applicabilityRuleId"
      | "passRuleId"
      | "needsReviewRuleId"
      | "standardReferences"
      | "rootCauseKey"
    >
  >;

function registeredCheck(
  input: RegisteredCheckInput,
): SignalScoringCheckDefinition {
  return {
    version: SCORING_CHECK_REGISTRY_VERSION,
    status: "active",
    applicablePageRoles: input.applicablePageRoles ?? ["SITE"],
    applicabilityRuleId: input.applicabilityRuleId ?? "eligible-author-site",
    passRuleId: input.passRuleId ?? "deterministic-evidence-passes",
    needsReviewRuleId:
      input.needsReviewRuleId ?? "required-evidence-needs-review",
    deduplicationGroupId: input.id,
    standardReferences: input.standardReferences ?? [],
    rootCauseKey: input.rootCauseKey ?? rootCauseFor(input.id),
    ...input,
  };
}

function rootCauseFor(id: ScoringCheckId): RootCauseKey {
  if (id.startsWith("brand.")) return "AUTHOR_POSITIONING";
  if (id.startsWith("books.purchase") || id === "books.retailer_options") {
    return "PURCHASE_PATH";
  }
  if (id.startsWith("books.")) return "FEATURED_BOOK_PRESENTATION";
  if (id.startsWith("engagement.")) return "NEWSLETTER_ACQUISITION";
  if (id === "search.single_h1" || id === "search.h1_clarity") {
    return "HEADING_STRUCTURE";
  }
  if (id.startsWith("search.")) return "SEARCH_METADATA";
  if (id.startsWith("mobile.")) return "MOBILE_LAYOUT";
  if (
    id === "technical.indexability" ||
    id === "technical.page_responses" ||
    id === "technical.https"
  ) {
    return "CRAWLER_ACCESS";
  }
  if (id.startsWith("technical.")) return "SEARCH_METADATA";
  if (id === "trust.privacy_policy") return "PRIVACY_AND_DATA_TRUST";
  if (id.startsWith("trust.")) return "AUTHOR_CREDIBILITY";
  return "SITE_NAVIGATION";
}

export const SCORING_CHECK_REGISTRY = [
  registeredCheck({
    id: "brand.author_name",
    title: "Author name is clear",
    category: ReportCategory.BRAND_CLARITY,
    points: 4,
    source: "signals",
    evidencePolicyId: "author-name-visible",
  }),
  registeredCheck({
    id: "brand.genre_positioning",
    title: "Writing category is clear",
    category: ReportCategory.BRAND_CLARITY,
    points: 3,
    source: "signals",
    evidencePolicyId: "genre-or-category-mentioned",
  }),
  registeredCheck({
    id: "brand.homepage_headline",
    title: "Homepage headline gives brand clarity",
    category: ReportCategory.BRAND_CLARITY,
    points: 4,
    source: "signals",
    evidencePolicyId: "clear-homepage-headline",
  }),
  registeredCheck({
    id: "brand.about_path",
    title: "About path is present",
    category: ReportCategory.BRAND_CLARITY,
    points: 3,
    source: "signals",
    evidencePolicyId: "about-section-or-page",
  }),
  registeredCheck({
    id: "brand.homepage_content_depth",
    title: "Homepage has useful introductory content",
    category: ReportCategory.BRAND_CLARITY,
    points: 1,
    source: "crawl",
    evidencePolicyId: "successful-homepage-minimum-word-count",
  }),

  registeredCheck({
    id: "books.cover_visibility",
    title: "Book cover is visible",
    category: ReportCategory.BOOK_VISIBILITY,
    points: 4,
    source: "signals",
    evidencePolicyId: "book-cover-images",
  }),
  registeredCheck({
    id: "books.title_visibility",
    title: "Book title is visible",
    category: ReportCategory.BOOK_VISIBILITY,
    points: 3,
    source: "signals",
    evidencePolicyId: "book-titles",
  }),
  registeredCheck({
    id: "books.description",
    title: "Book description is present",
    category: ReportCategory.BOOK_VISIBILITY,
    points: 4,
    source: "signals",
    evidencePolicyId: "book-description-or-blurb",
  }),
  registeredCheck({
    id: "books.purchase_links",
    title: "Book purchase links are present",
    category: ReportCategory.BOOK_VISIBILITY,
    points: 4,
    source: "signals",
    evidencePolicyId: "buy-links",
  }),
  registeredCheck({
    id: "books.retailer_options",
    title: "Purchase options match book availability",
    category: ReportCategory.BOOK_VISIBILITY,
    points: 2,
    source: "derived",
    evidencePolicyId: "at-least-two-retailer-signals",
  }),
  registeredCheck({
    id: "books.reader_proof",
    title: "Reader proof is present",
    category: ReportCategory.BOOK_VISIBILITY,
    points: 2,
    source: "signals",
    evidencePolicyId: "reviews-or-praise",
  }),
  registeredCheck({
    id: "books.featured_book",
    title: "Featured book section is present",
    category: ReportCategory.BOOK_VISIBILITY,
    points: 1,
    source: "signals",
    evidencePolicyId: "featured-book-section",
  }),

  registeredCheck({
    id: "engagement.newsletter_signup",
    title: "Newsletter signup is present",
    category: ReportCategory.READER_ENGAGEMENT,
    points: 5,
    source: "derived",
    evidencePolicyId: "newsletter-or-subscribe-or-email-input",
  }),
  registeredCheck({
    id: "engagement.homepage_signup",
    title: "Newsletter is visible on the homepage",
    category: ReportCategory.READER_ENGAGEMENT,
    points: 3,
    source: "derived",
    evidencePolicyId: "homepage-newsletter-evidence",
  }),
  registeredCheck({
    id: "engagement.reader_magnet",
    title: "Reader magnet is present",
    category: ReportCategory.READER_ENGAGEMENT,
    points: 4,
    source: "signals",
    evidencePolicyId: "reader-magnet-phrases",
  }),
  registeredCheck({
    id: "engagement.subscriber_benefit",
    title: "Subscriber benefit is clear",
    category: ReportCategory.READER_ENGAGEMENT,
    points: 3,
    source: "derived",
    evidencePolicyId: "reader-benefit-signals",
  }),

  registeredCheck({
    id: "search.title_tag",
    title: "Title tag is present",
    category: ReportCategory.SEARCH_VISIBILITY,
    points: 1,
    source: "signals",
    evidencePolicyId: "title-tag-exists",
  }),
  registeredCheck({
    id: "search.author_title_format",
    title: "Title supports the author brand",
    category: ReportCategory.SEARCH_VISIBILITY,
    points: 2,
    source: "derived",
    evidencePolicyId: "title-includes-author-or-brand",
  }),
  registeredCheck({
    id: "search.meta_description",
    title: "Meta description is present",
    category: ReportCategory.SEARCH_VISIBILITY,
    points: 2,
    source: "signals",
    evidencePolicyId: "meta-description-exists",
  }),
  registeredCheck({
    id: "search.single_h1",
    title: "Primary heading structure is clear",
    category: ReportCategory.SEARCH_VISIBILITY,
    points: 2,
    source: "derived",
    evidencePolicyId: "primary-heading-structure-is-clear",
  }),
  registeredCheck({
    id: "search.h1_clarity",
    title: "Main heading gives author clarity",
    category: ReportCategory.SEARCH_VISIBILITY,
    points: 3,
    source: "derived",
    evidencePolicyId: "h1-gives-author-clarity",
  }),
  registeredCheck({
    id: "search.indexability",
    title: "Page appears indexable",
    category: ReportCategory.SEARCH_VISIBILITY,
    points: 3,
    source: "derived",
    evidencePolicyId: "indexability-signals",
  }),
  registeredCheck({
    id: "search.internal_links",
    title: "Useful internal links are present",
    category: ReportCategory.SEARCH_VISIBILITY,
    points: 2,
    source: "crawl",
    evidencePolicyId: "useful-internal-links",
  }),

  registeredCheck({
    id: "mobile.pagespeed_performance",
    title: "Mobile performance meets target",
    category: ReportCategory.MOBILE_PERFORMANCE,
    points: 4,
    source: "pagespeed",
    evidencePolicyId: "mobile-performance-graduated-target-90",
  }),
  registeredCheck({
    id: "mobile.pagespeed_accessibility",
    title: "Mobile accessibility meets target",
    category: ReportCategory.MOBILE_PERFORMANCE,
    points: 1,
    source: "pagespeed",
    evidencePolicyId: "mobile-accessibility-at-least-90",
  }),
  {
    id: "mobile.text_contrast",
    version: SCORING_CHECK_REGISTRY_VERSION,
    title: "Mobile text meets baseline contrast",
    category: ReportCategory.MOBILE_PERFORMANCE,
    points: 1,
    status: "active",
    source: "rendered",
    applicablePageRoles: ["HOME"],
    applicabilityRuleId: "eligible-author-homepage",
    evidencePolicyId: "computed-text-contrast-v2",
    passRuleId: "measured-mobile-text-meets-wcag-baseline",
    needsReviewRuleId: "mobile-contrast-coverage-insufficient-or-missing",
    viewportPolicyId: "mobile-only",
    requiredObservationId: "text-contrast",
    requiredViewports: ["mobile"],
    deduplicationGroupId: "mobile.text_contrast",
    findingTitle: "Mobile text contrast is too low",
    severity: FindingSeverity.MEDIUM,
    priority: 4,
    standardReferences: ["visual-design.typography-colors", "wcag.contrast"],
    rootCauseKey: "MOBILE_LAYOUT",
  },
  registeredCheck({
    id: "mobile.interactive_controls",
    title: "Mobile interactive controls meet usability baseline",
    category: ReportCategory.MOBILE_PERFORMANCE,
    points: 1,
    source: "derived",
    evidencePolicyId: "mobile-tap-target-observation",
  }),
  registeredCheck({
    id: "mobile.image_alt_text",
    title: "Images include appropriate alt text",
    category: ReportCategory.MOBILE_PERFORMANCE,
    points: 1,
    source: "signals",
    evidencePolicyId: "no-missing-alt-text-signal",
  }),
  registeredCheck({
    id: "mobile.homepage_structure",
    title: "Homepage loads with a main heading",
    category: ReportCategory.MOBILE_PERFORMANCE,
    points: 1,
    source: "derived",
    evidencePolicyId: "successful-homepage-with-h1",
  }),
  {
    id: "mobile.viewport_fit",
    version: SCORING_CHECK_REGISTRY_VERSION,
    title: "Mobile page fits the viewport",
    category: ReportCategory.MOBILE_PERFORMANCE,
    points: 1,
    status: "active",
    source: "rendered",
    applicablePageRoles: ["HOME"],
    applicabilityRuleId: "eligible-author-homepage",
    evidencePolicyId: "rendered-horizontal-overflow-v2",
    passRuleId: "mobile-has-no-unclipped-document-overflow",
    needsReviewRuleId: "mobile-viewport-evidence-missing",
    viewportPolicyId: "mobile-only",
    requiredObservationId: "horizontal-overflow",
    requiredViewports: ["mobile"],
    deduplicationGroupId: "mobile.viewport_fit",
    findingTitle: "Mobile page overflows the viewport",
    severity: FindingSeverity.HIGH,
    priority: 3,
    standardReferences: ["visual-design.responsive-design"],
    rootCauseKey: "MOBILE_LAYOUT",
  },

  registeredCheck({
    id: "technical.desktop_performance",
    title: "Desktop performance meets target",
    category: ReportCategory.TECHNICAL_HEALTH,
    points: 2,
    source: "pagespeed",
    evidencePolicyId: "desktop-performance-at-least-70",
  }),
  registeredCheck({
    id: "technical.browser_best_practices",
    title: "Browser best practices meet target",
    category: ReportCategory.TECHNICAL_HEALTH,
    points: 2,
    source: "pagespeed",
    evidencePolicyId: "mobile-and-desktop-best-practices-at-least-90",
  }),
  registeredCheck({
    id: "technical.desktop_accessibility",
    title: "Desktop accessibility meets target",
    category: ReportCategory.TECHNICAL_HEALTH,
    points: 1,
    source: "pagespeed",
    evidencePolicyId: "desktop-accessibility-at-least-90",
  }),
  registeredCheck({
    id: "technical.https",
    title: "Homepage uses HTTPS",
    category: ReportCategory.TECHNICAL_HEALTH,
    points: 1,
    source: "crawl",
    evidencePolicyId: "homepage-url-uses-https",
  }),
  registeredCheck({
    id: "technical.page_responses",
    title: "Critical scanned pages load successfully",
    category: ReportCategory.TECHNICAL_HEALTH,
    points: 1,
    source: "crawl",
    evidencePolicyId: "homepage-and-scanned-page-responses",
  }),
  registeredCheck({
    id: "technical.indexability",
    title: "Search-engine access is available",
    category: ReportCategory.TECHNICAL_HEALTH,
    points: 1,
    source: "derived",
    evidencePolicyId: "indexability-signals",
  }),
  registeredCheck({
    id: "technical.canonical_url",
    title: "Canonical URL is valid",
    category: ReportCategory.TECHNICAL_HEALTH,
    points: 1,
    source: "derived",
    evidencePolicyId: "canonical-url-is-valid",
  }),
  registeredCheck({
    id: "technical.structured_data",
    title: "Author or site structured data is valid",
    category: ReportCategory.TECHNICAL_HEALTH,
    points: 1,
    source: "derived",
    evidencePolicyId: "person-or-organization-structured-data",
  }),

  registeredCheck({
    id: "trust.author_bio",
    title: "Author bio is present",
    category: ReportCategory.AUTHOR_TRUST,
    points: 2,
    source: "signals",
    evidencePolicyId: "author-bio",
  }),
  registeredCheck({
    id: "trust.author_photo",
    title: "Author photo is present",
    category: ReportCategory.AUTHOR_TRUST,
    points: 2,
    source: "signals",
    evidencePolicyId: "author-photo",
  }),
  registeredCheck({
    id: "trust.contact_path",
    title: "Contact path is present",
    category: ReportCategory.AUTHOR_TRUST,
    points: 2,
    source: "derived",
    evidencePolicyId: "contact-form-or-email",
  }),
  registeredCheck({
    id: "trust.social_profiles",
    title: "Social profile links are present",
    category: ReportCategory.AUTHOR_TRUST,
    points: 1,
    source: "signals",
    evidencePolicyId: "social-links",
  }),
  registeredCheck({
    id: "trust.media_kit",
    title: "Media kit is present",
    category: ReportCategory.AUTHOR_TRUST,
    points: 1,
    source: "signals",
    evidencePolicyId: "media-kit",
  }),
  registeredCheck({
    id: "trust.privacy_policy",
    title: "Privacy policy is present",
    category: ReportCategory.AUTHOR_TRUST,
    points: 1,
    source: "signals",
    evidencePolicyId: "privacy-policy",
  }),
  registeredCheck({
    id: "trust.reader_proof",
    title: "Trust proof is present",
    category: ReportCategory.AUTHOR_TRUST,
    points: 1,
    source: "derived",
    evidencePolicyId: "reviews-praise-review-schema-or-rating-schema",
  }),

  {
    id: "usability.primary_navigation",
    version: SCORING_CHECK_REGISTRY_VERSION,
    title: "Primary navigation works across viewports",
    category: ReportCategory.SITE_USABILITY,
    points: 1,
    status: "active",
    source: "rendered",
    applicablePageRoles: ["HOME"],
    applicabilityRuleId: "eligible-author-homepage",
    evidencePolicyId: "rendered-navigation-v2",
    passRuleId: "all-required-viewports-have-usable-navigation",
    needsReviewRuleId:
      "any-required-viewport-missing-without-confirmed-failure",
    viewportPolicyId: "desktop-tablet-mobile",
    requiredObservationId: "navigation-availability",
    requiredViewports: ["desktop", "tablet", "mobile"],
    deduplicationGroupId: "usability.primary_navigation",
    findingTitle: "Primary navigation is unavailable in a tested viewport",
    severity: FindingSeverity.HIGH,
    priority: 3,
    standardReferences: ["site-structure.navigation-flow"],
    rootCauseKey: "SITE_NAVIGATION",
  },
  registeredCheck({
    id: "usability.priority_reader_paths",
    title: "Priority reader paths are easy to reach",
    category: ReportCategory.SITE_USABILITY,
    points: 1,
    source: "derived",
    evidencePolicyId: "reader-paths-visible-and-linked",
  }),
  registeredCheck({
    id: "usability.descriptive_calls_to_action",
    title: "Calls to action are clear and descriptive",
    category: ReportCategory.SITE_USABILITY,
    points: 1,
    source: "crawl",
    evidencePolicyId: "descriptive-call-to-action-text",
  }),
  registeredCheck({
    id: "usability.forms_and_controls",
    title: "Forms and interactive controls are usable",
    category: ReportCategory.SITE_USABILITY,
    points: 1,
    source: "derived",
    evidencePolicyId: "rendered-forms-and-controls",
  }),
  registeredCheck({
    id: "usability.unblocked_content",
    title: "Content is not blocked or visually broken",
    category: ReportCategory.SITE_USABILITY,
    points: 1,
    source: "derived",
    evidencePolicyId: "rendered-content-is-unobstructed",
  }),
] as const satisfies readonly ScoringCheckDefinition[];

const expectedCategoryShape: Record<
  ReportCategory,
  { checkCount: number; points: number }
> = {
  BRAND_CLARITY: { checkCount: 5, points: 15 },
  BOOK_VISIBILITY: { checkCount: 7, points: 20 },
  READER_ENGAGEMENT: { checkCount: 4, points: 15 },
  SEARCH_VISIBILITY: { checkCount: 7, points: 15 },
  MOBILE_PERFORMANCE: { checkCount: 7, points: 10 },
  TECHNICAL_HEALTH: { checkCount: 8, points: 10 },
  AUTHOR_TRUST: { checkCount: 7, points: 10 },
  SITE_USABILITY: { checkCount: 5, points: 5 },
};

function validateScoringRegistry() {
  const ids = new Set<string>();

  for (const check of SCORING_CHECK_REGISTRY) {
    if (ids.has(check.id))
      throw new Error(`Duplicate scoring check: ${check.id}`);
    ids.add(check.id);
  }

  if (SCORING_CHECK_REGISTRY.length !== 50) {
    throw new Error("The scoring registry must contain exactly 50 checks.");
  }

  const totalPoints = SCORING_CHECK_REGISTRY.reduce(
    (total, check) => total + check.points,
    0,
  );
  if (totalPoints !== 100) {
    throw new Error(
      `The scoring registry must total 100 points, received ${totalPoints}.`,
    );
  }

  for (const [category, expected] of Object.entries(expectedCategoryShape)) {
    const checks = SCORING_CHECK_REGISTRY.filter(
      (check) => check.category === category,
    );
    const points = checks.reduce((total, check) => total + check.points, 0);
    if (checks.length !== expected.checkCount || points !== expected.points) {
      throw new Error(
        `${category} must contain ${expected.checkCount} checks totaling ${expected.points} points.`,
      );
    }
  }
}

validateScoringRegistry();

export function getScoringCheck(id: ScoringCheckId): ScoringCheckDefinition {
  const check = SCORING_CHECK_REGISTRY.find((entry) => entry.id === id);

  if (!check) {
    throw new Error(`Unknown scoring check: ${id}`);
  }

  return check;
}

export function isScoredVisualObservation(
  observation: Pick<VisualDesignObservation, "id" | "viewport">,
) {
  return SCORING_CHECK_REGISTRY.some(
    (check) =>
      check.source === "rendered" &&
      check.requiredObservationId === observation.id &&
      check.requiredViewports.includes(observation.viewport as never),
  );
}
