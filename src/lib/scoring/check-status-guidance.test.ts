import assert from "node:assert/strict";
import test from "node:test";

import { SCORING_CHECK_REGISTRY } from "@/lib/scoring/check-registry";
import { getCheckStatusGuidance } from "@/lib/scoring/check-status-guidance";
import type { AuditCheckStatus } from "@/lib/scoring/check-status-content.generated";

const statuses: AuditCheckStatus[] = ["passed", "needs_review", "failed"];

test("provides complete canonical guidance for all three statuses and every check", () => {
  for (const check of SCORING_CHECK_REGISTRY) {
    for (const status of statuses) {
      const guidance = getCheckStatusGuidance(check, status);

      assert.ok(guidance.details.trim(), `${check.id}/${status} needs details`);
      assert.ok(
        guidance.recommendation.trim(),
        `${check.id}/${status} needs a recommendation`,
      );
    }
  }
});

test("uses the supplied Needs Review and Failed wording", () => {
  const check = SCORING_CHECK_REGISTRY.find(
    ({ id }) => id === "mobile.viewport_fit",
  );

  assert.ok(check);
  assert.equal(
    getCheckStatusGuidance(check, "needs_review").details,
    "The required rendered-page or viewport evidence was unavailable or incomplete, so the analyzer could not reliably determine whether this check passes.",
  );
  assert.equal(
    getCheckStatusGuidance(check, "failed").recommendation,
    "Identify and correct the element causing page-level horizontal overflow or clipped content on mobile. Replace rigid widths, oversized media, nonwrapping text, transforms, tables, embeds, or absolutely positioned controls with responsive constraints, then verify that the document width no longer exceeds the viewport at common phone sizes.",
  );
});
