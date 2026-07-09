import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FindingSeverity,
  ReportCategory,
} from "@/generated/prisma/client";
import { renderAuthorReportPdf } from "@/lib/reports/pdf";

test("renderAuthorReportPdf creates a PDF without admin-only note labels", async () => {
  const pdf = await renderAuthorReportPdf({
    report: {
      id: "report_123",
      normalizedUrl: "https://example-author.test",
      domain: "example-author.test",
      authorType: "Fiction Author",
      websiteGoal: "Grow newsletter",
      overallScore: 72,
      createdAt: new Date("2026-07-01T12:00:00.000Z"),
      completedAt: new Date("2026-07-01T12:10:00.000Z"),
    },
    scores: [
      {
        category: ReportCategory.BRAND_CLARITY,
        score: 11,
        maxScore: 15,
        summary: "The homepage gives readers a useful first impression.",
      },
      {
        category: ReportCategory.BOOK_PROMOTION,
        score: 12,
        maxScore: 20,
        summary: "Book promotion is present but could be clearer.",
      },
    ],
    findings: [
      {
        category: ReportCategory.READER_CONVERSION,
        severity: FindingSeverity.HIGH,
        title: "Newsletter path needs more clarity",
        finding: "The scan found limited newsletter conversion signals.",
        recommendation:
          "Add a clear signup section with a reader-focused benefit.",
        priority: 1,
      },
    ],
    narrative: {
      executiveSummary:
        "The website has a useful foundation and needs a clearer reader path.",
      whatIsWorking: ["The author brand is visible."],
      topProblems: ["Newsletter signup could be easier to find."],
      topRecommendations: ["Add a clear newsletter call to action."],
      categoryCritiques: [],
      suggestedHomepageImprovement:
        "Lead with the author name, genre, featured book, and reader next step.",
      suggestedCTAImprovement:
        "Use one clear primary action above the fold.",
      suggestedSeoTitle: "Example Author - Fiction Books",
      suggestedMetaDescription:
        "Discover fiction books, updates, and reader extras from Example Author.",
      finalRecommendation:
        "Newsletter setup is a practical next step for this website.",
    },
    executiveSummary:
      "The website has a useful foundation and needs a clearer reader path.",
    generatedAt: new Date("2026-07-02T12:00:00.000Z"),
  });

  assert.equal(pdf.subarray(0, 4).toString("utf8"), "%PDF");
  assert.ok(pdf.byteLength > 1_000);
  assert.doesNotMatch(pdf.toString("latin1"), /Sales Notes|Manual note|Lead status/i);
});
