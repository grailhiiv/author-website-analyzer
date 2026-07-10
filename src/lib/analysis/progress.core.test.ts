import assert from "node:assert/strict";
import test from "node:test";

import {
  getAnalysisStageLabel,
  normalizeAnalysisProgress,
  recordAnalysisTiming,
} from "@/lib/analysis/progress.core";

test("analysis progress is clamped to a deterministic 0-100 range", () => {
  assert.equal(normalizeAnalysisProgress(-8), 0);
  assert.equal(normalizeAnalysisProgress(42.6), 43);
  assert.equal(normalizeAnalysisProgress(108), 100);
  assert.equal(normalizeAnalysisProgress(Number.NaN), 0);
});

test("analysis stages expose stable user-facing labels", () => {
  assert.equal(
    getAnalysisStageLabel("SCORING"),
    "Applying the deterministic scoring rubric"
  );
  assert.equal(getAnalysisStageLabel("UNKNOWN"), "Waiting to start");
});

test("analysis timings are rounded and cannot be negative", () => {
  const timings = recordAnalysisTiming({}, "CRAWLING", 1024.7);
  const completed = recordAnalysisTiming(timings, "TOTAL", -4);

  assert.deepEqual(completed, {
    CRAWLING: 1025,
    TOTAL: 0,
  });
});
