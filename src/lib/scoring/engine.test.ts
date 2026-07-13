import assert from "node:assert/strict";
import test from "node:test";

import { FindingSeverity, ReportCategory } from "@/generated/prisma/client";
import {
  DETERMINISTIC_SCORING_CATEGORIES,
  DETERMINISTIC_SCORING_TOTAL,
  scoreAuthorWebsite,
  type ScoringInput,
  type ScoringPageInput,
} from "@/lib/scoring/engine";
import type {
  AuthorWebsiteSignals,
  SignalDetection,
} from "@/lib/signals/author-website-signals";

function detected(evidence = ["Detected"]): SignalDetection {
  return {
    detected: true,
    evidence,
  };
}

function missing(evidence: string[] = []): SignalDetection {
  return {
    detected: false,
    evidence,
  };
}

function signalSet(allDetected: boolean): AuthorWebsiteSignals {
  const signal = allDetected ? detected : missing;

  return {
    pagesAnalyzed: allDetected ? 3 : 1,
    authorBrand: {
      authorNameVisible: signal(["Author name: Jane Doe"]),
      genreOrCategoryMentioned: signal(["Genre/category wording: fantasy"]),
      clearHomepageHeadline: signal([
        "Homepage headline: Jane Doe Fantasy Author",
      ]),
      aboutSectionOrPage: signal(["About page: https://janedoe.test/about"]),
    },
    bookPromotion: {
      bookCoverImages: signal(["Book cover image: The Star Library cover"]),
      bookTitles: signal(["Book heading: The Star Library"]),
      bookDescriptionOrBlurb: signal(["Book description wording: blurb"]),
      buyLinks: signal(["Buy link: Buy the book"]),
      retailerLinks: signal(["Amazon: Amazon", "Apple Books: Apple Books"]),
      featuredBookSection: signal(["Featured book wording: available now"]),
      seriesPage: signal(["Series signal: https://janedoe.test/series"]),
      reviewsOrPraise: signal(["Reviews/praise wording: praise"]),
    },
    newsletter: {
      newsletterSignupForm: signal([
        "Newsletter form on https://janedoe.test/",
      ]),
      subscribeForm: signal(["Subscribe form on https://janedoe.test/"]),
      emailInput: signal(["Email input on https://janedoe.test/"]),
      readerMagnetPhrases: signal(["Reader magnet wording: free chapter"]),
      freeChapter: signal(["Free chapter wording"]),
      bonusScene: signal(["Bonus scene wording"]),
      freeBook: signal(["Free book wording"]),
      updatesSignup: signal(["Updates wording"]),
    },
    seo: {
      titleTagExists: signal(["Title tag: Jane Doe | Fantasy Author"]),
      metaDescriptionExists: signal(["Meta description: Fantasy novels"]),
      h1Exists: signal(["H1: Jane Doe Fantasy Author"]),
      multipleH1Issue: missing(),
      missingAltText: missing(),
      indexabilitySignals: {
        detected: true,
        indexable: allDetected ? true : false,
        evidence: allDetected
          ? ["Page returned HTTP 200"]
          : ["Robots meta: noindex"],
      },
      canonicalUrl: signal(["Canonical URL: https://janedoe.test/"]),
    },
    trust: {
      authorBio: signal(["Author bio signal: https://janedoe.test/about"]),
      authorPhoto: signal(["Author photo: Jane Doe headshot"]),
      contactForm: signal(["Contact form: https://janedoe.test/contact"]),
      contactEmail: signal(["Contact email: hello@janedoe.test"]),
      socialLinks: signal(["Social link: Instagram"]),
      mediaKit: signal(["Media kit page: https://janedoe.test/media"]),
      privacyPolicy: signal(["Privacy policy link: Privacy"]),
    },
    retailers: {
      amazon: signal(["Amazon: Amazon"]),
      kindle: signal(["Kindle: Kindle"]),
      kobo: allDetected ? detected(["Kobo: Kobo"]) : missing(),
      appleBooks: signal(["Apple Books: Apple Books"]),
      barnesAndNoble: allDetected ? detected(["Barnes & Noble"]) : missing(),
      bookshop: allDetected ? detected(["Bookshop"]) : missing(),
      googlePlayBooks: allDetected
        ? detected(["Google Play Books"])
        : missing(),
      goodreads: allDetected ? detected(["Goodreads"]) : missing(),
      publisherWebsites: allDetected ? detected(["Publisher"]) : missing(),
    },
    schema: {
      person: signal(["Schema: Person"]),
      book: signal(["Schema: Book"]),
      organization: signal(["Schema: Organization"]),
      review: signal(["Schema: Review"]),
      aggregateRating: signal(["Schema: AggregateRating"]),
      sameAs: signal(["sameAs links: Instagram"]),
    },
  };
}

