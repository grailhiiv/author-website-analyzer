import assert from "node:assert/strict";
import test from "node:test";

import type { ReportCategory } from "@/generated/prisma/client";
import { reportCategoryOrder } from "@/lib/reports/category-display";
import { buildHomepageAuditPreviewSections } from "@/lib/reports/homepage-audit-preview";
import type {
  ReportAuditSectionViewModel,
  ReportCheckState,
  ReportCheckViewModel,
} from "@/lib/reports/report-check-view-model";

function buildCheck({
  category,
  index,
  state = "PASSED",
}: {
  category: ReportCategory;
  index: number;
  state?: ReportCheckState;
}): ReportCheckViewModel {
  return {
    id: `${category.toLowerCase()}.preview_${index}` as ReportCheckViewModel["id"],
    title: `Check ${index}`,
    category,
    state,
    statusLabel:
      state === "PASSED"
        ? "Passed"
        : state === "FAILED"
          ? "Failed"
          : "Needs Review",
    details: `Details ${index}`,
    inspectedPageUrl: `https://author.test/page-${index}`,
    whyItMatters: "Why it matters",
    recommendation: `Recommendation ${index}`,
    evidenceLinks: [],
    standardReferences: [],
  };
}

function buildSection(
  category: ReportCategory,
  checkCount: number,
): ReportAuditSectionViewModel {
  const checks = Array.from({ length: checkCount }, (_, index) =>
    buildCheck({ category, index }),
  );

  return {
    category,
    title: category,
    description: `${category} description`,
    score: null,
    maxScore: null,
    checks,
    counts: {
      PASSED: checks.length,
      NEEDS_REVIEW: 0,
      FAILED: 0,
    },
  };
}

test("homepage preview shows approximately one quarter of all checks with every category represented", () => {
  const checkCounts = [5, 7, 4, 7, 7, 8, 7, 5];
  const sections = reportCategoryOrder.map((category, index) =>
    buildSection(category, checkCounts[index] ?? 0),
  );

  const previewSections = buildHomepageAuditPreviewSections(sections);
  const previewCheckCount = previewSections.reduce(
    (total, section) => total + section.checks.length,
    0,
  );

  assert.equal(previewSections.length, 8);
  assert.equal(previewCheckCount, 13);
  assert.ok(previewSections.every((section) => section.checks.length >= 1));
  assert.deepEqual(
    previewSections.map((section) => section.totalCheckCount),
    checkCounts,
  );
  assert.ok(
    previewSections.every((section) =>
      section.checks.every((check) =>
        check.inspectedPageUrl?.startsWith("https://"),
      ),
    ),
  );
});

test("homepage preview prioritizes failed and needs-review checks", () => {
  const category = "BRAND_CLARITY" satisfies ReportCategory;
  const section = buildSection(category, 8);
  section.checks[5] = buildCheck({ category, index: 5, state: "FAILED" });
  section.checks[6] = buildCheck({
    category,
    index: 6,
    state: "NEEDS_REVIEW",
  });

  const [previewSection] = buildHomepageAuditPreviewSections([section]);

  assert.deepEqual(
    previewSection?.checks.map((check) => check.state),
    ["FAILED", "NEEDS_REVIEW"],
  );
});
