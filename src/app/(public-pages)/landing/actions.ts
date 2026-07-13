"use server";

import { ReportStatus } from "@/generated/prisma/client";
import { enqueueAnalysisJob, scheduleAnalysisJob } from "@/lib/analysis/jobs";
import { prisma } from "@/lib/db/prisma";
import {
  websiteScanSchema,
  type WebsiteScanValues,
} from "@/lib/schemas/website-scan";
import { validateUrlForScan } from "@/lib/urls/security";

export type StartWebsiteAnalysisResult =
  | {
      ok: true;
      domain: string;
      reportId: string;
      reused: boolean;
    }
  | {
      ok: false;
      message: string;
    };

const REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function startWebsiteAnalysis(
  input: WebsiteScanValues,
): Promise<StartWebsiteAnalysisResult> {
  const parsed = websiteScanSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Enter a valid author website URL.",
    };
  }

  const urlValidation = await validateUrlForScan(parsed.data.websiteUrl);

  if (!urlValidation.ok) {
    return {
      ok: false,
      message: urlValidation.message,
    };
  }

  try {
    const recentReport = await prisma.report.findFirst({
      where: {
        domain: urlValidation.domain,
        createdAt: {
          gte: new Date(Date.now() - REUSE_WINDOW_MS),
        },
        status: {
          in: [
            ReportStatus.QUEUED,
            ReportStatus.RUNNING,
            ReportStatus.COMPLETE,
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        domain: true,
        status: true,
      },
    });

    if (recentReport) {
      if (recentReport.status !== ReportStatus.COMPLETE) {
        await enqueueAnalysisJob(recentReport.id);
        scheduleAnalysisJob(recentReport.id);
      }

      return {
        ok: true,
        domain: recentReport.domain,
        reportId: recentReport.id,
        reused: true,
      };
    }

    const report = await prisma.report.create({
      data: {
        url: input.websiteUrl.trim(),
        normalizedUrl: urlValidation.finalUrl,
        domain: urlValidation.domain,
        status: ReportStatus.QUEUED,
      },
      select: {
        id: true,
        domain: true,
      },
    });

    await enqueueAnalysisJob(report.id);
    scheduleAnalysisJob(report.id);

    return {
      ok: true,
      domain: report.domain,
      reportId: report.id,
      reused: false,
    };
  } catch (error) {
    console.error("Failed to start homepage website analysis", error);

    return {
      ok: false,
      message:
        "We could not start the report yet. Please check the connection and try again.",
    };
  }
}
