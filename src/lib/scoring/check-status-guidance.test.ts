import assert from "node:assert/strict";
import test from "node:test";

import { SCORING_CHECK_REGISTRY } from "@/lib/scoring/check-registry";
import {
  getPassedCheckGuidance,
  getUnknownCheckGuidance,
} from "@/lib/scoring/check-status-guidance";

test("provides complete passed and unknown guidance for every scoring check", () => {
  for (const check of SCORING_CHECK_REGISTRY) {
    const passed = getPassedCheckGuidance(check);
    const unknown = getUnknownCheckGuidance(
      check,
      "evidence_coverage_insufficient",
    );

    for (const guidance of [passed, unknown]) {
      assert.ok(guidance.details.trim(), `${check.id} needs details`);
      assert.ok(
        guidance.recommendation.trim(),
        `${check.id} needs a recommendation`,
      );
      assert.ok(
        guidance.practicalActions.length >= 3,
        `${check.id} needs several practical actions`,
      );
      guidance.practicalActions.forEach((action) => {
        assert.ok(action.trim(), `${check.id} has an empty practical action`);
      });
    }
  }
});

test("keeps unknown guidance honest about the recorded evidence limitation", () => {
  const check = SCORING_CHECK_REGISTRY.find(
    ({ id }) => id === "mobile.viewport_fit",
  );

  assert.ok(check);
  assert.match(
    getUnknownCheckGuidance(check, "required_viewport_evidence_missing")
      .details,
    /every required screen size/i,
  );
  assert.match(
    getUnknownCheckGuidance(check, "stored_result_missing").details,
    /not recorded in the saved scan/i,
  );
});
