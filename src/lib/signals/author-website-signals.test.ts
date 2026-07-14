import assert from "node:assert/strict";
import test from "node:test";

import { extractPageData, type ExtractedPageData } from "@/lib/crawler/extract";
import {
  detectAuthorWebsiteSignals,
  type ScannedPageSignalInput,
} from "@/lib/signals/author-website-signals";

function pageInput(page: ExtractedPageData): ScannedPageSignalInput {
  return {
    url: page.url,
    pageType: page.pageType,
    statusCode: 200,
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

test("detectAuthorWebsiteSignals finds author, book, newsletter, trust, retailer, and schema signals", () => {
  const homepage = extractPageData(
    `
      <!doctype html>
      <html>
        <head>
          <title>Jane Writer | Fantasy Author</title>
          <meta name="description" content="Fantasy books, a free chapter, and book news from Jane Writer.">
          <meta name="robots" content="index,follow">
          <link rel="canonical" href="https://author.test/">
          <script type="application/ld+json">
            {
              "@context":"https://schema.org",
              "@type":"Person",
              "name":"Jane Writer",
              "sameAs":["https://instagram.com/janewriter"]
            }
          </script>
          <script type="application/ld+json">
            {
              "@context":"https://schema.org",
              "@type":"Book",
              "name":"The Moonlit Door",
              "aggregateRating":{"@type":"AggregateRating","ratingValue":"4.8"}
            }
          </script>
          <script type="application/ld+json">
            [
              {"@context":"https://schema.org","@type":"Organization","name":"Jane Writer Books"},
              {"@context":"https://schema.org","@type":"Review","reviewBody":"A warm, memorable fantasy read."}
            ]
          </script>
        </head>
        <body>
          <h1>Jane Writer, Fantasy Author</h1>
          <h2>Featured Book</h2>
          <h3>The Moonlit Door</h3>
          <p>About the book: a cozy fantasy novel with praise from readers.</p>
          <p>Join the newsletter for a free chapter, bonus scene, free book, and release updates.</p>
          <a href="/about">Meet the author</a>
          <a href="/media-kit">Media kit</a>
          <a href="/privacy">Privacy policy</a>
          <a href="https://amazon.com/dp/example">Buy on Amazon Kindle</a>
          <a href="https://bookshop.org/shop/jane">Buy on Bookshop</a>
          <a href="https://goodreads.com/author/show/123">Goodreads</a>
          <a href="https://instagram.com/janewriter">Instagram</a>
          <a href="mailto:jane@author.test">Email Jane</a>
          <img src="/moonlit-door-cover.jpg" alt="The Moonlit Door book cover">
          <img src="/jane-headshot.jpg" alt="Jane Writer author photo">
          <form action="/newsletter" method="post">
            <label for="email">Email address</label>
            <input id="email" name="email" type="email">
            <button>Subscribe for updates</button>
          </form>
        </body>
      </html>
    `,
    "https://author.test/",
  );
  const contact = extractPageData(
    `
      <!doctype html>
      <html>
        <head><title>Contact Jane Writer</title></head>
        <body>
          <h1>Contact Jane</h1>
          <form action="/contact" method="post">
            <input name="email" type="email">
            <textarea name="message"></textarea>
            <button>Contact</button>
          </form>
        </body>
      </html>
    `,
    "https://author.test/contact",
  );

  const signals = detectAuthorWebsiteSignals([
    pageInput(homepage),
    pageInput(contact),
  ]);

  assert.equal(signals.pagesAnalyzed, 2);
  assert.equal(signals.authorBrand.authorNameVisible.detected, true);
  assert.equal(signals.authorBrand.genreOrCategoryMentioned.detected, true);
  assert.equal(signals.authorBrand.clearHomepageHeadline.detected, true);
  assert.equal(signals.authorBrand.aboutSectionOrPage.detected, true);
  assert.equal(signals.bookPromotion.bookCoverImages.detected, true);
  assert.equal(signals.bookPromotion.bookTitles.detected, true);
  assert.equal(signals.bookPromotion.bookDescriptionOrBlurb.detected, true);
  assert.equal(signals.bookPromotion.buyLinks.detected, true);
  assert.equal(signals.bookPromotion.retailerLinks.detected, true);
  assert.equal(signals.bookPromotion.featuredBookSection.detected, true);
  assert.equal(signals.bookPromotion.reviewsOrPraise.detected, true);
  assert.equal(signals.newsletter.newsletterSignupForm.detected, true);
  assert.equal(signals.newsletter.emailInput.detected, true);
  assert.equal(signals.newsletter.freeChapter.detected, true);
  assert.equal(signals.newsletter.bonusScene.detected, true);
  assert.equal(signals.newsletter.freeBook.detected, true);
  assert.equal(signals.newsletter.updatesSignup.detected, true);
  assert.equal(signals.seo.titleTagExists.detected, true);
  assert.equal(signals.seo.metaDescriptionExists.detected, true);
  assert.equal(signals.seo.h1Exists.detected, true);
  assert.equal(signals.seo.indexabilitySignals.detected, true);
  assert.equal(signals.seo.indexabilitySignals.indexable, true);
  assert.equal(signals.seo.canonicalUrl.detected, true);
  assert.equal(signals.trust.authorBio.detected, true);
  assert.equal(signals.trust.authorPhoto.detected, true);
  assert.equal(signals.trust.contactForm.detected, true);
  assert.equal(signals.trust.contactEmail.detected, true);
  assert.equal(signals.trust.socialLinks.detected, true);
  assert.equal(signals.trust.mediaKit.detected, true);
  assert.equal(signals.trust.privacyPolicy.detected, true);
  assert.equal(signals.retailers.amazon.detected, true);
  assert.equal(signals.retailers.kindle.detected, true);
  assert.equal(signals.retailers.bookshop.detected, true);
  assert.equal(signals.retailers.goodreads.detected, true);
  assert.equal(signals.schema.person.detected, true);
  assert.equal(signals.schema.book.detected, true);
  assert.equal(signals.schema.organization.detected, true);
  assert.equal(signals.schema.review.detected, true);
  assert.equal(signals.schema.aggregateRating.detected, true);
  assert.equal(signals.schema.sameAs.detected, true);
});

test("detectAuthorWebsiteSignals reports only supported SEO issues from sparse scan data", () => {
  const sparsePage = extractPageData(
    `
      <!doctype html>
      <html>
        <head>
          <meta name="robots" content="noindex,nofollow">
        </head>
        <body>
          <h1>Welcome</h1>
          <h1>Another headline</h1>
          <img src="/cover.jpg">
          <a href="javascript:alert('x')">Bad link</a>
        </body>
      </html>
    `,
    "https://author.test/",
  );

  const signals = detectAuthorWebsiteSignals([pageInput(sparsePage)]);

  assert.equal(signals.authorBrand.genreOrCategoryMentioned.detected, false);
  assert.equal(signals.bookPromotion.bookCoverImages.detected, false);
  assert.equal(signals.bookPromotion.retailerLinks.detected, false);
  assert.equal(signals.newsletter.newsletterSignupForm.detected, false);
  assert.equal(signals.seo.titleTagExists.detected, false);
  assert.equal(signals.seo.metaDescriptionExists.detected, false);
  assert.equal(signals.seo.h1Exists.detected, true);
  assert.equal(signals.seo.multipleH1Issue.detected, true);
  assert.equal(signals.seo.missingAltText.detected, true);
  assert.equal(signals.seo.indexabilitySignals.detected, true);
  assert.equal(signals.seo.indexabilitySignals.indexable, false);
  assert.equal(signals.trust.contactEmail.detected, false);
});

test("detectAuthorWebsiteSignals finds uppercase author names and homepage book titles", () => {
  const homepage = extractPageData(
    `
      <!doctype html>
      <html>
        <head>
          <title>BETH O'LEARY</title>
          <meta name="description" content="The official website of bestselling author Beth O'Leary.">
        </head>
        <body>
          <h1>Swept Away</h1>
          <p>
            I'm Beth, Sunday Times bestselling author of The Flatshare, The Switch,
            The Road Trip, The No-Show, The Wake-Up Call and Swept Away.
          </p>
          <p>About the book: two strangers are stranded at sea in this new novel.</p>
          <a href="https://bookshop.org/p/books/swept-away">Buy Swept Away</a>
          <img src="/images/swept-away.jpg" alt="">
        </body>
      </html>
    `,
    "https://beth.test/",
  );

  const signals = detectAuthorWebsiteSignals([pageInput(homepage)]);

  assert.equal(signals.authorBrand.authorNameVisible.detected, true);
  assert.match(
    signals.authorBrand.authorNameVisible.evidence.join(" "),
    /BETH O'LEARY/i,
  );
  assert.equal(signals.bookPromotion.bookTitles.detected, true);
  assert.match(
    signals.bookPromotion.bookTitles.evidence.join(" "),
    /Swept Away/i,
  );
  assert.equal(signals.bookPromotion.bookCoverImages.detected, true);
});

test("detectAuthorWebsiteSignals recognizes externally hosted newsletter signup links", () => {
  const homepage = extractPageData(
    `
      <!doctype html>
      <html>
        <head><title>Jane Writer</title></head>
        <body>
          <h1>Jane Writer</h1>
          <a href="https://janewriter.substack.com/subscribe">Join my reader list</a>
        </body>
      </html>
    `,
    "https://author.test/",
  );

  const signals = detectAuthorWebsiteSignals([pageInput(homepage)]);

  assert.equal(signals.newsletter.newsletterSignupForm.detected, true);
  assert.equal(signals.newsletter.subscribeForm.detected, true);
});

test("detectAuthorWebsiteSignals does not treat a YouTube subscription as a newsletter", () => {
  const homepage = extractPageData(
    `
      <!doctype html>
      <html>
        <head><title>Jane Writer</title></head>
        <body>
          <h1>Jane Writer</h1>
          <a href="https://www.youtube.com/@janewriter?sub_confirmation=1">Subscribe on YouTube</a>
        </body>
      </html>
    `,
    "https://author.test/",
  );

  const signals = detectAuthorWebsiteSignals([pageInput(homepage)]);

  assert.equal(signals.newsletter.newsletterSignupForm.detected, false);
  assert.equal(signals.newsletter.subscribeForm.detected, false);
  assert.equal(signals.trust.socialLinks.detected, true);
});

test("detectAuthorWebsiteSignals does not treat event ticket sales as book purchase links", () => {
  const events = extractPageData(
    `
      <!doctype html>
      <html>
        <head><title>Jane Writer Events</title></head>
        <body>
          <h1>Upcoming Events</h1>
          <p>Join Jane for a live writing workshop.</p>
          <a href="/events/coastal-workshop/tickets">Buy tickets</a>
        </body>
      </html>
    `,
    "https://author.test/events",
  );

  const signals = detectAuthorWebsiteSignals([pageInput(events)]);

  assert.equal(signals.bookPromotion.buyLinks.detected, false);
  assert.equal(signals.bookPromotion.bookTitles.detected, false);
});

test("detectAuthorWebsiteSignals accepts legacy seed-style scanned page JSON", () => {
  const signals = detectAuthorWebsiteSignals([
    {
      url: "https://sample-author.test",
      pageType: "HOME",
      statusCode: 200,
      title: "Sample Author | Historical Fiction Author",
      metaDescription: "Books and updates from Sample Author.",
      h1: "Sample Author",
      headingsJson: ["Latest book", "Praise"],
      linksJson: [
        { href: "https://kobo.com/book/sample", text: "Buy on Kobo" },
        { href: "https://publisher.example/sample", text: "Publisher" },
      ],
      imagesJson: [{ src: "/book-cover.jpg", alt: "Sample book cover" }],
      formsJson: [{ fields: ["email"], buttons: ["Join newsletter"] }],
      contentText:
        "Historical fiction author. Read the latest book and join the newsletter for updates.",
    },
  ]);

  assert.equal(signals.authorBrand.authorNameVisible.detected, true);
  assert.equal(signals.authorBrand.genreOrCategoryMentioned.detected, true);
  assert.equal(signals.bookPromotion.bookCoverImages.detected, true);
  assert.equal(signals.bookPromotion.buyLinks.detected, true);
  assert.equal(signals.newsletter.subscribeForm.detected, true);
  assert.equal(signals.newsletter.emailInput.detected, true);
  assert.equal(signals.retailers.kobo.detected, true);
  assert.equal(signals.retailers.publisherWebsites.detected, true);
});

test("detectAuthorWebsiteSignals uses content-derived roles for custom page slugs", () => {
  const pages = [
    extractPageData(
      `<html><head><title>Meet Jane Writer</title></head><body><h1>Meet Jane Writer</h1><p>Jane writes historical mysteries.</p></body></html>`,
      "https://author.test/meet-jane",
    ),
    extractPageData(
      `<html><head><title>Reader Newsletter</title></head><body><h1>Reader Newsletter</h1><form action="/join"><label>Email <input type="email" name="email"></label><button>Submit</button></form></body></html>`,
      "https://author.test/readers",
    ),
    extractPageData(
      `<html><head><title>Get in Touch</title></head><body><h1>Get in Touch</h1><form action="/send"><label>Message <textarea name="message"></textarea></label><button>Send</button></form></body></html>`,
      "https://author.test/hello",
    ),
    extractPageData(
      `<html><head><title>Media Kit</title></head><body><h1>Media Kit</h1><p>Author photos and publicity resources.</p></body></html>`,
      "https://author.test/resources",
    ),
    extractPageData(
      `<html><head><title>Privacy Policy</title></head><body><h1>Privacy Policy</h1><p>How reader information is handled.</p></body></html>`,
      "https://author.test/legal",
    ),
  ];

  const signals = detectAuthorWebsiteSignals(pages.map(pageInput));

  assert.equal(signals.authorBrand.aboutSectionOrPage.detected, true);
  assert.equal(signals.trust.authorBio.detected, true);
  assert.equal(signals.newsletter.newsletterSignupForm.detected, true);
  assert.equal(signals.trust.contactForm.detected, true);
  assert.equal(signals.trust.mediaKit.detected, true);
  assert.equal(signals.trust.privacyPolicy.detected, true);
  assert.ok(
    signals.observations?.some(
      (observation) =>
        observation.pageRole === "NEWSLETTER" &&
        observation.sourceUrl === "https://author.test/readers",
    ),
  );
});

test("detectAuthorWebsiteSignals does not treat failed page URLs as evidence", () => {
  const signals = detectAuthorWebsiteSignals([
    {
      url: "https://author.test/",
      pageType: "HOME",
      statusCode: 200,
      title: "Jane Writer",
      h1: "Jane Writer",
    },
    {
      url: "https://author.test/about",
      pageType: "ABOUT",
      statusCode: 404,
      title: null,
      h1: null,
    },
    {
      url: "https://author.test/contact",
      pageType: "CONTACT",
      statusCode: 500,
      title: null,
      h1: null,
    },
  ]);

  assert.equal(signals.pagesAnalyzed, 1);
  assert.equal(signals.authorBrand.aboutSectionOrPage.detected, false);
  assert.equal(signals.trust.authorBio.detected, false);
  assert.equal(signals.trust.contactForm.detected, false);
  assert.equal(
    signals.pageRoles?.some(({ sourceUrl }) => sourceUrl.endsWith("/about")),
    false,
  );
});
