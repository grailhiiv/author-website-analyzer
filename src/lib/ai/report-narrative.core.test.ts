import assert from "node:assert/strict";
import test from "node:test";

import {
  FindingSeverity,
  ReportCategory,
} from "@/generated/prisma/client";
import {
  buildFallbackReportNarrative,
  extractOpenAIResponseText,
  generateReportNarrative,
  parseReportNarrativeJson,
  parseSerializedReportNarrative,
  serializeReportNarrative,
} from "@/lib/ai/report-narrative.core";
import type { CategoryScoreResult, ScoringFinding } from "@/lib/scoring/engine";
import type { AuthorWebsiteSignals } from "@/lib/signals/author-website-signals";

function signal(detected: boolean, evidence: string[] = []) {
  return {
    detected,
    evidence,
  };
}

const mockSignals: AuthorWebsiteSignals = {
  pagesAnalyzed: 1,
  authorBrand: {
    authorNameVisible: signal(true, ["Author name: Jane Writer"]),
    genreOrCategoryMentioned: signal(true, ["Genre/category wording: fantasy"]),
    clearHomepageHeadline: signal(true, ["Homepage headline: Jane Writer"]),
    aboutSectionOrPage: signal(false),
  },
  bookPromotion: {
    bookCoverImages: signal(false),
    bookTitles: signal(true, ["Book heading: The Moonlit Door"]),
    bookDescriptionOrBlurb: signal(false),
    buyLinks: signal(false),
    retailerLinks: signal(false),
    featuredBookSection: signal(false),
    seriesPage: signal(false),
    reviewsOrPraise: signal(false),
  },
  newsletter: {
    newsletterSignupForm: signal(false),
    subscribeForm: signal(false),
    emailInput: signal(false),
    readerMagnetPhrases: signal(false),
    freeChapter: signal(false),
    bonusScene: signal(false),
    freeBook: signal(false),
    updatesSignup: signal(false),
  },
  seo: {
    titleTagExists: signal(true, ["Title tag: Jane Writer"]),
    metaDescriptionExists: signal(false),
    h1Exists: signal(true, ["H1: Jane Writer"]),
    multipleH1Issue: signal(false),
    missingAltText: signal(false),
    indexabilitySignals: {
      detected: true,
      indexable: true,
      evidence: ["Page returned HTTP 200"],
    },
    canonicalUrl: signal(false),
  },
  trust: {
    authorBio: signal(false),
    authorPhoto: signal(false),
    contactForm: signal(false),
    contactEmail: signal(false),
    socialLinks: signal(false),
    mediaKit: signal(false),
    privacyPolicy: signal(false),
  },
  retailers: {
    amazon: signal(false),
    kindle: signal(false),
    kobo: signal(false),
    appleBooks: signal(false),
    barnesAndNoble: signal(false),
    bookshop: signal(false),
    googlePlayBooks: signal(false),
    goodreads: signal(false),
    publisherWebsites: signal(false),
  },
  schema: {
    person: signal(false),
    book: signal(false),
    organization: signal(false),
    review: signal(false),
    aggregateRating: signal(false),
    sameAs: signal(false),
  },
};

const categoryScores: CategoryScoreResult[] = [
  {
    category: ReportCategory.BRAND_CLARITY,
    label: "Brand Clarity",
    weight: 15,
    score: 11,
    maxScore: 15,
    percentageScore: 73,
    earnedPoints: 11,
    availablePoints: 15,
    summary: "The author brand is partly clear from the homepage.",
  },
  {
    category: ReportCategory.READER_ENGAGEMENT,
    label: "Reader Engagement",
    weight: 15,
    score: 3,
    maxScore: 15,
    percentageScore: 20,
    earnedPoints: 3,
    availablePoints: 15,
    summary: "The scan did not detect a clear newsletter path.",
  },
];

const findings: ScoringFinding[] = [
  {
    category: ReportCategory.READER_ENGAGEMENT,
    severity: FindingSeverity.HIGH,
    title: "Newsletter signup was not detected",
    finding:
      "The saved scan data did not detect a newsletter form, subscribe form, or email signup field.",
    recommendation:
      "Add a clear newsletter signup section with a simple reader benefit.",
    practicalActions: [
      "Add the signup form to the homepage.",
      "Explain the subscriber benefit beside the form.",
    ],
    priority: 1,
  },
  {
    category: ReportCategory.BOOK_VISIBILITY,
    severity: FindingSeverity.MEDIUM,
    title: "Buy links were not detected",
    finding: "The saved scan data did not detect buy links or retailer links.",
    recommendation:
      "Add a visible book section with retailer links for the featured book.",
    practicalActions: [
      "Feature one book prominently.",
      "Add its active retailer links.",
    ],
    priority: 2,
  },
];

