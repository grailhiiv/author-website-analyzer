import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma.core";
import {
  normalizeAnalysisProgress,
  type AnalysisStage,
  type AnalysisTimings,
} from "@/lib/analysis/progress.core";

export async function updateAnalysisProgress({
  reportId,
  stage,
  progress,
  timings,
}: {
  reportId: string;
  stage: AnalysisStage;
  progress: number;
  timings?: AnalysisTimings;
}) {
  return prisma.analysisJob.updateMany({
    where: {
      reportId,
    },
    data: {
      stage,
      progress: normalizeAnalysisProgress(progress),
      timingsJson: timings
        ? (timings as Prisma.InputJsonValue)
        : undefined,
    },
  });
}
