import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyPageRole,
  pageSupportsRole,
} from "@/lib/signals/page-role-classifier";

test("classifies custom author page slugs from prominent content", () => {
  const result = classifyPageRole({
    url: "https://author.test/meet-jane",
    declaredPageType: "UNKNOWN",
    title: "Meet Jane Writer",
    h1: "Meet Jane Writer",
    bodyText: "Jane writes historical mysteries for curious readers.",
  });

  assert.equal(result.primaryRole, "ABOUT");
  assert.equal(result.confidence, "medium");
  assert.ok(
    result.observations.some(
      (observation) =>
        observation.sourceUrl === "https://author.test/meet-jane" &&
        observation.sourceKind === "text",
    ),
  );
});

test("classifies a newsletter page with a generic submit button", () => {
  const result = classifyPageRole({
    url: "https://author.test/readers",
    declaredPageType: "UNKNOWN",
    h1: "Reader Newsletter",
    forms: [
      {
        action: "/join",
        fields: [{ type: "email", name: "email" }],
        buttons: ["Submit"],
      },
    ],
  });

  assert.equal(result.primaryRole, "NEWSLETTER");
  assert.ok(
    result.observations.some(
      (observation) => observation.sourceKind === "form",
    ),
  );
});

test("uses structured data and purchase evidence for book detail pages", () => {
  const result = classifyPageRole({
    url: "https://author.test/the-moonlit-door",
    h1: "The Moonlit Door",
    links: [
      {
        href: "https://bookshop.org/p/books/the-moonlit-door/123",
        text: "Order the book",
      },
    ],
    jsonLd: [{ "@context": "https://schema.org", "@type": "Book" }],
  });

  assert.equal(result.primaryRole, "BOOK_DETAIL");
  assert.ok(
    result.observations.some(
      (observation) => observation.sourceKind === "jsonld",
    ),
  );
});

test("recognizes series evidence without requiring a series URL", () => {
  const result = classifyPageRole({
    url: "https://author.test/the-raven-cycle",
    h1: "The Raven Cycle",
    bodyText: "Start with Book 1, then continue the story in Book 2.",
  });

  assert.equal(result.primaryRole, "SERIES");
});

test("does not let footer links override the home page role", () => {
  const result = classifyPageRole({
    url: "https://author.test/",
    title: "Jane Writer",
    h1: "Stories of mystery and wonder",
    links: [
      { href: "/privacy", text: "Privacy Policy" },
      { href: "/newsletter", text: "Newsletter" },
      { href: "/books", text: "Books" },
    ],
  });

  assert.equal(result.primaryRole, "HOME");
  assert.equal(pageSupportsRole(result, "PRIVACY"), false);
});

test("does not let a repeated footer signup override semantic page roles", () => {
  const footerSignup = {
    action: "/subscribe",
    scope: "footer" as const,
    fields: [{ type: "email", name: "email" }],
    buttons: ["Join the newsletter"],
  };

  for (const [path, declaredPageType, expectedRole] of [
    ["/about", "ABOUT", "ABOUT"],
    ["/books", "BOOKS", "BOOKS_INDEX"],
    ["/contact", "CONTACT", "CONTACT"],
    ["/events", "EVENTS", "EVENTS"],
  ] as const) {
    const result = classifyPageRole({
      url: `https://author.test${path}`,
      declaredPageType,
      h1: expectedRole.replace("_", " "),
      forms: [footerSignup],
    });

    assert.equal(result.primaryRole, expectedRole);
    assert.ok(
      result.candidates.some(
        (candidate) =>
          candidate.role === "NEWSLETTER" && candidate.points === 1,
      ),
    );
  }
});

test("does not treat narrative text about a character as an author bio", () => {
  const result = classifyPageRole({
    url: "https://author.test/blood-orange",
    title: "Blood Orange — Jane Writer",
    h1: "Blood Orange",
    headings: [
      "Order Blood Orange",
      "Something about her story is deeply amiss.",
    ],
    links: [
      {
        href: "https://bookshop.org/p/books/blood-orange/123",
        text: "Order Blood Orange",
      },
    ],
  });

  assert.equal(result.primaryRole, "BOOK_DETAIL");
  assert.equal(
    result.candidates.some((candidate) => candidate.role === "ABOUT"),
    false,
  );
});

test("classifies a custom book slug when its purchase link names the H1", () => {
  const result = classifyPageRole({
    url: "https://author.test/a-lesson-in-cruelty",
    title: "A Lesson in Cruelty — Jane Writer",
    h1: "A Lesson in Cruelty",
    links: [
      {
        href: "https://retailer.test/a-lesson-in-cruelty",
        text: "Order A Lesson in Cruelty",
      },
    ],
  });

  assert.equal(result.primaryRole, "BOOK_DETAIL");
});

test("does not promote a footer email form on a privacy page", () => {
  const result = classifyPageRole({
    url: "https://author.test/privacy-policy",
    title: "Privacy Policy — Jane Writer",
    h1: "Privacy Policy",
    headings: ["Newsletter or blog", "How is the information used?"],
    forms: [
      {
        scope: "footer",
        fields: [{ type: "email", name: "email" }],
        buttons: ["Sign Up"],
      },
    ],
  });

  assert.equal(result.primaryRole, "PRIVACY");
});

test("does not classify an unrelated page from contact wording in repeated page chrome", () => {
  const result = classifyPageRole({
    url: "https://author.test/videos.html",
    title: "Videos | Casey Rowan",
    h1: "Videos",
    headings: [
      "For rights inquiries, contact the agency. Read the privacy policy. Contact Casey.",
    ],
  });

  assert.equal(result.primaryRole, "UNKNOWN");
  assert.equal(
    result.candidates.some((candidate) => candidate.role === "CONTACT"),
    false,
  );
});

test("classifies What's New with multiple purchase destinations as a books index", () => {
  const result = classifyPageRole({
    url: "https://author.test/whats-new.html",
    title: "What's New | Casey Rowan",
    h1: "What's New",
    headings: ["Harbor Lights", "Summer Skies"],
    links: [
      {
        href: "https://www.amazon.com/dp/0000000001",
        text: "Buy Harbor Lights",
      },
      {
        href: "https://www.amazon.com/dp/0000000002",
        text: "Buy Summer Skies",
      },
    ],
  });

  assert.equal(result.primaryRole, "BOOKS_INDEX");
  assert.ok(
    result.observations.some(
      (observation) => observation.pageRole === "BOOKS_INDEX",
    ),
  );
});

test("keeps ambiguous pages unknown instead of guessing", () => {
  const result = classifyPageRole({
    url: "https://author.test/a-short-note",
    h1: "A Short Note",
    bodyText: "I finished a book last weekend and enjoyed it.",
  });

  assert.equal(result.primaryRole, "UNKNOWN");
  assert.equal(result.observations.length, 0);
});
