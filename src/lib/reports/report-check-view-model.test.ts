import assert from "node:assert/strict";
import test from "node:test";

import { ReportCategory } from "@/generated/prisma/client";
import { reportCategoryOrder } from "@/lib/reports/category-display";
import { buildReportAuditSections } from "@/lib/reports/report-check-view-model";
import { SCORING_CHECK_REGISTRY } from "@/lib/scoring/check-registry";

const siteUrl = "https://author.example";

test("builds every registered check in the established category order", () => {
  const sections = buildReportAuditSections({
    checkResults: [],
    scores: [],
    siteUrl,
  });

  assert.deepEqual(
    sections.map((section) => section.category),
    reportCategoryOrder,
  );
  assert.equal(
    sections.reduce((total, section) => total + section.checks.length, 0),
    SCORING_CHECK_REGISTRY.length,
  );
  assert.equal(sections.length, 8);
});

test("maps the three deterministic states to canonical report content", () => {
  const sections = buildReportAuditSections({
    checkResults: [
      {
        checkId: "brand.author_name",
        state: "PASSED",
        reasonCode: "author_name_visible",
        evidenceReferences: {},
      },
      {
        checkId: "brand.genre_positioning",
        state: "FAILED",
        reasonCode: "genre_missing",
        evidenceReferences: {},
      },
      {
        checkId: "brand.homepage_headline",
        state: "NEEDS_REVIEW",
        reasonCode: "evidence_coverage_insufficient",
        evidenceReferences: {},
      },
    ],
    scores: [
      {
        category: ReportCategory.BRAND_CLARITY,
        score: 8,
        maxScore: 15,
      },
    ],
    siteUrl,
  });
  const brand = sections[0];
  const checks = new Map(brand.checks.map((check) => [check.id, check]));

  assert.equal(checks.get("brand.author_name")?.statusLabel, "Passed");
  assert.match(
    checks.get("brand.author_name")?.details ?? "",
    /author name presented clearly/i,
  );

  assert.equal(checks.get("brand.genre_positioning")?.statusLabel, "Failed");
  assert.equal(
    checks.get("brand.genre_positioning")?.recommendation,
    "Add a plain-language genre, subject, or writing-category statement near the author name or homepage introduction so readers immediately understand what the author writes. Use wording such as “historical romance author” or “writer of practical leadership books,” repeat the terminology naturally in relevant metadata, and avoid excessive or unrelated keywords.",
  );

  assert.equal(
    checks.get("brand.homepage_headline")?.statusLabel,
    "Needs Review",
  );
  assert.match(
    checks.get("brand.homepage_headline")?.recommendation ?? "",
    /open the homepage in a signed-out desktop and mobile browser and confirm/i,
  );

  assert.equal(brand.score, 8);
  assert.equal(brand.maxScore, 15);
  assert.deepEqual(brand.counts, {
    PASSED: 1,
    NEEDS_REVIEW: 3,
    FAILED: 1,
  });
});

test("uses Needs Review for historic reports with missing check results", () => {
  const sections = buildReportAuditSections({
    checkResults: [],
    scores: [],
    siteUrl,
  });
  const firstCheck = sections[0].checks[0];

  assert.equal(firstCheck.state, "NEEDS_REVIEW");
  assert.equal(firstCheck.statusLabel, "Needs Review");
  assert.match(firstCheck.details, /evidence was unavailable or incomplete/i);
});

test("exposes only safe web evidence links and always includes the analyzed site", () => {
  const sections = buildReportAuditSections({
    checkResults: [
      {
        checkId: "brand.author_name",
        state: "PASSED",
        reasonCode: "author_name_visible",
        evidenceReferences: {
          page: "https://author.example/about",
          unsafe: "javascript:alert(1)",
          note: "Author name appears in the header",
        },
      },
    ],
    scores: [],
    siteUrl,
  });
  const links = sections[0].checks[0].evidenceLinks;

  assert.deepEqual(
    links.map((link) => link.href),
    ["https://author.example/about", "https://author.example/"],
  );
  assert.equal(links[1].label, "View analyzed website");
});

test("uses persisted details, recommendations, and the first inspected evidence page", () => {
  const sections = buildReportAuditSections({
    checkResults: [
      {
        checkId: "brand.author_name",
        state: "PASSED",
        reasonCode: "SIGNAL_DETECTED",
        evidenceReferences: {
          details: "The author name was found in the About page heading.",
          recommendation: "Keep the author name visible in the same location.",
          evidence: [
            {
              pageUrl: "https://author.example/about",
              observedValue: "Jane Author",
            },
          ],
        },
      },
    ],
    scores: [],
    siteUrl,
  });
  const check = sections[0].checks[0];

  assert.equal(
    check.details,
    "The author name was found in the About page heading.",
  );
  assert.equal(
    check.recommendation,
    "Keep the author name visible in the same location.",
  );
  assert.equal(check.inspectedPageUrl, "https://author.example/about");
});
