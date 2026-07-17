import assert from "node:assert/strict";
import { test } from "node:test";

import { ReportCategory } from "@/generated/prisma/client";
import {
  SCORING_CHECK_REGISTRY,
  SCORING_CHECK_REGISTRY_VERSION,
  getScoringCheck,
  isScoredVisualObservation,
} from "@/lib/scoring/check-registry";

test("scoring check registry exposes every unique, versioned deterministic check", () => {
  assert.equal(SCORING_CHECK_REGISTRY_VERSION, 3);
  assert.equal(SCORING_CHECK_REGISTRY.length, 50);
  assert.equal(
    new Set(SCORING_CHECK_REGISTRY.map((check) => check.id)).size,
    SCORING_CHECK_REGISTRY.length,
  );
  assert.equal(
    new Set(SCORING_CHECK_REGISTRY.map((check) => check.deduplicationGroupId))
      .size,
    SCORING_CHECK_REGISTRY.length,
  );
  assert.equal(
    SCORING_CHECK_REGISTRY.every(
      (check) => check.version === 3 && check.status === "active",
    ),
    true,
  );
});

test("registry preserves every raw category point allocation", () => {
  const pointsByCategory = new Map<ReportCategory, number>();

  for (const check of SCORING_CHECK_REGISTRY) {
    pointsByCategory.set(
      check.category,
      (pointsByCategory.get(check.category) ?? 0) + check.points,
    );
  }

  assert.deepEqual(Object.fromEntries(pointsByCategory), {
    [ReportCategory.BRAND_CLARITY]: 15,
    [ReportCategory.BOOK_VISIBILITY]: 20,
    [ReportCategory.READER_ENGAGEMENT]: 15,
    [ReportCategory.SEARCH_VISIBILITY]: 15,
    [ReportCategory.MOBILE_PERFORMANCE]: 10,
    [ReportCategory.TECHNICAL_HEALTH]: 10,
    [ReportCategory.AUTHOR_TRUST]: 10,
    [ReportCategory.SITE_USABILITY]: 5,
  });
  assert.equal(getScoringCheck("mobile.viewport_fit").points, 1);
});

test("every check has stable applicability and evidence metadata", () => {
  for (const check of SCORING_CHECK_REGISTRY) {
    assert.ok(check.title);
    assert.ok(check.evidencePolicyId);
    assert.ok(check.passRuleId);
    assert.ok(check.needsReviewRuleId);
    assert.ok(check.applicabilityRuleId);
    assert.ok(check.applicablePageRoles.length > 0);
  }
});

test("only the registered observation and viewport pairs affect scoring", () => {
  assert.equal(
    isScoredVisualObservation({
      id: "navigation-availability",
      viewport: "desktop",
    }),
    true,
  );
  assert.equal(
    isScoredVisualObservation({
      id: "horizontal-overflow",
      viewport: "mobile",
    }),
    true,
  );
  assert.equal(
    isScoredVisualObservation({
      id: "horizontal-overflow",
      viewport: "desktop",
    }),
    false,
  );
  assert.equal(
    isScoredVisualObservation({
      id: "primary-action-visibility",
      viewport: "mobile",
    }),
    false,
  );
});
