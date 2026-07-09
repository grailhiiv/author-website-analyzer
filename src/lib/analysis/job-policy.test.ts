import assert from "node:assert/strict";
import test from "node:test";

import { AnalysisJobStatus, ReportStatus } from "@/generated/prisma/client";

import {
  getAnalysisRetryDelayMs,
  hasAnalysisJobExceededRuntime,
  isAnalyzingReportStatus,
  shouldAttemptAnalysisJob,
} from "./job-policy";

const now = new Date("2026-07-09T00:00:00.000Z");

test("queued reports are treated as analyzing on the report page", () => {
  assert.equal(isAnalyzingReportStatus(ReportStatus.QUEUED), true);
});

test("running reports are treated as analyzing on the report page", () => {
  assert.equal(isAnalyzingReportStatus(ReportStatus.RUNNING), true);
});

test("completed and failed reports are not treated as analyzing", () => {
  assert.equal(isAnalyzingReportStatus(ReportStatus.COMPLETE), false);
  assert.equal(isAnalyzingReportStatus(ReportStatus.FAILED), false);
});

test("queued jobs are eligible when due and below max attempts", () => {
  assert.equal(
    shouldAttemptAnalysisJob({
      attempts: 0,
      lockedAt: null,
      maxAttempts: 3,
      nextRunAt: now,
      now,
      status: AnalysisJobStatus.QUEUED,
    }),
    true
  );
});

test("running jobs are only eligible after the lock expires", () => {
  assert.equal(
    shouldAttemptAnalysisJob({
      attempts: 1,
      lockedAt: new Date(now.getTime() - 20_000),
      lockTtlMs: 10_000,
      maxAttempts: 3,
      nextRunAt: now,
      now,
      status: AnalysisJobStatus.RUNNING,
    }),
    true
  );

  assert.equal(
    shouldAttemptAnalysisJob({
      attempts: 1,
      lockedAt: new Date(now.getTime() - 5_000),
      lockTtlMs: 10_000,
      maxAttempts: 3,
      nextRunAt: now,
      now,
      status: AnalysisJobStatus.RUNNING,
    }),
    false
  );
});

test("completed jobs and exhausted jobs are not attempted again", () => {
  assert.equal(
    shouldAttemptAnalysisJob({
      attempts: 1,
      lockedAt: null,
      maxAttempts: 3,
      nextRunAt: now,
      now,
      status: AnalysisJobStatus.COMPLETE,
    }),
    false
  );

  assert.equal(
    shouldAttemptAnalysisJob({
      attempts: 3,
      lockedAt: null,
      maxAttempts: 3,
      nextRunAt: now,
      now,
      status: AnalysisJobStatus.QUEUED,
    }),
    false
  );
});

test("retry delays increase across attempts", () => {
  assert.equal(getAnalysisRetryDelayMs(1), 30_000);
  assert.equal(getAnalysisRetryDelayMs(2), 120_000);
  assert.equal(getAnalysisRetryDelayMs(3), 300_000);
});

test("max runtime guard detects stale running work", () => {
  assert.equal(
    hasAnalysisJobExceededRuntime({
      maxRuntimeMs: 60_000,
      now,
      startedAt: new Date(now.getTime() - 120_000),
    }),
    true
  );

  assert.equal(
    hasAnalysisJobExceededRuntime({
      maxRuntimeMs: 60_000,
      now,
      startedAt: new Date(now.getTime() - 10_000),
    }),
    false
  );
});
