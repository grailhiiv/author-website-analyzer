import assert from "node:assert/strict";
import test from "node:test";

import { extractPageData, type ExtractedPageData } from "@/lib/crawler/extract";
import {
  buildAnalyzerDiagnostics,
  mergeAnalyzerDiagnostics,
} from "@/lib/signals/analyzer-diagnostics";
import {
  detectAuthorWebsiteSignals,
  type ScannedPageSignalInput,
} from "@/lib/signals/author-website-signals";

function pageInput(
  page: ExtractedPageData,
  statusCode: number | null = 200,
): ScannedPageSignalInput {
  return {
    url: page.url,
    pageType: page.pageType,
    statusCode,
    title: page.title,
    metaDescription: page.metaDescription,
    h1: page.h1,
    headingsJson: {
      h1Count: page.h1Count,
      h2: page.headings.h2,
      h3: page.headings.h3,
      bodyText: page.bodyText,
      jsonLd: page.jsonLd,
      canonicalUrl: page.seo.canonicalUrl,
      robots: page.seo.robots,
    },
    linksJson: page.links,
    imagesJson: page.images,
    formsJson: page.forms,
    wordCount: page.wordCount,
  };
}

function crawlDiagnostics({
  discoveredUrls,
  attemptedUrls,
  failed = false,
  browserFallback,
}: {
  discoveredUrls: string[];
  attemptedUrls: string[];
  failed?: boolean;
  browserFallback?: unknown;
}) {
  return {
    schemaVersion: "1.1.0",
    extractionVersion: "1.1.0",
    limits: { maxSavedHtmlPages: 10, maxRequests: 30 },
    discoveredUrls,
    attemptedUrls,
    attemptedRequests: attemptedUrls.length,
    savedHtmlPages: attemptedUrls.length - (failed ? 1 : 0),
    failedRequests: failed
      ? [
          {
            requestedUrl: attemptedUrls.at(-1),
            reason: "request_failed",
          },
        ]
      : [],
    skippedUrls: [],
    ...(browserFallback ? { browserFallback } : {}),
  };
}

function build(
  pages: ScannedPageSignalInput[],
  diagnostics: unknown,
) {
  return buildAnalyzerDiagnostics({
    crawlDiagnostics: diagnostics,
    pages,
    signals: detectAuthorWebsiteSignals(pages),
    analyzedAt: "2026-07-14T00:00:00.000Z",
  });
}

function outcome(
  analysis: ReturnType<typeof buildAnalyzerDiagnostics>,
  signalId: string,
) {
  const result = analysis.outcomes.find((item) => item.signalId === signalId);
  assert.ok(result, `Missing ${signalId} outcome.`);
  return result;
}

test("mergeAnalyzerDiagnostics preserves crawl fields and replaces stale analysis", () => {
  const home = pageInput(
    extractPageData(
      "<title>Jane Writer</title><h1>Jane Writer</h1><p>Stories and news from Jane Writer.</p>",
      "https://author.test/",
    ),
  );
  const analysis = build(
    [home],
    crawlDiagnostics({
      discoveredUrls: [home.url],
      attemptedUrls: [home.url],
    }),
  );
  const merged = mergeAnalyzerDiagnostics(
    { savedHtmlPages: 1, customField: "preserved", analysis: { stale: true } },
    analysis,
  );

  assert.equal(merged.savedHtmlPages, 1);
  assert.equal(merged.customField, "preserved");
  assert.deepEqual(merged.analysis, analysis);
  assert.equal(JSON.stringify(merged).includes('"stale":true'), false);

  assert.deepEqual(mergeAnalyzerDiagnostics(null, analysis), { analysis });
});

test("a discovered but unrequested About candidate resolves to unknown", () => {
  const home = pageInput(
    extractPageData(
      `
        <title>Jane Writer</title>
        <h1>Jane Writer</h1>
        <p>Fantasy stories, books, reader news, events, interviews, and new releases from Jane Writer.</p>
        <a href="/about">About Jane</a>
      `,
      "https://author.test/",
    ),
  );
  const analysis = build(
    [home],
    crawlDiagnostics({
      discoveredUrls: [home.url, "https://author.test/about"],
      attemptedUrls: [home.url],
    }),
  );
  const about = outcome(analysis, "brand.about_presence");

  assert.equal(about.state, "unknown");
  assert.equal(about.reasonCode, "candidate_not_requested");
  assert.deepEqual(about.relatedUninspectedCandidateUrls, [
    "https://author.test/about",
  ]);
});

