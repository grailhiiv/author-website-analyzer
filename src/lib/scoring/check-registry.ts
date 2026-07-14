import { FindingSeverity, ReportCategory } from "@/generated/prisma/client";
import type {
  VisualDesignObservation,
  VisualViewportVariant,
} from "@/lib/screenshots/visual-design";

export const SCORING_CHECK_REGISTRY_VERSION = 1;

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
  | "mobile.pagespeed_seo"
  | "mobile.image_alt_text"
  | "mobile.homepage_structure"
  | "mobile.viewport_fit"
  | "technical.desktop_performance"
  | "technical.mobile_best_practices"
  | "technical.desktop_best_practices"
  | "technical.desktop_accessibility"
  | "technical.https"
  | "technical.page_responses"
  | "technical.indexability"
  | "technical.canonical_or_schema"
  | "trust.author_bio"
  | "trust.author_photo"
  | "trust.contact_path"
  | "trust.social_profiles"
  | "trust.media_kit"
  | "trust.privacy_policy"
  | "trust.reader_proof"
  | "usability.primary_navigation"
  | "usability.page_responses"
  | "usability.privacy_policy"
  | "usability.canonical_or_schema"
  | "usability.freshness";

type ScoringCheckBase = {
  id: ScoringCheckId;
  version: number;
  title: string;
  category: ReportCategory;
  points: number;
  status: "active";
  applicablePageRoles: readonly ("SITE" | "HOME")[];
  applicabilityRuleId: string;
  notApplicableRuleId: "never";
  evidencePolicyId: string;
  passRuleId: string;
  unknownRuleId: string;
  deduplicationGroupId: string;
  standardReferences: readonly string[];
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
  finding: string;
  recommendation: string;
  severity: FindingSeverity;
  priority: number;
};

export type ScoringCheckDefinition =
  | SignalScoringCheckDefinition
  | VisualScoringCheckDefinition;

type RegisteredCheckInput = Pick<
  SignalScoringCheckDefinition,
  "id" | "title" | "category" | "points" | "source" | "evidencePolicyId"
> &
  Partial<
    Pick<
      SignalScoringCheckDefinition,
      "applicablePageRoles" | "applicabilityRuleId" | "passRuleId" | "unknownRuleId" | "standardReferences"
    >
  >;

function registeredCheck(input: RegisteredCheckInput): SignalScoringCheckDefinition {
  return {
    version: 1,
    status: "active",
    applicablePageRoles: input.applicablePageRoles ?? ["SITE"],
    applicabilityRuleId: input.applicabilityRuleId ?? "eligible-author-site",
    notApplicableRuleId: "never",
    passRuleId: input.passRuleId ?? "deterministic-evidence-passes",
    unknownRuleId: input.unknownRuleId ?? "required-evidence-missing",
    deduplicationGroupId: input.id,
    standardReferences: input.standardReferences ?? [],
    ...input,
  };
}

