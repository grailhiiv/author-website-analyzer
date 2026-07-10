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

export function getAnalysisStageLabel(stage: string | null | undefined) {
  if (stage && stage in analysisStageMetadata) {
    return analysisStageMetadata[stage as AnalysisStage].label;
  }

  return analysisStageMetadata.QUEUED.label;
}

export function recordAnalysisTiming(
  timings: AnalysisTimings,
  stage: AnalysisStage | "TOTAL",
  durationMs: number
): AnalysisTimings {
  return {
    ...timings,
    [stage]: Math.max(0, Math.round(durationMs)),
  };
}
