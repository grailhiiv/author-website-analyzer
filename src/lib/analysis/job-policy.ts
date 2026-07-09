import {
  AnalysisJobStatus,
  ReportStatus,
} from "@/generated/prisma/client";

export const ANALYSIS_JOB_MAX_ATTEMPTS = 3;
export const ANALYSIS_JOB_LOCK_TTL_MS = 15 * 60 * 1000;
export const ANALYSIS_JOB_MAX_RUNTIME_MS = 8 * 60 * 1000;

const retryDelaysMs = [30 * 1000, 2 * 60 * 1000, 5 * 60 * 1000];

export function getAnalysisRetryDelayMs(attempts: number) {
  const index = Math.max(0, Math.min(attempts - 1, retryDelaysMs.length - 1));

  return retryDelaysMs[index];
}

export function isAnalyzingReportStatus(status: ReportStatus) {
  return status === ReportStatus.QUEUED || status === ReportStatus.RUNNING;
}

export function hasAnalysisJobExceededRuntime({
  now,
  startedAt,
  maxRuntimeMs = ANALYSIS_JOB_MAX_RUNTIME_MS,
}: {
  now: Date;
  startedAt: Date | null;
  maxRuntimeMs?: number;
}) {
  if (!startedAt) {
    return false;
  }

  return now.getTime() - startedAt.getTime() > maxRuntimeMs;
}

export function shouldAttemptAnalysisJob({
  attempts,
  lockedAt,
  maxAttempts,
  nextRunAt,
  now,
  status,
  lockTtlMs = ANALYSIS_JOB_LOCK_TTL_MS,
}: {
  attempts: number;
  lockedAt: Date | null;
  maxAttempts: number;
  nextRunAt: Date;
  now: Date;
  status: AnalysisJobStatus;
  lockTtlMs?: number;
}) {
  if (
    status === AnalysisJobStatus.COMPLETE ||
    attempts >= maxAttempts ||
    nextRunAt.getTime() > now.getTime()
  ) {
    return false;
  }

  if (status === AnalysisJobStatus.RUNNING) {
    return Boolean(
      lockedAt && now.getTime() - lockedAt.getTime() > lockTtlMs
    );
  }

  return (
    status === AnalysisJobStatus.QUEUED ||
    status === AnalysisJobStatus.FAILED
  );
}