function cloneSignals(signals: AuthorWebsiteSignals): AuthorWebsiteSignals {
  return JSON.parse(JSON.stringify(signals)) as AuthorWebsiteSignals;
}

function strongPages(): ScoringPageInput[] {
  return [
    {
      url: "https://janedoe.test/",
      pageType: "HOME",
      statusCode: 200,
      title: "Jane Doe | Fantasy Author",
      metaDescription: "Fantasy novels by Jane Doe.",
      h1: "Jane Doe Fantasy Author",
      headingsJson: {
        h1Count: 1,
        canonicalUrl: "https://janedoe.test/",
      },
      linksJson: {
        internal: [
          { href: "/about", text: "About" },
          { href: "/books", text: "Books" },
          { href: "/newsletter", text: "Newsletter" },
        ],
      },
      imagesJson: [{ src: "/cover.jpg", alt: "The Star Library book cover" }],
      formsJson: [
        {
          fields: [{ type: "email", name: "email" }],
          buttons: ["Subscribe"],
        },
      ],
      wordCount: 350,
      contentText:
        "Jane Doe writes fantasy novels. Subscribe for a free chapter and book news.",
      screenshotUrl: "/screenshots/home.png",
    },
    {
      url: "https://janedoe.test/about",
      pageType: "ABOUT",
      statusCode: 200,
      title: "About Jane Doe",
      h1: "About Jane Doe",
      wordCount: 250,
      contentText: "Author bio and media kit.",
    },
    {
      url: "https://janedoe.test/books",
      pageType: "BOOKS",
      statusCode: 200,
      title: "Books",
      h1: "The Star Library",
      wordCount: 300,
      contentText:
        "Book description, praise, buy links, and series reading order.",
    },
  ];
}

function scoreInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    signals: signalSet(true),
    pagesScanned: strongPages(),
    technicalAudit: {
      mobilePerformance: 96,
      desktopPerformance: 98,
      mobileAccessibility: 95,
      desktopAccessibility: 97,
      mobileSeo: 100,
      desktopSeo: 100,
      mobileBestPractices: 94,
      desktopBestPractices: 96,
    },
    ...overrides,
  };
}

test("scoreAuthorWebsite awards full deterministic scores for a complete author site", () => {
  const result = scoreAuthorWebsite(scoreInput());

  assert.equal(result.overallScore, 100);
  assert.equal(result.serviceFitLabel, "Website optimization");
  assert.equal(result.findings.length, 0);
  assert.equal(result.quickWins.length, 0);

  const bookScore = result.categoryScores.find(
    (score) => score.category === ReportCategory.BOOK_VISIBILITY,
  );

  assert.equal(bookScore?.score, 20);
  assert.equal(bookScore?.maxScore, 20);
  assert.equal(bookScore?.percentageScore, 100);
  assert.equal(bookScore?.weight, 20);
});

test("scoreAuthorWebsite treats unavailable PageSpeed metrics as unknown", () => {
  const result = scoreAuthorWebsite(
    scoreInput({
      technicalAudit: null,
    }),
  );
  const mobileScore = result.categoryScores.find(
    (score) => score.category === ReportCategory.MOBILE_PERFORMANCE,
  );
  const technicalScore = result.categoryScores.find(
    (score) => score.category === ReportCategory.TECHNICAL_HEALTH,
  );

  assert.equal(mobileScore?.score, 7);
  assert.equal(technicalScore?.score, 7);
  assert.equal(
    result.findings.some((finding) =>
      /PageSpeed|performance score|best practices score|accessibility score|search audit score/i.test(
        `${finding.title} ${finding.finding}`,
      ),
    ),
    false,
  );
});

