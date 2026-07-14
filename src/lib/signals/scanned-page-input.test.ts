import assert from "node:assert/strict";
import test from "node:test";

import { extractPageData } from "@/lib/crawler/extract";
import { extractedPageToScannedPageSignalInput } from "@/lib/signals/scanned-page-input";

test("maps extracted crawler data into the shared analyzer signal input", () => {
  const extracted = extractPageData(
    `
      <title>Jane Writer</title>
      <meta name="description" content="Fantasy books by Jane Writer">
      <link rel="canonical" href="/books/">
      <h1>Jane Writer</h1>
      <h2>Books</h2>
      <p>Fantasy stories for curious readers.</p>
      <a href="/about/">About</a>
      <img src="/cover.jpg" alt="Novel cover">
      <form><label for="email">Email</label><input id="email" type="email"></form>
    `,
    "https://author.test/",
  );
  const input = extractedPageToScannedPageSignalInput(extracted, 200);

  assert.equal(input.url, extracted.url);
  assert.equal(input.pageType, extracted.pageType);
  assert.equal(input.statusCode, 200);
  assert.equal(input.title, "Jane Writer");
  assert.equal(input.metaDescription, "Fantasy books by Jane Writer");
  assert.equal(input.h1, "Jane Writer");
  assert.equal(input.wordCount, extracted.wordCount);
  assert.deepEqual(input.linksJson, extracted.links);
  assert.deepEqual(input.imagesJson, extracted.images);
  assert.deepEqual(input.formsJson, extracted.forms);
  assert.deepEqual(input.headingsJson, {
    h1Count: 1,
    h2: ["Books"],
    h3: [],
    bodyText: extracted.bodyText,
    jsonLd: [],
    semanticArticle: false,
    canonicalUrl: "https://author.test/books/",
    robots: null,
  });
});
