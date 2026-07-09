import "server-only";

import {
  FindingSeverity,
  Prisma,
  ReportCategory,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma.core";
import {
  runPageSpeedAudit,
  type PageSpeedAuditResult,
  type PageSpeedStrategyResult,
} from "@/lib/pagespeed/service.core";

const PAGESPEED_FAILURE_FINDING_TITLE =
  "Technical audit data could not be retrieved";

type SavePageSpeedAuditOptions = {
  homepageUrl?: string;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
  apiKey?: string;
};

function toJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function scoreOrNull(
  result: PageSpeedStrategyResult,
  key: keyof PageSpeedStrategyResult["scores"]
) {
  return result.scores[key];
}

function hasFailures(result: PageSpeedAuditResult) {
  return !result.mobile.ok || !result.desktop.ok;
}

function unavailablePageSpeedResult(homepageUrl: string): PageSpeedAuditResult {
  const error =
    "PageSpeed Insights is not configured for this environment yet.";

  return {
    homepageUrl,
    mobile: {
      ok: false,
      strategy: "mobile",
      scores: {
        performance: null,
        accessibility: null,
        seo: null,
        bestPractices: null,
      },
      lighthouse: null,
      error,
    },
    desktop: {
      ok: false,
      strategy: "desktop",
      scores: {
        performance: null,
        accessibility: null,
        seo: null,
        bestPractices: null,
      },
      lighthouse: null,
      error,
    },
    lighthouseJson: {
      source: "pagespeed-insights",
      homepageUrl,
      mobile: null,
      desktop: null,
      errors: {
        mobile: error,
        desktop: error,
      },
    },
  };
}

async function saveFailureFinding(reportId: string, result: PageSpeedAuditResult) {
  await prisma.reportFinding.deleteMany({
    where: {
      reportId,
      title: PAGESPEED_FAILURE_FINDING_TITLE,
    },
  });

  if (!hasFailures(result)) {
    return;
  }

  await prisma.reportFinding.create({
    data: {
      reportId,
      category: ReportCategory.PERFORMANCE_HEALTH,
      severity: FindingSeverity.LOW,
      title: PAGESPEED_FAILURE_FINDING_TITLE,
      finding:
        "PageSpeed Insights did not return complete technical data for this website during this analysis.",
      recommendation:
        "Try running the analysis again later. This does not necessarily mean the website has a performance problem.",
      priority: 8,
    },
  });
}

export async function saveReportPageSpeedAudit(
  reportId: string,
  options: SavePageSpeedAuditOptions = {}
) {
  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
    select: {
      id: true,
      normalizedUrl: true,
      url: true,
    },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  const homepageUrl = options.homepageUrl ?? report.normalizedUrl ?? report.url;
  const apiKey = options.apiKey ?? process.env.PAGESPEED_API_KEY?.trim();
  const result = apiKey
    ? await runPageSpeedAudit(homepageUrl, {
        apiKey,
        timeoutMs: options.timeoutMs,
        fetchImplementation: options.fetchImplementation,
      })
    : unavailablePageSpeedResult(homepageUrl);
  const auditData = {
    mobilePerformance: scoreOrNull(result.mobile, "performance"),
    desktopPerformance: scoreOrNull(result.desktop, "performance"),
    mobileAccessibility: scoreOrNull(result.mobile, "accessibility"),
    desktopAccessibility: scoreOrNull(result.desktop, "accessibility"),
    mobileSeo: scoreOrNull(result.mobile, "seo"),
    desktopSeo: scoreOrNull(result.desktop, "seo"),
    mobileBestPractices: scoreOrNull(result.mobile, "bestPractices"),
    desktopBestPractices: scoreOrNull(result.desktop, "bestPractices"),
    lighthouseJson: toJson(result.lighthouseJson),
  };

  const technicalAudit = await prisma.technicalAudit.upsert({
    where: {
      reportId,
    },
    create: {
      reportId,
      ...auditData,
    },
    update: auditData,
  });

  await saveFailureFinding(reportId, result);

  return {
    result,
    technicalAudit,
  };
}