test("scoreAuthorWebsite uses the fixed 100-point category model", () => {
  const result = scoreAuthorWebsite(scoreInput());

  assert.deepEqual(
    DETERMINISTIC_SCORING_CATEGORIES.map((category) => category.label),
    [
      "Brand Clarity",
      "Book Visibility",
      "Reader Engagement",
      "Search Visibility",
      "Mobile Performance",
      "Technical Health",
      "Author Trust",
      "Site Usability",
    ],
  );
  assert.deepEqual(
    DETERMINISTIC_SCORING_CATEGORIES.map((category) => category.weight),
    [15, 20, 15, 15, 10, 10, 10, 5],
  );
  assert.equal(DETERMINISTIC_SCORING_TOTAL, 100);
  assert.deepEqual(
    result.categoryScores.map((category) => category.maxScore),
    [15, 20, 15, 15, 10, 10, 10, 5],
  );
  assert.equal(
    result.categoryScores.reduce(
      (total, category) => total + category.score,
      0,
    ),
    result.overallScore,
  );
});

test("scoreAuthorWebsite creates findings for every reduced category score", () => {
  const sparseSignals = signalSet(false);

  sparseSignals.seo.multipleH1Issue = detected(["Multiple H1 tags: 2"]);
  sparseSignals.seo.missingAltText = detected(["Missing image alt text"]);

  const result = scoreAuthorWebsite(
    scoreInput({
      signals: sparseSignals,
      pagesScanned: [
        {
          url: "https://thin.test/",
          pageType: "HOME",
          statusCode: 200,
          title: null,
          metaDescription: null,
          h1: null,
          headingsJson: { h1Count: 2, robots: "noindex" },
          linksJson: { internal: [] },
          imagesJson: [{ src: "/photo.jpg", alt: null }],
          formsJson: [],
          wordCount: 10,
          contentText: "Welcome.",
        },
      ],
      technicalAudit: null,
    }),
  );

  assert.equal(result.serviceFitLabel, "New author website");
  assert.ok(result.overallScore < 40);
  assert.ok(
    result.findings.some(
      (finding) => finding.title === "Buy links were not detected",
    ),
  );
  assert.ok(
    result.findings.some(
      (finding) => finding.title === "Newsletter signup was not detected",
    ),
  );
  assert.ok(
    result.findings.some(
      (finding) => finding.severity === FindingSeverity.CRITICAL,
    ),
  );
  assert.ok(result.findings.length > 0);
  assert.ok(
    result.findings.every((finding) => finding.practicalActions.length >= 3),
    "Every deterministic finding should include several practical actions",
  );
  assert.deepEqual(
    new Set(result.findings.map((finding) => finding.category)),
    new Set(DETERMINISTIC_SCORING_CATEGORIES.map(({ category }) => category)),
    "The sparse scan should exercise recommendations across all eight modules",
  );

  for (const categoryScore of result.categoryScores) {
    if (categoryScore.score < categoryScore.maxScore) {
      assert.ok(
        result.findings.some(
          (finding) => finding.category === categoryScore.category,
        ),
        `${categoryScore.label} should have at least one finding`,
      );
    }
  }
});

test("scoreAuthorWebsite labels SEO improvement when design is acceptable and SEO is weak", () => {
  const signals = cloneSignals(signalSet(true));

  signals.seo.titleTagExists = missing();
  signals.seo.metaDescriptionExists = missing();
  signals.seo.h1Exists = missing();
  signals.seo.indexabilitySignals = {
    detected: true,
    indexable: false,
    evidence: ["Robots meta: noindex"],
  };

  const pages = strongPages();
  pages[0] = {
    ...pages[0],
    title: "Home",
    h1: "Welcome",
    metaDescription: null,
  };

  const result = scoreAuthorWebsite(
    scoreInput({
      signals,
      pagesScanned: pages,
    }),
  );

  assert.equal(result.serviceFitLabel, "SEO improvement");
  const seoScore = result.categoryScores.find(
    (score) => score.category === ReportCategory.SEARCH_VISIBILITY,
  );

  assert.ok((seoScore?.percentageScore ?? 100) < 60);
});