test("an exhausted static queue can support a bounded absence outcome", () => {
  const home = pageInput(
    extractPageData(
      `
        <title>Jane Writer</title>
        <h1>Jane Writer</h1>
        <p>Fantasy stories, books, reader news, events, interviews, and new releases from Jane Writer.</p>
      `,
      "https://author.test/",
    ),
  );
  const analysis = build(
    [home],
    crawlDiagnostics({
      discoveredUrls: [home.url],
      attemptedUrls: [home.url],
    }),
  );
  const about = outcome(analysis, "brand.about_presence");

  assert.equal(analysis.coverage.staticHtmlState, "complete");
  assert.equal(analysis.coverage.stopReason, "queue_exhausted");
  assert.equal(about.state, "absent");
  assert.equal(about.reasonCode, "eligible_surface_inspected_no_evidence");
});

test("missing CSS or rendered book-cover evidence remains unknown", () => {
  const books = pageInput(
    extractPageData(
      `
        <title>Books by Jane Writer</title>
        <h1>Books by Jane Writer</h1>
        <p>Discover fantasy novels, character journeys, reader guides, series information, and the latest releases by Jane Writer.</p>
      `,
      "https://author.test/books",
    ),
  );
  const analysis = build(
    [books],
    crawlDiagnostics({
      discoveredUrls: [books.url],
      attemptedUrls: [books.url],
    }),
  );
  const cover = outcome(analysis, "books.cover_image");

  assert.equal(cover.state, "unknown");
  assert.equal(cover.reasonCode, "extractor_unsupported");
  assert.equal(analysis.coverage.capabilities.cssBackgroundImages, "unsupported");
  assert.equal(analysis.coverage.capabilities.renderedDom, "not_inspected");
});

test("a failed About request cannot become a present or absent About result", () => {
  const home = pageInput(
    extractPageData(
      "<title>Jane Writer</title><h1>Jane Writer</h1><p>Fantasy books and reader news from Jane Writer.</p>",
      "https://author.test/",
    ),
  );
  const failedAbout = pageInput(
    extractPageData(
      "<title>About Jane</title><h1>About Jane</h1><p>Jane Writer is an award-winning fantasy author.</p>",
      "https://author.test/about",
    ),
    404,
  );
  const diagnostics = crawlDiagnostics({
    discoveredUrls: [home.url, failedAbout.url],
    attemptedUrls: [home.url, failedAbout.url],
    failed: true,
  });
  const analysis = build([home, failedAbout], diagnostics);
  const about = outcome(analysis, "brand.about_presence");

  assert.equal(about.state, "unknown");
  assert.equal(about.reasonCode, "request_failed");
});

test("successful rendered inspection clears rendering-required uncertainty", () => {
  const home = pageInput(
    extractPageData(
      "<title>Jane Writer</title><p>Loading</p>",
      "https://author.test/",
    ),
  );
  const diagnostics = crawlDiagnostics({
    discoveredUrls: [home.url],
    attemptedUrls: [home.url],
    browserFallback: {
      status: "completed",
      triggerCandidates: [{ url: home.url, codes: ["empty_application_root"] }],
      attemptedUrls: [home.url],
      renderedUrls: [home.url],
      adoptedUrls: [home.url],
    },
  });
  const analysis = build([home], diagnostics);

  assert.equal(analysis.coverage.capabilities.renderedDom, "inspected");
  assert.deepEqual(analysis.coverage.renderingRequiredUrls, []);
  assert.notEqual(outcome(analysis, "search.home_h1").reasonCode, "rendering_required");
});

test("failed rendered inspection keeps the shell outcome unknown", () => {
  const home = pageInput(
    extractPageData(
      "<title>Jane Writer</title><p>Loading</p>",
      "https://author.test/",
    ),
  );
  const diagnostics = crawlDiagnostics({
    discoveredUrls: [home.url],
    attemptedUrls: [home.url],
    browserFallback: {
      status: "failed",
      triggerCandidates: [{ url: home.url, codes: ["empty_application_root"] }],
      attemptedUrls: [home.url],
      renderedUrls: [],
      adoptedUrls: [],
    },
  });
  const analysis = build([home], diagnostics);
  const h1 = outcome(analysis, "search.home_h1");

  assert.equal(analysis.coverage.capabilities.renderedDom, "failed");
  assert.deepEqual(analysis.coverage.renderingRequiredUrls, [home.url]);
  assert.equal(h1.state, "unknown");
  assert.equal(h1.reasonCode, "rendering_required");
});
