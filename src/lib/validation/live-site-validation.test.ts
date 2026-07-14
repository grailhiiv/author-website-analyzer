import assert from "node:assert/strict";
import test from "node:test";

import { CRAWL_DIAGNOSTICS_VERSION } from "@/lib/crawler/diagnostics";
import {
  BROWSER_FALLBACK_POLICY_VERSION,
} from "@/lib/crawler/browser-fallback.core";
import {
  CRAWLER_EXTRACTION_VERSION,
  extractPageData,
} from "@/lib/crawler/extract";
import type { CrawlWebsiteResult } from "@/lib/crawler/service.core";
import {
  parseLiveSiteValidationManifest,
  runLiveSiteValidation,
  sanitizeLiveValidationUrl,
} from "@/lib/validation/live-site-validation";

function createCrawlResult(
  url: string,
  {
    failureMessage = null,
    browserFailureMessage = "PRIVATE browser failure details",
  }: {
    failureMessage?: string | null;
    browserFailureMessage?: string;
  } = {},
): CrawlWebsiteResult {
  const pageUrl = new URL("/reader-club?token=PRIVATE_TOKEN#signup", url).toString();
  const extracted = extractPageData(
    `
      <title>Reader Club Newsletter</title>
      <meta name="description" content="PRIVATE COPY that must not be saved">
      <h1>Join the Reader Club</h1>
      <p>${"Reader updates and new book news. ".repeat(10)}</p>
      <form action="/private-lead-endpoint">
        <label for="email">Email</label>
        <input id="email" name="private_email" type="email" required>
        <button>Subscribe</button>
      </form>
    `,
    pageUrl,
    new URL(url).origin,
  );

  return {
    homepageUrl: new URL("/?session=PRIVATE_SESSION#home", url).toString(),
    crawledUrls: [pageUrl],
    pages: [
      {
        requestedUrl: pageUrl,
        finalUrl: pageUrl,
        statusCode: 200,
        extracted,
        errorMessage: "PRIVATE page error details",
        renderedEvidence: {
          policyVersion: BROWSER_FALLBACK_POLICY_VERSION,
          finalUrl: pageUrl,
          triggerCodes: ["empty_application_root"],
          adopted: true,
          requestCount: 3,
          abortedRequestCount: 1,
          htmlTruncated: false,
        },
      },
    ],
    successfulHtmlPages: failureMessage ? 0 : 1,
    failureMessage,
    diagnostics: {
      schemaVersion: CRAWL_DIAGNOSTICS_VERSION,
      extractionVersion: CRAWLER_EXTRACTION_VERSION,
      limits: {
        maxSavedHtmlPages: 10,
        maxRequests: 30,
        maxRenderedPages: 2,
      },
      submittedUrl: url,
      homepageFinalUrl: new URL(url).toString(),
      allowedHostnames: [new URL(url).hostname],
      discoveredFromHomepage: 1,
      discoveredFromSitemap: 0,
      discoveredFromRobotsSitemaps: 0,
      candidateUrls: 1,
      discoveredUrls: [pageUrl],
      attemptedRequests: 1,
      attemptedUrls: [pageUrl],
      savedHtmlPages: failureMessage ? 0 : 1,
      failedHttpPagesRecorded: 0,
      skippedDuplicates: 0,
      skippedNonHtml: 0,
      skippedUnsuccessfulStatus: 0,
      skippedUrls: [],
      failedRequests: [],
      savedUrls: [
        {
          requestedUrl: pageUrl,
          finalUrl: pageUrl,
          pageType: extracted.pageType,
        },
      ],
      browserFallback: {
        policyVersion: BROWSER_FALLBACK_POLICY_VERSION,
        enabled: true,
        status: "partial",
        limits: {
          maxRenderedPages: 2,
          navigationTimeoutMs: 8_000,
          maxRequestsPerPage: 20,
          maxRequestsPerReport: 40,
        },
        triggerCandidates: [
          { url: pageUrl, codes: ["empty_application_root"] },
        ],
        attemptedUrls: [pageUrl],
        renderedUrls: [pageUrl],
        adoptedUrls: [pageUrl],
        requestCount: 3,
        abortedRequestCount: 1,
        discoveredFromRenderedDom: 0,
        failures: [
          {
            url: pageUrl,
            code: "private_failure_code",
            message: browserFailureMessage,
          },
        ],
      },
    },
  };
}

test("live manifest requires explicit approval and rejects unsafe or duplicate entries", () => {
  const baseSite = {
    id: "approved-author",
    url: "https://author.test/",
    approved: true,
  } as const;

  assert.doesNotThrow(() =>
    parseLiveSiteValidationManifest({
      schemaVersion: "1.0.0",
      sites: [baseSite],
    }),
  );
  assert.throws(() =>
    parseLiveSiteValidationManifest({
      schemaVersion: "1.0.0",
      sites: [{ ...baseSite, approved: false }],
    }),
  );
  assert.throws(() =>
    parseLiveSiteValidationManifest({
      schemaVersion: "1.0.0",
      sites: [baseSite, baseSite],
    }),
  );
  assert.throws(() =>
    parseLiveSiteValidationManifest({
      schemaVersion: "1.0.0",
      sites: [
        {
          ...baseSite,
          url: "https://user:secret@author.test/",
        },
      ],
    }),
  );
  assert.throws(() =>
    parseLiveSiteValidationManifest({
      schemaVersion: "1.0.0",
      sites: [{ ...baseSite, unexpected: "field" }],
    }),
  );
});

