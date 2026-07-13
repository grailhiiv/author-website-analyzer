import assert from "node:assert/strict";
import test from "node:test";

import {
  createCrawlPageDeduplicator,
  isSuccessfulHtmlPage,
} from "@/lib/crawler/diagnostics";

function page({
  finalUrl = "https://author.test/books",
  statusCode = 200,
  canonicalUrl = "https://author.test/books/",
  bodyText = "A".repeat(120),
}: {
  finalUrl?: string;
  statusCode?: number;
  canonicalUrl?: string | null;
  bodyText?: string;
} = {}) {
  return {
    finalUrl,
    statusCode,
    extracted: {
      title: "Books by Jane Writer",
      h1: "Books",
      bodyText,
      seo: { canonicalUrl },
    },
  };
}

test("only successful extracted HTML pages consume the saved-page budget", () => {
  assert.equal(isSuccessfulHtmlPage(page()), true);
  assert.equal(isSuccessfulHtmlPage(page({ statusCode: 404 })), false);
  assert.equal(
    isSuccessfulHtmlPage({
      finalUrl: "https://author.test/cover.jpg",
      statusCode: 200,
      extracted: null,
    }),
    false,
  );
});

test("crawl page identity deduplicates final URLs, canonicals, and content", () => {
  const deduplicator = createCrawlPageDeduplicator("https://author.test/");
  const savedPage = page();

  assert.equal(deduplicator.has(savedPage), false);
  deduplicator.remember(savedPage);

  assert.equal(
    deduplicator.has(
      page({
        finalUrl: "https://author.test/catalog",
        canonicalUrl: "https://author.test/books/",
        bodyText: "Different content ".repeat(20),
      }),
    ),
    true,
  );
  assert.equal(
    deduplicator.has(
      page({
        finalUrl: "https://author.test/duplicate-copy",
        canonicalUrl: null,
      }),
    ),
    true,
  );
  assert.equal(deduplicator.hasSeenUrl("https://author.test/books"), true);
  assert.equal(deduplicator.hasSeenUrl("https://author.test/books/"), false);
});
