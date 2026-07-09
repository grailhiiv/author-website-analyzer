import { NextResponse } from "next/server";

import { ReportStatus } from "@/generated/prisma/client";
import {
  enqueueAnalysisJob,
  scheduleAnalysisJob,
} from "@/lib/analysis/jobs";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
      overallScore: true,
      updatedAt: true,
      errorMessage: true,
      analysisJob: {
        select: {
          status: true,
          attempts: true,
          maxAttempts: true,
          nextRunAt: true,
          lastError: true,
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json(
      {
        ok: false,
        message: "Report not found.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    report.status === ReportStatus.QUEUED ||
    report.status === ReportStatus.RUNNING
  ) {
    await enqueueAnalysisJob(report.id);
    scheduleAnalysisJob(report.id);
  }

  return NextResponse.json({
    ok: true,
    reportId: report.id,
    status: report.status,
    overallScore: report.overallScore,
    updatedAt: report.updatedAt,
    errorMessage: report.errorMessage,
    job: report.analysisJob,
  });
}
