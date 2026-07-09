import "server-only";

import { after } from "next/server";

import {
  AnalysisJobStatus,
  ReportStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma.core";

import {
  ANALYSIS_JOB_LOCK_TTL_MS,
  ANALYSIS_JOB_MAX_ATTEMPTS,
  ANALYSIS_JOB_MAX_RUNTIME_MS,
  getAnalysisRetryDelayMs,
} from "./job-policy";
import { runWebsiteAnalysis } from "./run-website-analysis";

type ProcessAnalysisJobResult =
  | {
      ok: true;
      reportId: string;
      status: "complete" | "skipped";
      message?: string;
    }
  | {
      ok: false;
      reportId: string;
      status: "failed" | "retry_scheduled";
      message: string;
      nextRunAt?: Date;
    };

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "The analysis job could not be completed.";
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => {
          reject(
            new Error(
              "The website analysis exceeded the maximum allowed runtime."
            )
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function enqueueAnalysisJob(reportId: string) {
  const existingJob = await prisma.analysisJob.findUnique({
    where: {
      reportId,
    },
  });

  if (existingJob) {
    return existingJob;
  }

  try {
    return await prisma.analysisJob.create({
      data: {
        reportId,
        maxAttempts: ANALYSIS_JOB_MAX_ATTEMPTS,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return await prisma.analysisJob.findUniqueOrThrow({
        where: {
          reportId,
        },
      });
    }

    throw error;
  }
}

export function scheduleAnalysisJob(reportId: string) {
  after(async () => {
    try {
      await processAnalysisJob(reportId);
    } catch {
      // The job row keeps the retry/error state. Avoid surfacing background
      // errors to the request that scheduled the work.
    }
  });
}

async function markJobComplete(reportId: string) {
  await prisma.analysisJob.update({
    where: {
      reportId,
    },
    data: {
      status: AnalysisJobStatus.COMPLETE,
      completedAt: new Date(),
      lastError: null,
      lockedAt: null,
    },
  });
}

async function markJobFailedOrRetry(reportId: string, message: string) {
  const job = await prisma.analysisJob.findUnique({
    where: {
      reportId,
    },
    select: {
      attempts: true,
      maxAttempts: true,
    },
  });

  const attempts = job?.attempts ?? ANALYSIS_JOB_MAX_ATTEMPTS;
  const maxAttempts = job?.maxAttempts ?? ANALYSIS_JOB_MAX_ATTEMPTS;

  if (attempts >= maxAttempts) {
    await prisma.$transaction([
      prisma.analysisJob.update({
        where: {
          reportId,
        },
        data: {
          status: AnalysisJobStatus.FAILED,
          completedAt: new Date(),
          lastError: message,
          lockedAt: null,
        },
      }),
      prisma.report.update({
        where: {
          id: reportId,
        },
        data: {
          status: ReportStatus.FAILED,
          errorMessage: message,
          completedAt: new Date(),
        },
      }),
    ]);

    return {
      ok: false as const,
      reportId,
      status: "failed" as const,
      message,
    };
  }

  const nextRunAt = new Date(Date.now() + getAnalysisRetryDelayMs(attempts));

  await prisma.$transaction([
    prisma.analysisJob.update({
      where: {
        reportId,
      },
      data: {
        status: AnalysisJobStatus.QUEUED,
        completedAt: null,
        lastError: message,
        lockedAt: null,
        nextRunAt,
      },
    }),
    prisma.report.update({
      where: {
        id: reportId,
      },
      data: {
        status: ReportStatus.QUEUED,
        errorMessage: message,
        completedAt: null,
      },
    }),
  ]);

  return {
    ok: false as const,
    reportId,
    status: "retry_scheduled" as const,
    message,
    nextRunAt,
  };
}

async function claimAnalysisJob(reportId: string) {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - ANALYSIS_JOB_LOCK_TTL_MS);

  const claim = await prisma.analysisJob.updateMany({
    where: {
      reportId,
      attempts: {
        lt: ANALYSIS_JOB_MAX_ATTEMPTS,
      },
      nextRunAt: {
        lte: now,
      },
      OR: [
        {
          status: AnalysisJobStatus.QUEUED,
        },
        {
          status: AnalysisJobStatus.FAILED,
        },
        {
          status: AnalysisJobStatus.RUNNING,
          lockedAt: {
            lt: staleBefore,
          },
        },
      ],
    },
    data: {
      status: AnalysisJobStatus.RUNNING,
      attempts: {
        increment: 1,
      },
      startedAt: now,
      completedAt: null,
      lockedAt: now,
      lastError: null,
    },
  });

  if (claim.count === 0) {
    return null;
  }

  return await prisma.analysisJob.findUnique({
    where: {
      reportId,
    },
  });
}

export async function processAnalysisJob(
  reportId: string,
  options: {
    maxRuntimeMs?: number;
  } = {}
): Promise<ProcessAnalysisJobResult> {
  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
    select: {
      status: true,
    },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  await enqueueAnalysisJob(reportId);

  if (report.status === ReportStatus.COMPLETE) {
    await markJobComplete(reportId);

    return {
      ok: true,
      reportId,
      status: "skipped",
      message: "Report is already complete.",
    };
  }

  const job = await claimAnalysisJob(reportId);

  if (!job) {
    return {
      ok: true,
      reportId,
      status: "skipped",
      message: "Analysis job is not due or is already running.",
    };
  }

  try {
    const result = await withTimeout(
      runWebsiteAnalysis(reportId),
      options.maxRuntimeMs ?? ANALYSIS_JOB_MAX_RUNTIME_MS
    );

    if (!result.ok) {
      throw new Error(result.message);
    }

    await markJobComplete(reportId);

    return {
      ok: true,
      reportId,
      status: "complete",
    };
  } catch (error) {
    return await markJobFailedOrRetry(reportId, getErrorMessage(error));
  }
}
