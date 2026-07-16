import "server-only";

import {
  FindingOrigin,
  FindingSeverity,
  PageType,
  ReportCategory,
  ReportStatus,
} from "@/generated/prisma/client";
import {
  generateDeterministicSerializedReportNarrativeForReport,
  generateReportNarrativeForReport,
} from "@/lib/ai/report-narrative";
import { serializeReportNarrative } from "@/lib/ai/report-narrative.core";
import {
  getAnalysisErrorMessage,
  getPublicAnalysisErrorMessage,
} from "@/lib/analysis/error-messages";
import {
  analysisStageMetadata,
  getCrawlAnalysisProgress,
  recordAnalysisTiming,
  type AnalysisStage,
  type AnalysisTimings,
} from "@/lib/analysis/progress.core";
import { updateAnalysisProgress } from "@/lib/analysis/progress";
import { crawlReportWebsite } from "@/lib/crawler/service.persistence";
import { prisma } from "@/lib/db/prisma.core";
import { DEFAULT_PAGESPEED_TIMEOUT_MS } from "@/lib/pagespeed/service.core";
import { saveReportPageSpeedAudit } from "@/lib/pagespeed/service";
import {
  captureReportHomepageScreenshots,
  persistReportHomepageScreenshots,
  type CapturedReportHomepageScreenshots,
} from "@/lib/screenshots/service";
import { scoreAndSaveReport } from "@/lib/scoring/service";
import { validateUrlForScan } from "@/lib/urls/security";

const PAGESPEED_PIPELINE_FAILURE_TITLE =
  "Technical audit data could not be retrieved";
const SCREENSHOT_PIPELINE_FAILURE_TITLE = "Screenshot capture failed";
const CRAWL_TIMEOUT_MS = 6_000;
const SITEMAP_TIMEOUT_MS = 3_000;
const SCREENSHOT_TIMEOUT_MS = 12_000;
const AI_ENRICHMENT_TIMEOUT_MS = 8_000;

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
    (homepage.wordCount && homepage.wordCount > 0),
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
      category: ReportCategory.TECHNICAL_HEALTH,
      severity,
      title,
      finding,
      recommendation,
      priority,
      origin: FindingOrigin.SYSTEM_DIAGNOSTIC,
    },
  });
}

