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
  const normalizedProgress = normalizeAnalysisProgress(progress);
  const timingsJson = timings ? (timings as Prisma.InputJsonValue) : undefined;
  const advanced = await prisma.analysisJob.updateMany({
    where: {
      reportId,
      progress: {
        lte: normalizedProgress,
      },
    },
    data: {
      stage,
      progress: normalizedProgress,
      timingsJson,
    },
  });

  if (advanced.count > 0) {
    return advanced;
  }

  // A retry may return to an earlier stage, but the user-facing percentage
  // should retain the highest progress already reached.
  return prisma.analysisJob.updateMany({
    where: {
      reportId,
    },
    data: {
      stage,
      timingsJson,
    },
  });
}