test("scoreAuthorWebsite creates newsletter findings when newsletter signals are missing", () => {
  const signals = cloneSignals(signalSet(true));

  signals.newsletter.newsletterSignupForm = missing();
  signals.newsletter.subscribeForm = missing();
  signals.newsletter.emailInput = missing();
  signals.newsletter.readerMagnetPhrases = missing();
  signals.newsletter.freeChapter = missing();
  signals.newsletter.bonusScene = missing();
  signals.newsletter.freeBook = missing();
  signals.newsletter.updatesSignup = missing();

  const pages = strongPages().map((page) => ({
    ...page,
    formsJson: [],
    contentText: page.contentText?.replace(/Subscribe.*$/i, "Book news."),
  }));

  const result = scoreAuthorWebsite(
    scoreInput({
      signals,
      pagesScanned: pages,
    }),
  );
  const newsletterScore = result.categoryScores.find(
    (score) => score.category === ReportCategory.READER_ENGAGEMENT,
  );

  assert.equal(result.serviceFitLabel, "Newsletter setup");
  assert.ok((newsletterScore?.percentageScore ?? 100) < 60);
  assert.ok(
    result.findings.some(
      (finding) => finding.title === "Newsletter signup was not detected",
    ),
  );
});

test("scoreAuthorWebsite creates book visibility findings when book links are missing", () => {
  const signals = cloneSignals(signalSet(true));

  signals.bookPromotion.buyLinks = missing();
  signals.bookPromotion.retailerLinks = missing();
  signals.retailers.amazon = missing();
  signals.retailers.kindle = missing();
  signals.retailers.appleBooks = missing();
  signals.retailers.barnesAndNoble = missing();
  signals.retailers.bookshop = missing();
  signals.retailers.googlePlayBooks = missing();
  signals.retailers.goodreads = missing();
  signals.retailers.kobo = missing();
  signals.retailers.publisherWebsites = missing();

  const result = scoreAuthorWebsite(
    scoreInput({
      signals,
    }),
  );
  const bookScore = result.categoryScores.find(
    (score) => score.category === ReportCategory.BOOK_VISIBILITY,
  );

  assert.ok((bookScore?.percentageScore ?? 100) < 80);
  assert.ok(
    result.findings.some(
      (finding) => finding.title === "Buy links were not detected",
    ),
  );
  assert.ok(
    result.findings.some(
      (finding) =>
        finding.title === "Multiple retailer options were not detected",
    ),
  );
});

test("scoreAuthorWebsite creates poor SEO findings from missing metadata and noindex", () => {
  const signals = cloneSignals(signalSet(true));

  signals.seo.titleTagExists = missing();
  signals.seo.metaDescriptionExists = missing();
  signals.seo.h1Exists = missing();
  signals.seo.indexabilitySignals = {
    detected: true,
    indexable: false,
    evidence: ["Robots meta: noindex"],
  };
  signals.seo.canonicalUrl = missing();

  const result = scoreAuthorWebsite(
    scoreInput({
      signals,
      pagesScanned: [
        {
          url: "https://janedoe.test/",
          pageType: "HOME",
          statusCode: 200,
          title: null,
          metaDescription: null,
          h1: null,
          headingsJson: { h1Count: 0, robots: "noindex" },
          linksJson: { internal: [] },
          imagesJson: [],
          formsJson: [],
          wordCount: 100,
          contentText: "Jane Doe writes fantasy.",
        },
      ],
    }),
  );
  const seoScore = result.categoryScores.find(
    (score) => score.category === ReportCategory.SEARCH_VISIBILITY,
  );

  assert.ok((seoScore?.percentageScore ?? 100) < 50);
  assert.ok(
    result.findings.some(
      (finding) => finding.title === "Meta description is missing",
    ),
  );
  assert.ok(
    result.findings.some(
      (finding) => finding.title === "Indexability may be blocked",
    ),
  );
});

test("scoreAuthorWebsite labels website management for low technical scores on an outdated WordPress site", () => {
  const pages = strongPages();

  pages[0] = {
    ...pages[0],
    contentText: `${pages[0].contentText} wp-content copyright 2020`,
  };

  const result = scoreAuthorWebsite(
    scoreInput({
      pagesScanned: pages,
      technicalAudit: {
        mobilePerformance: 42,
        desktopPerformance: 55,
        mobileAccessibility: 95,
        desktopAccessibility: 95,
        mobileSeo: 100,
        desktopSeo: 100,
        mobileBestPractices: 45,
        desktopBestPractices: 50,
      },
    }),
  );

  assert.equal(result.serviceFitLabel, "Website management");
  assert.ok(
    result.findings.some(
      (finding) => finding.category === ReportCategory.TECHNICAL_HEALTH,
    ),
  );
});