const input = {
  websiteUrl: "https://janewriter.test/",
  pagesScanned: [
    {
      url: "https://janewriter.test/",
      pageType: "HOME",
      statusCode: 200,
      title: "Jane Writer",
      metaDescription: null,
      h1: "Jane Writer",
      wordCount: 450,
    },
  ],
  signals: mockSignals,
  categoryScores,
  findings,
  quickWins: findings,
  serviceFitLabel: "Newsletter setup" as const,
  overallScore: 46,
};

test("fallback narrative uses mocked findings and preserves category scores", () => {
  const narrative = buildFallbackReportNarrative(input);

  assert.match(narrative.executiveSummary, /46\/100/);
  assert.match(narrative.topProblems[0], /Newsletter signup was not detected/);
  assert.match(narrative.topRecommendations[0], /newsletter signup section/);
  assert.equal(narrative.categoryCritiques[0].score, 73);
  assert.equal(narrative.categoryCritiques[1].score, 20);
  assert.doesNotMatch(JSON.stringify(narrative), /guaranteed ranking/i);
});

test("report narrative JSON parser validates shape and rejects guarantee claims", () => {
  const narrative = buildFallbackReportNarrative(input);
  const parsed = parseReportNarrativeJson(JSON.stringify(narrative));

  assert.equal(parsed.finalRecommendation, narrative.finalRecommendation);

  assert.throws(
    () =>
      parseReportNarrativeJson(
        JSON.stringify({
          ...narrative,
          finalRecommendation:
            "This creates guaranteed ranking and guaranteed sales.",
        })
      ),
    /unsupported guarantee/i
  );
});

test("OpenAI response text extraction supports Responses API output items", () => {
  const narrative = buildFallbackReportNarrative(input);
  const text = JSON.stringify(narrative);

  assert.equal(
    extractOpenAIResponseText({
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text,
            },
          ],
        },
      ],
    }),
    text
  );
});

test("generateReportNarrative validates mocked OpenAI JSON output", async () => {
  const deterministicNarrative = buildFallbackReportNarrative(input);
  const aiNarrative = {
    ...deterministicNarrative,
    executiveSummary:
      "The website has a clear author name, but the saved findings show newsletter and book-buying paths need attention.",
    categoryCritiques: deterministicNarrative.categoryCritiques.map(
      ({ category, critique }) => ({ category, critique })
    ),
  };
  let requestBody: Record<string, unknown> | null = null;

  const result = await generateReportNarrative(input, {
    apiKey: "test-key",
    model: "test-model",
    fetchImplementation: async (_url, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;

      return new Response(
        JSON.stringify({
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify(aiNarrative),
                },
              ],
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    },
  });

  assert.equal(result.source, "ai");
  assert.equal(result.narrative.executiveSummary, aiNarrative.executiveSummary);
  assert.equal(result.narrative.categoryCritiques[0].score, 73);
  assert.equal(result.narrative.categoryCritiques[1].score, 20);
  assert.ok(requestBody);
  const body = requestBody as Record<string, unknown>;

  assert.equal(body.model, "test-model");
  assert.deepEqual(
    (body.text as { format?: { strict?: boolean } }).format?.strict,
    true
  );
  const schema = (body.text as {
    format?: {
      schema?: {
        properties?: {
          categoryCritiques?: {
            items?: { properties?: Record<string, unknown> };
          };
        };
      };
    };
  }).format?.schema;

  assert.equal(
    schema?.properties?.categoryCritiques?.items?.properties?.score,
    undefined
  );
});

test("serialized report narrative can be parsed back as report JSON", () => {
  const narrative = buildFallbackReportNarrative(input);
  const serialized = serializeReportNarrative({
    source: "fallback",
    narrative,
  });
  const parsed = parseSerializedReportNarrative(serialized);

  assert.ok(parsed);
  assert.equal(parsed.kind, "author-report-narrative");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.source, "fallback");
  assert.equal(parsed.narrative.executiveSummary, narrative.executiveSummary);
});
