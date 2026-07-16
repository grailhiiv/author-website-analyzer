export const analysisStageMetadata = {
  QUEUED: {
    label: "Waiting to start",
    progress: 0,
  },
  VALIDATING: {
    label: "Checking the website address",
    progress: 5,
  },
  CRAWLING: {
    label: "Reading the author website",
    progress: 15,
  },
  TECHNICAL_CHECKS: {
    label: "Running screenshots and technical checks",
    progress: 50,
  },
  SCORING: {
    label: "Applying the deterministic scoring rubric",
    progress: 85,
  },
  COMPLETE: {
    label: "Scorecard ready",
    progress: 100,
  },
  FAILED: {
    label: "Analysis stopped",
    progress: 0,
  },
} as const;

export type AnalysisStage = keyof typeof analysisStageMetadata;
export type AnalysisTimings = Partial<Record<AnalysisStage | "TOTAL", number>>;

export function normalizeAnalysisProgress(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getCrawlAnalysisProgress({
  attemptedRequests,
  maxRequests,
  maxSavedHtmlPages,
  successfulHtmlPages,
}: {
  attemptedRequests: number;
  maxRequests: number;
  maxSavedHtmlPages: number;
  successfulHtmlPages: number;
}) {
  const attemptedRatio = maxRequests > 0 ? attemptedRequests / maxRequests : 0;
  const successfulRatio =
    maxSavedHtmlPages > 0 ? successfulHtmlPages / maxSavedHtmlPages : 0;
  const completionRatio = Math.max(
    0,
    Math.min(1, Math.max(attemptedRatio, successfulRatio)),
  );
  const start = analysisStageMetadata.CRAWLING.progress;
  const end = analysisStageMetadata.TECHNICAL_CHECKS.progress - 5;

  return normalizeAnalysisProgress(start + (end - start) * completionRatio);
}

export function getAnalysisStageLabel(stage: string | null | undefined) {
  if (stage && stage in analysisStageMetadata) {
    return analysisStageMetadata[stage as AnalysisStage].label;
  }

  return analysisStageMetadata.QUEUED.label;
}

export function recordAnalysisTiming(
  timings: AnalysisTimings,
  stage: AnalysisStage | "TOTAL",
  durationMs: number,
): AnalysisTimings {
  return {
    ...timings,
    [stage]: Math.max(0, Math.round(durationMs)),
  };
}