test("live validation saves minimized detections and strips private URL data and raw evidence", async () => {
  const report = await runLiveSiteValidation({
    manifest: {
      schemaVersion: "1.0.0",
      sites: [
        {
          id: "approved-author",
          url: "https://author.test/?operator=PRIVATE_OPERATOR#approval",
          approved: true,
          notes: "PRIVATE operator notes",
          expectedSignals: {
            "newsletter.newsletterSignupForm": true,
          },
          expectedOutcomes: {
            "engagement.newsletter_signup": "present",
          },
          expectedPageRoles: [
            { path: "/reader-club", primaryRole: "NEWSLETTER" },
          ],
        },
      ],
    },
    crawl: async (url) => createCrawlResult(url),
    generatedAt: "2026-07-14T00:00:00.000Z",
  });
  const serialized = JSON.stringify(report);
  const site = report.sites[0];

  assert.equal(report.summary.totalSites, 1);
  assert.equal(report.summary.completedSites, 1);
  assert.equal(site.status, "completed");
  assert.equal(site.approvedUrl, "https://author.test/");
  assert.equal(site.homepageUrl, "https://author.test/");
  assert.equal(site.pages[0].url, "https://author.test/reader-club");
  assert.equal(site.pages[0].primaryRole, "NEWSLETTER");
  assert.equal(site.signals["newsletter.newsletterSignupForm"], true);
  assert.equal(site.outcomes["engagement.newsletter_signup"].state, "present");
  assert.deepEqual(site.expectations, {
    labeled: 3,
    passed: 3,
    failed: 0,
    mismatches: [],
  });

  for (const privateValue of [
    "PRIVATE_TOKEN",
    "PRIVATE_SESSION",
    "PRIVATE COPY",
    "PRIVATE page error details",
    "PRIVATE browser failure details",
    "PRIVATE operator notes",
    "private_email",
    "private-lead-endpoint",
    "operator=",
    "session=",
    "token=",
  ]) {
    assert.equal(serialized.includes(privateValue), false, privateValue);
  }

  assert.equal(/\"score/i.test(serialized), false);
  assert.equal(serialized.includes('"evidence":'), false);
});

test("live validation runs sequentially and isolates unexpected crawler errors", async () => {
  let active = 0;
  let maxActive = 0;
  const completed: string[] = [];
  const manifest = {
    schemaVersion: "1.0.0",
    sites: ["one", "two", "three"].map((id) => ({
      id,
      url: `https://${id}.author.test/`,
      approved: true,
    })),
  };
  const report = await runLiveSiteValidation({
    manifest,
    crawl: async (url) => {
      active += 1;
      maxActive = Math.max(maxActive, active);

      try {
        await new Promise((resolve) => setTimeout(resolve, 5));
        const hostname = new URL(url).hostname;

        if (hostname.startsWith("two.")) {
          throw new Error("PRIVATE unexpected crawler error");
        }

        completed.push(hostname);
        return createCrawlResult(url);
      } finally {
        active -= 1;
      }
    },
  });

  assert.equal(maxActive, 1);
  assert.deepEqual(completed, ["one.author.test", "three.author.test"]);
  assert.deepEqual(
    report.sites.map((site) => site.status),
    ["completed", "runner_error", "completed"],
  );
  assert.equal(report.summary.runnerErrorSites, 1);
  assert.equal(JSON.stringify(report).includes("PRIVATE unexpected"), false);
});

test("live validation reports explicit expectation mismatches and crawl failures", async () => {
  const report = await runLiveSiteValidation({
    manifest: {
      schemaVersion: "1.0.0",
      sites: [
        {
          id: "mismatch",
          url: "https://mismatch.author.test/",
          approved: true,
          expectedSignals: { "newsletter.newsletterSignupForm": false },
        },
        {
          id: "failed",
          url: "https://failed.author.test/",
          approved: true,
        },
      ],
    },
    crawl: async (url) =>
      createCrawlResult(
        url,
        new URL(url).hostname.startsWith("failed.")
          ? { failureMessage: "PRIVATE homepage failure" }
          : {},
      ),
  });

  assert.equal(report.summary.failedExpectations, 1);
  assert.equal(report.summary.crawlFailedSites, 1);
  assert.equal(report.sites[0].expectations.failed, 1);
  assert.deepEqual(report.sites[0].expectations.mismatches[0], {
    kind: "signal",
    id: "newsletter.newsletterSignupForm",
    expected: false,
    actual: true,
  });
  assert.equal(report.sites[1].status, "crawl_failed");
  assert.equal(report.sites[1].failureCode, "no_successful_html_pages");
  assert.equal(JSON.stringify(report).includes("PRIVATE homepage failure"), false);
});

test("URL sanitization removes credentials, queries, and fragments", () => {
  assert.equal(
    sanitizeLiveValidationUrl(
      "https://user:secret@author.test/books/?token=private#details",
    ),
    "https://author.test/books/",
  );
  assert.equal(sanitizeLiveValidationUrl("not a URL"), "[invalid-url]");
});