async function safelyCaptureScreenshots(reportId: string, homepageUrl: string) {
  try {
    return await captureReportHomepageScreenshots(reportId, {
      homepageUrl,
      timeoutMs: SCREENSHOT_TIMEOUT_MS,
      waitAfterLoadMs: 750,
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

    return null;
  }
}

async function safelyPersistScreenshots(
  reportId: string,
  capture: CapturedReportHomepageScreenshots | null,
) {
  if (!capture) {
    return;
  }

  try {
    await persistReportHomepageScreenshots(reportId, capture);
  } catch {
    await savePipelineFinding({
      reportId,
      title: SCREENSHOT_PIPELINE_FAILURE_TITLE,
      finding:
        "The analyzer could not save the homepage screenshot during this run.",
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
      timeoutMs: DEFAULT_PAGESPEED_TIMEOUT_MS,
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

  const analysisStartedAt = Date.now();
  let currentProgress: number = analysisStageMetadata.VALIDATING.progress;
  let timings: AnalysisTimings = {};

  async function runStage<T>(
    stage: AnalysisStage,
    operation: () => Promise<T>,
  ) {
    currentProgress = analysisStageMetadata[stage].progress;
    await updateAnalysisProgress({
      reportId,
      stage,
      progress: currentProgress,
      timings,
    });

    const startedAt = Date.now();

    try {
      return await operation();
    } finally {
      timings = recordAnalysisTiming(timings, stage, Date.now() - startedAt);
      await updateAnalysisProgress({
        reportId,
        stage,
        progress: currentProgress,
        timings,
      });
    }
  }

  try {
    const validation = await runStage("VALIDATING", async () => {
      const result = await validateUrlForScan(
        report.normalizedUrl || report.url,
      );

      if (!result.ok) {
        throw new Error(result.message);
      }

      await prisma.report.update({
        where: {
          id: reportId,
        },
        data: {
          normalizedUrl: result.finalUrl,
          domain: result.domain,
        },
      });

      return result;
    });

    currentProgress = analysisStageMetadata.CRAWLING.progress;
    await updateAnalysisProgress({
      reportId,
      stage: "CRAWLING",
      progress: currentProgress,
      timings,
    });

    const technicalStartedAt = Date.now();
    const screenshotCapture = safelyCaptureScreenshots(
      reportId,
      validation.finalUrl,
    );
    const pageSpeedAudit = safelyRunPageSpeed(reportId, validation.finalUrl);
    const crawlStartedAt = Date.now();

    try {
      try {
        await crawlReportWebsite(reportId, {
          concurrency: 4,
          onProgress: async (crawlProgress) => {
            const nextProgress = getCrawlAnalysisProgress(crawlProgress);

            if (nextProgress <= currentProgress) {
              return;
            }

            currentProgress = nextProgress;
            await updateAnalysisProgress({
              reportId,
              stage: "CRAWLING",
              progress: currentProgress,
              timings,
            });
          },
          sitemapTimeoutMs: SITEMAP_TIMEOUT_MS,
          timeoutMs: CRAWL_TIMEOUT_MS,
        });
      } catch (error) {
        if (!(await hasUsableHomepageData(reportId))) {
          throw error;
        }
      }

      if (!(await hasUsableHomepageData(reportId))) {
        throw new Error(
          "The homepage could not be read well enough to analyze.",
        );
      }
    } catch (error) {
      // Settle the independent work before the report is marked failed so no
      // background database writes can race the terminal failure update.
      await Promise.allSettled([screenshotCapture, pageSpeedAudit]);
      throw error;
    } finally {
      timings = recordAnalysisTiming(
        timings,
        "CRAWLING",
        Date.now() - crawlStartedAt,
      );
    }

    currentProgress = analysisStageMetadata.TECHNICAL_CHECKS.progress;
    await updateAnalysisProgress({
      reportId,
      stage: "TECHNICAL_CHECKS",
      progress: currentProgress,
      timings,
    });

    const capturedScreenshots = await screenshotCapture;
    await Promise.all([
      pageSpeedAudit,
      safelyPersistScreenshots(reportId, capturedScreenshots),
    ]);
    timings = recordAnalysisTiming(
      timings,
      "TECHNICAL_CHECKS",
      Date.now() - technicalStartedAt,
    );
    await updateAnalysisProgress({
      reportId,
      stage: "TECHNICAL_CHECKS",
      progress: currentProgress,
      timings,
    });

    const scoringResult = await runStage("SCORING", async () => {
      const result = await scoreAndSaveReport(reportId);
      const summary =
        await generateDeterministicSerializedReportNarrativeForReport(
          reportId,
          result,
        );

      await prisma.report.update({
        where: {
          id: reportId,
        },
        data: {
          summary,
        },
      });

      return result;
    });

    timings = recordAnalysisTiming(
      timings,
      "TOTAL",
      Date.now() - analysisStartedAt,
    );
    currentProgress = analysisStageMetadata.COMPLETE.progress;

    await prisma.$transaction([
      prisma.report.update({
        where: {
          id: reportId,
        },
        data: {
          status: ReportStatus.COMPLETE,
          completedAt: new Date(),
          errorMessage: null,
        },
      }),
      prisma.analysisJob.updateMany({
        where: {
          reportId,
        },
        data: {
          stage: "COMPLETE",
          progress: currentProgress,
          timingsJson: timings,
        },
      }),
    ]);

    // The deterministic scorecard is already complete. AI may improve the
    // wording, but a slow or unavailable model can no longer delay the result.
    try {
      const narrative = await generateReportNarrativeForReport(
        reportId,
        scoringResult,
        { timeoutMs: AI_ENRICHMENT_TIMEOUT_MS },
      );

      if (narrative.source === "ai") {
        await prisma.report.update({
          where: {
            id: reportId,
          },
          data: {
            summary: serializeReportNarrative(narrative),
          },
        });
      }
    } catch {
      // Keep the deterministic fallback narrative saved above.
    }

    return {
      ok: true as const,
      reportId,
      overallScore: scoringResult.overallScore,
    };
  } catch (error) {
    const message = getAnalysisErrorMessage(error);
    const publicMessage = getPublicAnalysisErrorMessage(message);

    timings = recordAnalysisTiming(
      timings,
      "TOTAL",
      Date.now() - analysisStartedAt,
    );

    await prisma.$transaction([
      prisma.report.update({
        where: {
          id: reportId,
        },
        data: {
          status: ReportStatus.FAILED,
          errorMessage: publicMessage,
          completedAt: new Date(),
        },
      }),
      prisma.analysisJob.updateMany({
        where: {
          reportId,
        },
        data: {
          stage: "FAILED",
          timingsJson: timings,
        },
      }),
    ]);

    return {
      ok: false as const,
      reportId,
      message,
    };
  }
}
