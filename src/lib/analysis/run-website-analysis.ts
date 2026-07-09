import "server-only";

import {
  FindingSeverity,
  PageType,
  ReportCategory,
  ReportStatus,
} from "@/generated/prisma/client";
import { generateSerializedReportNarrativeForReport } from "@/lib/ai/report-narrative";
import { crawlReportWebsite } from "@/lib/crawler/service.core";
import { prisma } from "@/lib/db/prisma.core";
import { saveReportPageSpeedAudit } from "@/lib/pagespeed/service";
import { saveReportHomepageScreenshots } from "@/lib/screenshots/service";
import { scoreAndSaveReport } from "@/lib/scoring/service";
import { validateUrlForScan } from "@/lib/urls/security";

const PAGESPEED_PIPELINE_FAILURE_TITLE =
  "Technical audit data could not be retrieved";
const SCREENSHOT_PIPELINE_FAILURE_TITLE = "Screenshot capture failed";

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "The website could not be analyzed.";
}

async function hasUsableHomepageData(reportId: string) {
  const homepage = await prisma.pageScanned.findFirst({
    where: {
      reportId,
      pageType: PageType.HOME,
    },
    select: {
      statusCode: true,
      title: true,
      h1: true,
      wordCount: true,
      headingsJson: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!homepage) {
    return false;
  }

  const statusIsUsable =
    homepage.statusCode === null ||
    (homepage.statusCode >= 200 && homepage.statusCode < 400);
  const contentIsUsable = Boolean(
    homepage.title ||
      homepage.h1 ||
      homepage.headingsJson ||
      (homepage.wordCount && homepage.wordCount > 0)
  );

  return statusIsUsable && contentIsUsable;
}

async function savePipelineFinding({
  reportId,
  title,
  finding,
  recommendation,
  severity,
  priority,
}: {
  reportId: string;
  title: string;
  finding: string;
  recommendation: string;
  severity: FindingSeverity;
  priority: number;
}) {
  await prisma.reportFinding.deleteMany({
    where: {
      reportId,
      title,
    },
  });
  await prisma.reportFinding.create({
    data: {
      reportId,
      category: ReportCategory.PERFORMANCE_HEALTH,
      severity,
      title,
      finding,
      recommendation,
      priority,
    },
  });
}

async function safelyCaptureScreenshots(reportId: string, homepageUrl: string) {
  try {
    await saveReportHomepageScreenshots(reportId, {
      homepageUrl,
    });
  } catch {
    await savePipelineFinding({
      reportId,
      title: SCREENSHOT_PIPELINE_FAILURE_TITLE,
      finding:
        "The analyzer could not capture the homepage screenshot during this run.",
      recommendation:
        "Try running the analysis again later. This does not necessarily mean the website is broken.",
      severity: FindingSeverity.LOW,
      priority: 9,
    });
  }
}

async function safelyRunPageSpeed(reportId: string, homepageUrl: string) {
  try {
    await saveReportPageSpeedAudit(reportId, {
      homepageUrl,
    });
  } catch {
    await savePipelineFinding({
      reportId,
      title: PAGESPEED_PIPELINE_FAILURE_TITLE,
      finding:
        "PageSpeed Insights could not be completed during this analysis.",
      recommendation:
        "Try running the analysis again later. This does not necessarily mean the website has a performance problem.",
      severity: FindingSeverity.LOW,
      priority: 8,
    });
  }
}

export async function runWebsiteAnalysis(reportId: string) {
  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
    select: {
      id: true,
      url: true,
      normalizedUrl: true,
    },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  await prisma.report.update({
    where: {
      id: reportId,
    },
    data: {
      status: ReportStatus.RUNNING,
      completedAt: null,
      errorMessage: null,
    },
  });

  try {
    const validation = await validateUrlForScan(
      report.normalizedUrl || report.url
    );

    if (!validation.ok) {
      throw new Error(validation.message);
    }

    await prisma.report.update({
      where: {
        id: reportId,
      },
      data: {
        normalizedUrl: validation.finalUrl,
        domain: validation.domain,
      },
    });

    let homepageUrl = validation.finalUrl;

    try {
      const crawlResult = await crawlReportWebsite(reportId);
      homepageUrl = crawlResult.homepageUrl;
    } catch (error) {
      if (!(await hasUsableHomepageData(reportId))) {
        throw error;
      }
    }

    if (!(await hasUsableHomepageData(reportId))) {
      throw new Error("The homepage could not be read well enough to analyze.");
    }

    await safelyCaptureScreenshots(reportId, homepageUrl);
    await safelyRunPageSpeed(reportId, homepageUrl);

    const scoringResult = await scoreAndSaveReport(reportId);
    const summary = await generateSerializedReportNarrativeForReport(
      reportId,
      scoringResult
    );

    await prisma.report.update({
      where: {
        id: reportId,
      },
      data: {
        status: ReportStatus.COMPLETE,
        summary,
        completedAt: new Date(),
        errorMessage: null,
      },
    });

    return {
      ok: true as const,
      reportId,
      overallScore: scoringResult.overallScore,
    };
  } catch (error) {
    const message = errorMessage(error);

    await prisma.report.update({
      where: {
        id: reportId,
      },
      data: {
        status: ReportStatus.FAILED,
        errorMessage: message,
        completedAt: new Date(),
      },
    });

    return {
      ok: false as const,
      reportId,
      message,
    };
  }
}
