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
    findings: [],
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

test("maps all four deterministic states to author-facing report language", () => {
  const sections = buildReportAuditSections({
    checkResults: [
      {
        checkId: "brand.author_name",
        state: "PASS",
        reasonCode: "author_name_visible",
        evidenceReferences: {},
      },
      {
        checkId: "brand.genre_positioning",
        state: "FAIL",
        reasonCode: "genre_missing",
        evidenceReferences: {},
      },
      {
        checkId: "brand.homepage_headline",
        state: "UNKNOWN",
        reasonCode: "evidence_coverage_insufficient",
        evidenceReferences: {},
      },
      {
        checkId: "brand.about_path",
        state: "NOT_APPLICABLE",
        reasonCode: "not_applicable",
        evidenceReferences: {},
      },
    ],
    findings: [
      {
        checkId: "brand.genre_positioning",
        finding: "The homepage does not clearly identify the writing category.",
        recommendation:
          "Add the writing category near the main author headline.",
        practicalActions: [
          "Update the homepage headline",
          "Repeat it in the page title",
        ],
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
  assert.equal(checks.get("brand.author_name")?.practicalActions.length, 3);
  assert.equal(
    checks.get("brand.genre_positioning")?.statusLabel,
    "Needs attention",
  );
  assert.equal(
    checks.get("brand.homepage_headline")?.statusLabel,
    "Couldn't verify",
  );
  assert.match(
    checks.get("brand.homepage_headline")?.recommendation ?? "",
    /verify this item manually/i,
  );
  assert.equal(
    checks.get("brand.homepage_headline")?.practicalActions.length,
    3,
  );
  assert.equal(checks.get("brand.about_path")?.statusLabel, "Not applicable");
  assert.equal(
    checks.get("brand.genre_positioning")?.recommendation,
    "Add the writing category near the main author headline.",
  );
  assert.deepEqual(checks.get("brand.genre_positioning")?.practicalActions, [
    "Update the homepage headline",
    "Repeat it in the page title",
  ]);
  assert.equal(brand.score, 8);
  assert.equal(brand.maxScore, 15);
  assert.deepEqual(brand.counts, {
    PASS: 1,
    FAIL: 1,
    UNKNOWN: 2,
    NOT_APPLICABLE: 1,
  });
});

test("uses an honest unknown fallback for historic reports with missing results", () => {
  const sections = buildReportAuditSections({
    checkResults: [],
    findings: [],
    scores: [],
    siteUrl,
  });
  const firstCheck = sections[0].checks[0];

  assert.equal(firstCheck.state, "UNKNOWN");
  assert.match(firstCheck.details, /not recorded in the saved scan/i);
});

test("exposes only safe web evidence links and always includes the analyzed site", () => {
  const sections = buildReportAuditSections({
    checkResults: [
      {
        checkId: "brand.author_name",
        state: "PASS",
        reasonCode: "author_name_visible",
        evidenceReferences: {
          page: "https://author.example/about",
          unsafe: "javascript:alert(1)",
          note: "Author name appears in the header",
        },
      },
    ],
    findings: [],
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
