import assert from "node:assert/strict";
import test from "node:test";

import { ReportStatus } from "@/generated/prisma/client";
import { getReportPageState } from "@/lib/reports/report-page-state";

test("report page exposes complete preview state for completed reports without lead email", () => {
  const state = getReportPageState({
    status: ReportStatus.COMPLETE,
    hasLeadEmail: false,
  });

  assert.equal(state.showCompleteState, true);
  assert.equal(state.showEmailGate, true);
  assert.equal(state.showFullReport, false);
  assert.equal(state.showAnalyzingState, false);
  assert.equal(state.showFailedState, false);
});

test("report page exposes running state for queued and running reports", () => {
  assert.equal(
    getReportPageState({
      status: ReportStatus.QUEUED,
      hasLeadEmail: false,
    }).showAnalyzingState,
    true
  );
  assert.equal(
    getReportPageState({
      status: ReportStatus.RUNNING,
      hasLeadEmail: true,
    }).showAnalyzingState,
    true
  );
});

test("report page exposes failed state for failed reports", () => {
  const state = getReportPageState({
    status: ReportStatus.FAILED,
    hasLeadEmail: true,
  });

  assert.equal(state.showFailedState, true);
  assert.equal(state.showCompleteState, false);
  assert.equal(state.showEmailGate, false);
  assert.equal(state.showFullReport, false);
});

test("report page exposes email-gated state before a lead email is saved", () => {
  const state = getReportPageState({
    status: ReportStatus.COMPLETE,
    hasLeadEmail: false,
  });

  assert.equal(state.showEmailGate, true);
});

test("report page exposes full report state after a lead email is saved", () => {
  const state = getReportPageState({
    status: ReportStatus.COMPLETE,
    hasLeadEmail: true,
  });

  assert.equal(state.showFullReport, true);
  assert.equal(state.showEmailGate, false);
});
