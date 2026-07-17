import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CheckResultState,
  FindingOrigin,
  ReportCategory,
} from "@/generated/prisma/client";
import {
  buildReportCheckResultRows,
  deterministicFindingScope,
} from "@/lib/scoring/persistence.core";

test("rescoring deletes deterministic findings without deleting diagnostics", () => {
  assert.deepEqual(deterministicFindingScope("report-1"), {
    reportId: "report-1",
    origin: FindingOrigin.DETERMINISTIC_SCORE,
  });
});

test("check-result persistence preserves stable identity, state, and evidence", () => {
  assert.deepEqual(
    buildReportCheckResultRows("report-1", [
      {
        registryVersion: 3,
        checkId: "mobile.viewport_fit",
        checkVersion: 1,
        category: ReportCategory.MOBILE_PERFORMANCE,
        state: "needs_review",
        availablePoints: 1,
        earnedPoints: 0,
        reasonCode: "rendered_evidence_unavailable",
        rootCauseKey: "MOBILE_LAYOUT",
        details: "Rendered viewport-fit evidence was unavailable.",
        recommendation:
          "Review the homepage at common mobile widths and correct any horizontal overflow before confirming this check.",
        evidence: [],
        evidenceReferences: {
          observationId: "horizontal-overflow",
          viewport: "mobile",
        },
      },
    ]),
    [
      {
        reportId: "report-1",
        checkId: "mobile.viewport_fit",
        checkVersion: 1,
        registryVersion: 3,
        category: ReportCategory.MOBILE_PERFORMANCE,
        state: CheckResultState.NEEDS_REVIEW,
        availablePoints: 1,
        earnedPoints: 0,
        reasonCode: "rendered_evidence_unavailable",
        evidenceReferences: {
          observationId: "horizontal-overflow",
          viewport: "mobile",
        },
      },
    ],
  );
});