export const SCORING_CHECK_REGISTRY = [
  registeredCheck({ id: "brand.author_name", title: "Author name is clear", category: ReportCategory.BRAND_CLARITY, points: 4, source: "signals", evidencePolicyId: "author-name-visible" }),
  registeredCheck({ id: "brand.genre_positioning", title: "Writing category is clear", category: ReportCategory.BRAND_CLARITY, points: 3, source: "signals", evidencePolicyId: "genre-or-category-mentioned" }),
  registeredCheck({ id: "brand.homepage_headline", title: "Homepage headline gives brand clarity", category: ReportCategory.BRAND_CLARITY, points: 4, source: "signals", evidencePolicyId: "clear-homepage-headline" }),
  registeredCheck({ id: "brand.about_path", title: "About path is present", category: ReportCategory.BRAND_CLARITY, points: 3, source: "signals", evidencePolicyId: "about-section-or-page" }),
  registeredCheck({ id: "brand.homepage_content_depth", title: "Homepage has useful introductory content", category: ReportCategory.BRAND_CLARITY, points: 1, source: "crawl", evidencePolicyId: "successful-homepage-minimum-word-count" }),

  registeredCheck({ id: "books.cover_visibility", title: "Book cover is visible", category: ReportCategory.BOOK_VISIBILITY, points: 4, source: "signals", evidencePolicyId: "book-cover-images" }),
  registeredCheck({ id: "books.title_visibility", title: "Book title is visible", category: ReportCategory.BOOK_VISIBILITY, points: 3, source: "signals", evidencePolicyId: "book-titles" }),
  registeredCheck({ id: "books.description", title: "Book description is present", category: ReportCategory.BOOK_VISIBILITY, points: 4, source: "signals", evidencePolicyId: "book-description-or-blurb" }),
  registeredCheck({ id: "books.purchase_links", title: "Book purchase links are present", category: ReportCategory.BOOK_VISIBILITY, points: 4, source: "signals", evidencePolicyId: "buy-links" }),
  registeredCheck({ id: "books.retailer_options", title: "Multiple retailer options are present", category: ReportCategory.BOOK_VISIBILITY, points: 2, source: "derived", evidencePolicyId: "at-least-two-retailer-signals" }),
  registeredCheck({ id: "books.reader_proof", title: "Reader proof is present", category: ReportCategory.BOOK_VISIBILITY, points: 2, source: "signals", evidencePolicyId: "reviews-or-praise" }),
  registeredCheck({ id: "books.featured_book", title: "Featured book section is present", category: ReportCategory.BOOK_VISIBILITY, points: 1, source: "signals", evidencePolicyId: "featured-book-section" }),

  registeredCheck({ id: "engagement.newsletter_signup", title: "Newsletter signup is present", category: ReportCategory.READER_ENGAGEMENT, points: 5, source: "derived", evidencePolicyId: "newsletter-or-subscribe-or-email-input" }),
  registeredCheck({ id: "engagement.homepage_signup", title: "Newsletter is visible on the homepage", category: ReportCategory.READER_ENGAGEMENT, points: 3, source: "derived", evidencePolicyId: "homepage-newsletter-evidence" }),
  registeredCheck({ id: "engagement.reader_magnet", title: "Reader magnet is present", category: ReportCategory.READER_ENGAGEMENT, points: 4, source: "signals", evidencePolicyId: "reader-magnet-phrases" }),
  registeredCheck({ id: "engagement.subscriber_benefit", title: "Subscriber benefit is clear", category: ReportCategory.READER_ENGAGEMENT, points: 3, source: "derived", evidencePolicyId: "reader-benefit-signals" }),

  registeredCheck({ id: "search.title_tag", title: "Title tag is present", category: ReportCategory.SEARCH_VISIBILITY, points: 2, source: "signals", evidencePolicyId: "title-tag-exists" }),
  registeredCheck({ id: "search.author_title_format", title: "Title supports the author brand", category: ReportCategory.SEARCH_VISIBILITY, points: 3, source: "derived", evidencePolicyId: "title-includes-author-or-brand" }),
  registeredCheck({ id: "search.meta_description", title: "Meta description is present", category: ReportCategory.SEARCH_VISIBILITY, points: 3, source: "signals", evidencePolicyId: "meta-description-exists" }),
  registeredCheck({ id: "search.single_h1", title: "Page has one main heading", category: ReportCategory.SEARCH_VISIBILITY, points: 2, source: "derived", evidencePolicyId: "h1-exists-without-multiple-h1-issue" }),
  registeredCheck({ id: "search.h1_clarity", title: "Main heading gives author clarity", category: ReportCategory.SEARCH_VISIBILITY, points: 3, source: "derived", evidencePolicyId: "h1-gives-author-clarity" }),
  registeredCheck({ id: "search.indexability", title: "Page appears indexable", category: ReportCategory.SEARCH_VISIBILITY, points: 3, source: "derived", evidencePolicyId: "indexability-signals" }),
  registeredCheck({ id: "search.internal_links", title: "Useful internal links are present", category: ReportCategory.SEARCH_VISIBILITY, points: 2, source: "crawl", evidencePolicyId: "useful-internal-links" }),

  registeredCheck({ id: "mobile.pagespeed_performance", title: "Mobile performance meets target", category: ReportCategory.MOBILE_PERFORMANCE, points: 4, source: "pagespeed", evidencePolicyId: "mobile-performance-at-least-70" }),
  registeredCheck({ id: "mobile.pagespeed_accessibility", title: "Mobile accessibility meets target", category: ReportCategory.MOBILE_PERFORMANCE, points: 1, source: "pagespeed", evidencePolicyId: "mobile-accessibility-at-least-90" }),
  {
    id: "mobile.text_contrast",
    version: 1,
    title: "Mobile text meets baseline contrast",
    category: ReportCategory.MOBILE_PERFORMANCE,
    points: 1,
    status: "active",
    source: "rendered",
    applicablePageRoles: ["HOME"],
    applicabilityRuleId: "eligible-author-homepage",
    notApplicableRuleId: "never",
    evidencePolicyId: "computed-text-contrast-v2",
    passRuleId: "measured-mobile-text-meets-wcag-baseline",
    unknownRuleId: "mobile-contrast-coverage-insufficient-or-missing",
    viewportPolicyId: "mobile-only",
    requiredObservationId: "text-contrast",
    requiredViewports: ["mobile"],
    deduplicationGroupId: "mobile.text_contrast",
    findingTitle: "Mobile text contrast is too low",
    finding: "The rendered mobile homepage contains measured text that falls below the baseline contrast threshold.",
    recommendation: "Increase mobile text contrast so important author and book content remains readable.",
    severity: FindingSeverity.MEDIUM,
    priority: 4,
    standardReferences: ["visual-design.typography-colors", "wcag.contrast"],
  },
  registeredCheck({ id: "mobile.pagespeed_seo", title: "Mobile search audit meets target", category: ReportCategory.MOBILE_PERFORMANCE, points: 1, source: "pagespeed", evidencePolicyId: "mobile-seo-at-least-90" }),
  registeredCheck({ id: "mobile.image_alt_text", title: "Images include alt text", category: ReportCategory.MOBILE_PERFORMANCE, points: 1, source: "signals", evidencePolicyId: "no-missing-alt-text-signal" }),
  registeredCheck({ id: "mobile.homepage_structure", title: "Homepage loads with a main heading", category: ReportCategory.MOBILE_PERFORMANCE, points: 1, source: "derived", evidencePolicyId: "successful-homepage-with-h1" }),
  {
    id: "mobile.viewport_fit",
    version: 1,
    title: "Mobile page fits the viewport",
    category: ReportCategory.MOBILE_PERFORMANCE,
    points: 1,
    status: "active",
    source: "rendered",
    applicablePageRoles: ["HOME"],
    applicabilityRuleId: "eligible-author-homepage",
    notApplicableRuleId: "never",
    evidencePolicyId: "rendered-horizontal-overflow-v2",
    passRuleId: "mobile-has-no-unclipped-document-overflow",
    unknownRuleId: "mobile-viewport-evidence-missing",
    viewportPolicyId: "mobile-only",
    requiredObservationId: "horizontal-overflow",
    requiredViewports: ["mobile"],
    deduplicationGroupId: "mobile.viewport_fit",
    findingTitle: "Mobile page overflows the viewport",
    finding: "The rendered mobile homepage contains page-level horizontal overflow that can cause sideways scrolling or clipped content.",
    recommendation: "Remove mobile horizontal overflow so readers can use the page without sideways scrolling or clipped content.",
    severity: FindingSeverity.HIGH,
    priority: 3,
    standardReferences: ["visual-design.responsive-design"],
  },

  registeredCheck({ id: "technical.desktop_performance", title: "Desktop performance meets target", category: ReportCategory.TECHNICAL_HEALTH, points: 2, source: "pagespeed", evidencePolicyId: "desktop-performance-at-least-70" }),
  registeredCheck({ id: "technical.mobile_best_practices", title: "Mobile best practices meet target", category: ReportCategory.TECHNICAL_HEALTH, points: 2, source: "pagespeed", evidencePolicyId: "mobile-best-practices-at-least-90" }),
  registeredCheck({ id: "technical.desktop_best_practices", title: "Desktop best practices meet target", category: ReportCategory.TECHNICAL_HEALTH, points: 1, source: "pagespeed", evidencePolicyId: "desktop-best-practices-at-least-90" }),
  registeredCheck({ id: "technical.desktop_accessibility", title: "Desktop accessibility meets target", category: ReportCategory.TECHNICAL_HEALTH, points: 1, source: "pagespeed", evidencePolicyId: "desktop-accessibility-at-least-90" }),
  registeredCheck({ id: "technical.https", title: "Homepage uses HTTPS", category: ReportCategory.TECHNICAL_HEALTH, points: 1, source: "crawl", evidencePolicyId: "homepage-url-uses-https" }),
  registeredCheck({ id: "technical.page_responses", title: "Scanned pages load successfully", category: ReportCategory.TECHNICAL_HEALTH, points: 1, source: "crawl", evidencePolicyId: "homepage-and-scanned-page-responses" }),
  registeredCheck({ id: "technical.indexability", title: "Search engine access is available", category: ReportCategory.TECHNICAL_HEALTH, points: 1, source: "derived", evidencePolicyId: "indexability-signals" }),
  registeredCheck({ id: "technical.canonical_or_schema", title: "Canonical or structured data is present", category: ReportCategory.TECHNICAL_HEALTH, points: 1, source: "derived", evidencePolicyId: "canonical-person-or-organization" }),

  registeredCheck({ id: "trust.author_bio", title: "Author bio is present", category: ReportCategory.AUTHOR_TRUST, points: 2, source: "signals", evidencePolicyId: "author-bio" }),
  registeredCheck({ id: "trust.author_photo", title: "Author photo is present", category: ReportCategory.AUTHOR_TRUST, points: 2, source: "signals", evidencePolicyId: "author-photo" }),
  registeredCheck({ id: "trust.contact_path", title: "Contact path is present", category: ReportCategory.AUTHOR_TRUST, points: 2, source: "derived", evidencePolicyId: "contact-form-or-email" }),
  registeredCheck({ id: "trust.social_profiles", title: "Social profile links are present", category: ReportCategory.AUTHOR_TRUST, points: 1, source: "signals", evidencePolicyId: "social-links" }),
  registeredCheck({ id: "trust.media_kit", title: "Media kit is present", category: ReportCategory.AUTHOR_TRUST, points: 1, source: "signals", evidencePolicyId: "media-kit" }),
  registeredCheck({ id: "trust.privacy_policy", title: "Privacy policy is present", category: ReportCategory.AUTHOR_TRUST, points: 1, source: "signals", evidencePolicyId: "privacy-policy" }),
  registeredCheck({ id: "trust.reader_proof", title: "Trust proof is present", category: ReportCategory.AUTHOR_TRUST, points: 1, source: "derived", evidencePolicyId: "reviews-praise-review-schema-or-rating-schema" }),

  {
    id: "usability.primary_navigation",
    version: 1,
    title: "Primary navigation works across viewports",
    category: ReportCategory.SITE_USABILITY,
    points: 1,
    status: "active",
    source: "rendered",
    applicablePageRoles: ["HOME"],
    applicabilityRuleId: "eligible-author-homepage",
    notApplicableRuleId: "never",
    evidencePolicyId: "rendered-navigation-v2",
    passRuleId: "all-required-viewports-have-usable-navigation",
    unknownRuleId: "any-required-viewport-missing-without-confirmed-failure",
    viewportPolicyId: "desktop-tablet-mobile",
    requiredObservationId: "navigation-availability",
    requiredViewports: ["desktop", "tablet", "mobile"],
    deduplicationGroupId: "usability.primary_navigation",
    findingTitle: "Primary navigation is unavailable in a tested viewport",
    finding: "The rendered homepage did not provide usable primary navigation in every tested viewport.",
    recommendation: "Make the primary menu easy to find and give readers direct paths to Books, About, newsletter signup, and contact information.",
    severity: FindingSeverity.HIGH,
    priority: 3,
    standardReferences: ["site-structure.navigation-flow"],
  },
  registeredCheck({ id: "usability.page_responses", title: "Scanned pages load successfully", category: ReportCategory.SITE_USABILITY, points: 1, source: "crawl", evidencePolicyId: "no-failed-scanned-pages" }),
  registeredCheck({ id: "usability.privacy_policy", title: "Privacy policy is present", category: ReportCategory.SITE_USABILITY, points: 1, source: "signals", evidencePolicyId: "privacy-policy" }),
  registeredCheck({ id: "usability.canonical_or_schema", title: "Canonical or structured data is present", category: ReportCategory.SITE_USABILITY, points: 1, source: "derived", evidencePolicyId: "canonical-person-or-organization" }),
  registeredCheck({ id: "usability.freshness", title: "Site content appears current", category: ReportCategory.SITE_USABILITY, points: 1, source: "crawl", evidencePolicyId: "copyright-year-not-stale" }),
] as const satisfies readonly ScoringCheckDefinition[];

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
