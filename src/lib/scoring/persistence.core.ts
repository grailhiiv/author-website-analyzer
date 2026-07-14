import {
  CheckResultState,
  FindingOrigin,
  Prisma,
} from "@/generated/prisma/client";
import type {
  ScoringCheckResult,
  ScoringCheckState,
} from "@/lib/scoring/engine";

const CHECK_RESULT_STATE: Record<ScoringCheckState, CheckResultState> = {
  pass: CheckResultState.PASS,
  fail: CheckResultState.FAIL,
  unknown: CheckResultState.UNKNOWN,
  not_applicable: CheckResultState.NOT_APPLICABLE,
};

export function deterministicFindingScope(reportId: string) {
  return {
    reportId,
    origin: FindingOrigin.DETERMINISTIC_SCORE,
  } as const;
}

export function buildReportCheckResultRows(
  reportId: string,
  checks: readonly ScoringCheckResult[],
) {
  return checks.map((check) => ({
    reportId,
    checkId: check.checkId,
    checkVersion: check.checkVersion,
    registryVersion: check.registryVersion,
    category: check.category,
    state: CHECK_RESULT_STATE[check.state],
    availablePoints: check.availablePoints,
    earnedPoints: check.earnedPoints,
    reasonCode: check.reasonCode,
    evidenceReferences: check.evidenceReferences as Prisma.InputJsonValue,
  }));
}
