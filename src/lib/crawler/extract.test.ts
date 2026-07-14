import assert from "node:assert/strict";
import test from "node:test";

import { PageType } from "@/generated/prisma/client";
import { extractPageData, detectPageType } from "@/lib/crawler/extract";
import {
  getCrawlContentFingerprint,
  normalizeCandidateUrl,
  parseRobotsSitemapUrls,
  prioritizeCrawlUrls,
} from "@/lib/crawler/prioritize";

test("detectPageType maps author website paths", () => {
  assert.equal(detectPageType("https://author.test/"), PageType.HOME);
  assert.equal(detectPageType("https://author.test/about-me"), PageType.ABOUT);
  assert.equal(
    detectPageType("https://author.test/about-the-author/"),
    PageType.ABOUT,
  );
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
  assert.equal(
    detectPageType("https://author.test/the-evermen-saga/"),
    PageType.BOOKS,
  );
  assert.equal(
    detectPageType("https://author.test/the-firewall-trilogy/"),
    PageType.BOOKS,
  );
  assert.equal(
    detectPageType("https://author.test/the-evermen-saga-map/"),
    PageType.UNKNOWN,
  );
  assert.equal(detectPageType("https://author.test/contact"), PageType.CONTACT);
  assert.equal(
    detectPageType("https://author.test/contact-us/"),
    PageType.CONTACT,
  );
  assert.equal(
    detectPageType("https://author.test/contact.html"),
    PageType.CONTACT,
  );
  assert.equal(
    detectPageType("https://author.test/about.html"),
    PageType.ABOUT,
  );
  assert.equal(
    detectPageType("https://author.test/newsletter"),
    PageType.NEWSLETTER,
  );
  assert.equal(
    detectPageType("https://author.test/sign-up/"),
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
  assert.equal(page.forms[0].scope, "main");
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

test("extractPageData decodes valid Cloudflare-protected email evidence", () => {
  const page = extractPageData(
    `
      <a href="/cdn-cgi/l/email-protection#127a777e7e7d52607b64776063677b7e7e3c66776166">
        <span
          class="__cf_email__"
          data-cfemail="127a777e7e7d52607b64776063677b7e7e3c66776166"
        >[email protected]</span>
      </a>
    `,
    "https://author.test/contact",
  );

  assert.deepEqual(page.links.emails, ["hello@riverquill.test"]);
  assert.deepEqual(page.links.internal, []);
});

test("extractPageData decodes Cloudflare email fragments when no data attribute exists", () => {
  const page = extractPageData(
    `<a href="/cdn-cgi/l/email-protection#1277767b667d60527367667a7d603c66776166">Protected email</a>`,
    "https://author.test/contact",
  );

  assert.deepEqual(page.links.emails, ["editor@author.test"]);
  assert.deepEqual(page.links.internal, []);
});

test("extractPageData prefers Cloudflare data attributes over href fragments", () => {
  const page = extractPageData(
    `
      <a href="/cdn-cgi/l/email-protection#1277767b667d60527367667a7d603c66776166">
        <span data-cfemail="127a777e7e7d52607b64776063677b7e7e3c66776166">Protected email</span>
      </a>
    `,
    "https://author.test/contact",
  );

  assert.deepEqual(page.links.emails, ["hello@riverquill.test"]);
});

test("extractPageData ignores malformed and non-email Cloudflare values", () => {
  const page = extractPageData(
    `
      <span data-cfemail="123">odd length</span>
      <span data-cfemail="12not-hex">not hex</span>
      <span data-cfemail="127c7d66527f735b7e">not an email</span>
      <a href="/cdn-cgi/l/email-protection#123">malformed protection URL</a>
    `,
    "https://author.test/contact",
  );

  assert.deepEqual(page.links.emails, []);
});

test("extractPageData separates main headings and forms from repeated page chrome", () => {
  const page = extractPageData(
    `
      <main>
        <h2>About Jane</h2>
      </main>
      <footer>
        <h2>Join my newsletter</h2>
        <form action="/subscribe">
          <input type="email" name="email">
          <button>Subscribe</button>
        </form>
      </footer>
    `,
    "https://author.test/about",
  );

  assert.deepEqual(page.headings.h2, ["About Jane"]);
  assert.equal(page.forms[0].scope, "footer");
});

test("extractPageData recognizes lazy, srcset, and picture image sources", () => {
  const page = extractPageData(
    `
      <html>
        <body>
          <img data-src="/lazy-cover.jpg" alt="Lazy book cover">
          <img
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
            srcset="/cover-small.jpg 400w, /cover-large.jpg 1200w"
            alt="Responsive book cover"
          >
          <picture>
            <source srcset="/cover.webp 1x, /cover@2x.webp 2x" type="image/webp">
            <img src="/cover-fallback.jpg" alt="Picture book cover">
          </picture>
        </body>
      </html>
    `,
    "https://author.test/books",
  );

  assert.equal(page.images.length, 3);
  assert.deepEqual(
    page.images.map((image) => [image.src, image.sourceAttribute]),
    [
      ["https://author.test/lazy-cover.jpg", "data-src"],
      ["https://author.test/cover-large.jpg", "srcset"],
      ["https://author.test/cover@2x.webp", "picture-source"],
    ],
  );
  assert.deepEqual(page.images[1].candidateSources, [
    "https://author.test/cover-large.jpg",
    "https://author.test/cover-small.jpg",
  ]);
  assert.ok(
    page.images[2].candidateSources.includes(
      "https://author.test/cover-fallback.jpg",
    ),
  );
});

test("extractPageData caps persisted responsive image candidates", () => {
  const candidates = Array.from(
    { length: 15 },
    (_, index) => `/cover-${index + 1}.jpg ${(index + 1) * 100}w`,
  ).join(", ");
  const page = extractPageData(
    `<img srcset="${candidates}" alt="The book cover">`,
    "https://author.test/books",
  );

  assert.equal(page.images[0].candidateSources.length, 12);
  assert.equal(page.images[0].src, "https://author.test/cover-15.jpg");
  assert.equal(
    page.images[0].candidateSources.at(-1),
    "https://author.test/cover-4.jpg",
  );
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
    "https://author.test/privacy",
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
    "https://author.test/about",
    "https://author.test/books",
    "https://author.test/books/",
    "https://author.test/home",
  ]);
  assert.equal(
    normalizeCandidateUrl(
      "https://author.test/books/?utm_source=x#buy",
      "https://author.test/",
    ),
    "https://author.test/books/",
  );
});

test("prioritizeCrawlUrls ranks author and series slugs before generic pages", () => {
  const urls = prioritizeCrawlUrls({
    homepageUrl: "https://author.test/",
    homepageInternalLinks: [
      "https://author.test/golden-age/",
      "https://author.test/the-evermen-saga/",
      "https://author.test/download-now/",
      "https://author.test/contact/",
      "https://author.test/about-the-author/",
      "https://author.test/sign-up/",
    ],
  });

  assert.deepEqual(urls, [
    "https://author.test/",
    "https://author.test/about-the-author/",
    "https://author.test/the-evermen-saga/",
    "https://author.test/sign-up/",
    "https://author.test/contact/",
    "https://author.test/golden-age/",
    "https://author.test/download-now/",
  ]);
});

test("prioritizeCrawlUrls keeps event archive entries behind core pages", () => {
  const eventEntries = Array.from(
    { length: 20 },
    (_, index) => `https://author.test/events/past-event-${index + 1}`,
  );
  const urls = prioritizeCrawlUrls({
    homepageUrl: "https://author.test/",
    sitemapUrls: [
      ...eventEntries,
      "https://author.test/events",
      "https://author.test/privacy-notice",
      "https://author.test/contact",
      "https://author.test/about",
      "https://author.test/books",
      "https://author.test/newsletter",
      "https://author.test/blog",
    ],
    limit: 10,
  });

  assert.deepEqual(urls.slice(0, 8), [
    "https://author.test/",
    "https://author.test/about",
    "https://author.test/books",
    "https://author.test/newsletter",
    "https://author.test/contact",
    "https://author.test/privacy-notice",
    "https://author.test/events",
    "https://author.test/blog",
  ]);
  assert.equal(urls.filter((url) => url.includes("/events/")).length, 2);
});

test("prioritizeCrawlUrls keeps legacy contact and privacy routes ahead of nested book pages", () => {
  const nestedBookPages = Array.from(
    { length: 12 },
    (_, index) => `https://author.test/books/title-${index + 1}/`,
  );
  const urls = prioritizeCrawlUrls({
    homepageUrl: "https://author.test/",
    homepageInternalLinks: [
      ...nestedBookPages,
      "https://author.test/contact-us/",
      "https://author.test/privacy--disclosure.html",
    ],
    limit: 10,
  });

  assert.equal(urls.includes("https://author.test/contact-us/"), true);
  assert.equal(
    urls.includes("https://author.test/privacy--disclosure.html"),
    true,
  );
  assert.equal(urls.includes("https://author.test/books/title-12/"), false);
});

test("parseRobotsSitemapUrls discovers absolute and relative Sitemap directives", () => {
  assert.deepEqual(
    parseRobotsSitemapUrls(
      `
        User-agent: *
        Disallow:
        Sitemap: https://author.test/sitemap_index.xml
        sitemap: /news-sitemap.xml
        Sitemap: ftp://author.test/ignored.xml
      `,
      "https://author.test/robots.txt",
    ),
    [
      "https://author.test/sitemap_index.xml",
      "https://author.test/news-sitemap.xml",
    ],
  );
});

test("homepage menu and footer links become same-host crawl candidates", () => {
  const homepage = extractPageData(
    `
      <!doctype html>
      <html>
        <body>
          <nav>
            <a href="/books">Books</a>
            <div class="dropdown">
              <a href="/series/evermen">The Evermen Saga</a>
              <a href="/books/enchantress">Enchantress</a>
            </div>
            <a href="/about">About</a>
          </nav>
          <footer>
            <a href="/contact">Contact</a>
            <a href="/books/enchantress">Enchantress</a>
            <a href="https://shop.example/book">Buy</a>
          </footer>
        </body>
      </html>
    `,
    "https://author.test/",
  );
  const candidates = prioritizeCrawlUrls({
    homepageUrl: homepage.url,
    homepageInternalLinks: homepage.links.internal.map((link) => link.href),
    limit: 10,
  });

  assert.deepEqual(new Set(candidates), new Set([
    "https://author.test/",
    "https://author.test/books",
    "https://author.test/series/evermen",
    "https://author.test/books/enchantress",
    "https://author.test/about",
    "https://author.test/contact",
  ]));
  assert.equal(candidates.includes("https://shop.example/book"), false);
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
