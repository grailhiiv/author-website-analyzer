import assert from "node:assert/strict";
import test from "node:test";

import {
  detectBrowserFallbackTrigger,
  mergeRenderedExtraction,
} from "@/lib/crawler/browser-fallback.core";
import { extractPageData } from "@/lib/crawler/extract";

test("triggers only when thin HTML also contains an affirmative application shell", () => {
  const html = `
    <html><head><script src="/_next/app.js"></script></head>
    <body><div id="__next"></div><noscript>Please enable JavaScript.</noscript></body></html>
  `;
  const extracted = extractPageData(html, "https://author.test/");
  const trigger = detectBrowserFallbackTrigger({
    html,
    extracted,
    homepageUrl: "https://author.test/",
  });

  assert.deepEqual(trigger?.codes, [
    "empty_application_root",
    "javascript_required_noscript",
  ]);
});

test("does not render an ordinary sparse server-rendered page", () => {
  const html = "<title>Jane Writer</title><h1>Jane Writer</h1><p>Welcome.</p>";
  const extracted = extractPageData(html, "https://author.test/");

  assert.equal(
    detectBrowserFallbackTrigger({
      html,
      extracted,
      homepageUrl: "https://author.test/",
    }),
    null,
  );
});

test("rendered extraction enriches shell evidence without overriding static SEO authority", () => {
  const staticData = extractPageData(
    `<title>Static title</title><link rel="canonical" href="/canonical"><div id="root"></div>`,
    "https://author.test/",
  );
  const renderedData = extractPageData(
    `<title>Rendered title</title><h1>Jane Writer</h1><p>${"Author books and reader news. ".repeat(12)}</p><form><input type="email"></form>`,
    "https://author.test/",
  );
  const result = mergeRenderedExtraction(staticData, renderedData);

  assert.equal(result.adopted, true);
  assert.equal(result.extracted.title, "Static title");
  assert.equal(result.extracted.h1, "Jane Writer");
  assert.equal(result.extracted.seo.canonicalUrl, "https://author.test/canonical");
  assert.equal(result.extracted.forms.length, 1);
});

test("does not adopt a rendered snapshot with no material evidence gain", () => {
  const staticData = extractPageData(
    "<title>Jane</title><h1>Jane</h1><p>Welcome to my author website.</p>",
    "https://author.test/",
  );
  const renderedData = extractPageData(
    "<title>Jane changed</title><h1>Jane</h1><p>Welcome to my author website.</p>",
    "https://author.test/",
  );

  assert.equal(mergeRenderedExtraction(staticData, renderedData).adopted, false);
});
