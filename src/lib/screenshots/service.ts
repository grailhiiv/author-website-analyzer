import "server-only";

import {
  FindingSeverity,
  PageType,
  ReportCategory,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma.core";
import {
  captureHomepageScreenshots,
  type HomepageScreenshotResult,
} from "@/lib/screenshots/capture.core";
import type { ScreenshotStorage } from "@/lib/screenshots/storage";

const SCREENSHOT_FAILURE_FINDING_TITLE = "Screenshot capture failed";

type SaveReportScreenshotsOptions = {
  homepageUrl?: string;
  storage?: ScreenshotStorage;
  timeoutMs?: number;
  redirectLimit?: number;
  waitAfterLoadMs?: number;
};

export type CapturedReportHomepageScreenshots = {
  result: HomepageScreenshotResult;
};

async function saveScreenshotFailureFinding(
  reportId: string,
  result: HomepageScreenshotResult,
) {
  await prisma.reportFinding.deleteMany({
    where: {
      reportId,
      title: SCREENSHOT_FAILURE_FINDING_TITLE,
    },
  });

  if (result.errors.length === 0) {
    return;
  }

  await prisma.reportFinding.create({
    data: {
      reportId,
      category: ReportCategory.TECHNICAL_HEALTH,
      severity:
        result.screenshots.desktop || result.screenshots.mobile
          ? FindingSeverity.LOW
          : FindingSeverity.MEDIUM,
      title: SCREENSHOT_FAILURE_FINDING_TITLE,
      finding:
        "The analyzer could not capture every website screenshot during this run.",
      recommendation:
        "Try running the analysis again later. This does not necessarily mean the website is broken.",
      priority: 9,
    },
  });
}

async function savePrimaryScreenshotUrl(
  reportId: string,
  homepageUrl: string,
  screenshotUrl: string | null,
  mobileScreenshotUrl: string | null,
) {
  if (!screenshotUrl && !mobileScreenshotUrl) {
    return null;
  }

  const homepage = await prisma.pageScanned.findFirst({
    where: {
      reportId,
      pageType: PageType.HOME,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
    },
  });

  if (homepage) {
    return prisma.pageScanned.update({
      where: {
        id: homepage.id,
      },
      data: {
        screenshotUrl,
        mobileScreenshotUrl,
      },
    });
  }

  return prisma.pageScanned.create({
    data: {
      reportId,
      url: homepageUrl,
      pageType: PageType.HOME,
      screenshotUrl,
      mobileScreenshotUrl,
    },
  });
}

export async function captureReportHomepageScreenshots(
  reportId: string,
  options: SaveReportScreenshotsOptions = {},
): Promise<CapturedReportHomepageScreenshots> {
  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
    select: {
      id: true,
      domain: true,
      normalizedUrl: true,
      url: true,
      pagesScanned: {
        where: {
          pageType: PageType.HOME,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
        select: {
          url: true,
        },
      },
    },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  const homepageUrl =
    options.homepageUrl ??
    report.pagesScanned[0]?.url ??
    report.normalizedUrl ??
    report.url;
  const result = await captureHomepageScreenshots(homepageUrl, {
    websiteDomain: report.domain,
    redirectLimit: options.redirectLimit,
    storage: options.storage,
    timeoutMs: options.timeoutMs,
    waitAfterLoadMs: options.waitAfterLoadMs,
  });

  return { result };
}

export async function persistReportHomepageScreenshots(
  reportId: string,
  capture: CapturedReportHomepageScreenshots,
) {
  const { result } = capture;
  const screenshotUrl =
    result.screenshots.desktop?.url ?? result.screenshots.mobile?.url ?? null;
  const mobileScreenshotUrl = result.screenshots.mobile?.url ?? null;
  const pageScanned = await savePrimaryScreenshotUrl(
    reportId,
    result.homepageUrl,
    screenshotUrl,
    mobileScreenshotUrl,
  );

  await saveScreenshotFailureFinding(reportId, result);

  return {
    result,
    pageScanned,
  };
}

export async function saveReportHomepageScreenshots(
  reportId: string,
  options: SaveReportScreenshotsOptions = {},
) {
  const capture = await captureReportHomepageScreenshots(reportId, options);

  return persistReportHomepageScreenshots(reportId, capture);
}
