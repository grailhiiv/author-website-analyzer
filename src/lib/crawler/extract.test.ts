import assert from "node:assert/strict";
import test from "node:test";

import { PageType } from "@/generated/prisma/client";
import { extractPageData, detectPageType } from "@/lib/crawler/extract";
import {
  getCrawlContentFingerprint,
  normalizeCandidateUrl,
  prioritizeCrawlUrls,
} from "@/lib/crawler/prioritize";

test("detectPageType maps author website paths", () => {
  assert.equal(detectPageType("https://author.test/"), PageType.HOME);
  assert.equal(detectPageType("https://author.test/about-me"), PageType.ABOUT);
  assert.equal(detectPageType("https://author.test/books"), PageType.BOOKS);
  assert.equal(detectPageType("https://author.test/my-books"), PageType.BOOKS);
  assert.equal(
    detectPageType("https://author.test/books/the-moonlit-door"),
    PageType.BOOKS,
  );
  assert.equal(
    detectPageType("https://author.test/bibliography"),
    PageType.BOOKS,
  );
  assert.equal(detectPageType("https://author.test/contact"), PageType.CONTACT);
  assert.equal(
    detectPageType("https://author.test/newsletter"),
    PageType.NEWSLETTER,
  );
  assert.equal(detectPageType("https://author.test/blog"), PageType.BLOG);
  assert.equal(
    detectPageType("https://author.test/press-kit"),
    PageType.MEDIA_KIT,
  );
  assert.equal(detectPageType("https://author.test/events"), PageType.EVENTS);
  assert.equal(detectPageType("https://author.test/random"), PageType.UNKNOWN);
});

test("extractPageData extracts author page signals", () => {
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>Jane Writer | Fantasy Author</title>
        <meta name="description" content="Fantasy books and updates from Jane Writer.">
        <meta name="robots" content="index,follow">
        <link rel="canonical" href="https://author.test/">
        <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"Person","name":"Jane Writer"}
        </script>
      </head>
      <body>
        <h1>Jane Writer</h1>
        <h2>Books</h2>
        <h3>The Moonlit Door</h3>
        <p>Jane writes cozy fantasy novels for curious readers.</p>
        <a href="/books">View Books</a>
        <a href="https://bookshop.org/shop/jane">Buy the book</a>
        <a href="https://instagram.com/janewriter">Instagram</a>
        <a href="mailto:jane@author.test">Email Jane</a>
        <a href="/newsletter">Subscribe for updates</a>
        <img src="/jane.jpg" alt="Jane Writer author portrait" width="800" height="600">
        <form action="/subscribe" method="post">
          <label for="email">Email address</label>
          <input id="email" name="email" type="email" required>
          <button>Join newsletter</button>
        </form>
      </body>
    </html>
  `;

  const page = extractPageData(html, "https://author.test/");

  assert.equal(page.title, "Jane Writer | Fantasy Author");
  assert.equal(
    page.metaDescription,
    "Fantasy books and updates from Jane Writer.",
  );
  assert.equal(page.h1, "Jane Writer");
  assert.equal(page.h1Count, 1);
  assert.deepEqual(page.headings.h2, ["Books"]);
  assert.deepEqual(page.headings.h3, ["The Moonlit Door"]);
  assert.equal(page.links.internal.length, 2);
  assert.equal(page.links.retailerLinks.length, 1);
  assert.equal(page.links.socialProfiles.length, 1);
  assert.deepEqual(page.links.emails, ["jane@author.test"]);
  assert.equal(page.links.ctas.length, 3);
  assert.equal(page.images[0].alt, "Jane Writer author portrait");
  assert.equal(page.forms[0].fields[0].label, "Email address");
  assert.equal(page.forms[0].fields[0].required, true);
  assert.equal(page.jsonLd.length, 1);
  assert.equal(page.seo.canonicalUrl, "https://author.test/");
  assert.equal(page.seo.robots, "index,follow");
  assert.ok(page.wordCount > 10);
});

test("extractPageData extracts images, forms, and links with normalized URLs", () => {
  const page = extractPageData(
    `
      <!doctype html>
      <html>
        <head>
          <title>Books by Jane Writer</title>
          <meta name="description" content="Books, newsletter, and reader updates.">
        </head>
        <body>
          <h1>Books by Jane Writer</h1>
          <a href="/books">Books</a>
          <a href="https://retailer.example/book">Buy now</a>
          <img src="/cover.jpg" alt="The Moonlit Door book cover">
          <form action="/signup" method="post">
            <input name="email" type="email">
            <button>Subscribe</button>
          </form>
        </body>
      </html>
    `,
    "https://author.test/books",
  );

  assert.equal(page.title, "Books by Jane Writer");
  assert.equal(page.metaDescription, "Books, newsletter, and reader updates.");
  assert.equal(page.h1, "Books by Jane Writer");
  assert.equal(page.images[0].src, "https://author.test/cover.jpg");
  assert.equal(page.forms[0].action, "https://author.test/signup");
  assert.equal(page.links.internal[0].href, "https://author.test/books");
  assert.equal(page.links.external[0].href, "https://retailer.example/book");
});

test("prioritizeCrawlUrls keeps homepage first and limits important pages", () => {
  const urls = prioritizeCrawlUrls({
    homepageUrl: "https://author.test/",
    sitemapUrls: [
      "https://author.test/privacy",
      "https://author.test/books",
      "https://author.test/contact",
    ],
    homepageInternalLinks: [
      "https://author.test/blog",
      "https://author.test/newsletter",
      "https://external.test/about",
    ],
    limit: 5,
  });

  assert.deepEqual(urls, [
    "https://author.test/",
    "https://author.test/books",
    "https://author.test/newsletter",
    "https://author.test/contact",
    "https://author.test/blog",
  ]);
});

test("prioritizeCrawlUrls normalizes tracking links and leaves /home behind useful pages", () => {
  const urls = prioritizeCrawlUrls({
    homepageUrl: "https://author.test/?utm_source=campaign",
    sitemapUrls: [
      "https://author.test/books/?utm_medium=email",
      "https://author.test/books",
      "https://author.test/home",
      "https://author.test/about",
    ],
  });

  assert.deepEqual(urls, [
    "https://author.test/",
    "https://author.test/books",
    "https://author.test/about",
    "https://author.test/home",
  ]);
  assert.equal(
    normalizeCandidateUrl(
      "https://author.test/books/?utm_source=x#buy",
      "https://author.test/",
    ),
    "https://author.test/books",
  );
});

test("getCrawlContentFingerprint identifies exact page-content duplicates", () => {
  const bodyText = "A".repeat(120);

  assert.equal(
    getCrawlContentFingerprint({
      title: "Jane Writer",
      h1: "Welcome",
      bodyText,
    }),
    getCrawlContentFingerprint({
      title: " JANE WRITER ",
      h1: "Welcome",
      bodyText: `  ${bodyText}  `,
    }),
  );
  assert.equal(
    getCrawlContentFingerprint({ title: "Short", bodyText: "Short page" }),
    null,
  );
});

test("extractPageData captures embedded newsletter providers", () => {
  const page = extractPageData(
    `
      <!doctype html>
      <html>
        <body>
          <h1>Reader newsletter</h1>
          <iframe
            src="https://janewriter.substack.com/embed"
            title="Subscribe to Jane Writer's newsletter"
          ></iframe>
        </body>
      </html>
    `,
    "https://author.test/newsletter",
  );

  assert.ok(
    page.links.external.some(
      (link) => link.href === "https://janewriter.substack.com/embed",
    ),
  );
});
