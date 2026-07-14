import { Prisma } from "@/generated/prisma/client";
import {
  crawlWebsite,
  type CrawledPageResult,
  type CrawlOptions,
  type CrawlReportResult,
} from "@/lib/crawler/service.core";
import { prisma } from "@/lib/db/prisma.core";

function toJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

async function saveCrawledPages(reportId: string, pages: CrawledPageResult[]) {
  await prisma.pageScanned.deleteMany({
    where: {
      reportId,
    },
  });

  for (const page of pages) {
    if (!page.extracted) {
      await prisma.pageScanned.create({
        data: {
          reportId,
          url: page.finalUrl,
          statusCode: page.statusCode,
        },
      });
      continue;
    }

    await prisma.pageScanned.create({
      data: {
        reportId,
        url: page.extracted.url,
        pageType: page.extracted.pageType,
        statusCode: page.statusCode,
        title: page.extracted.title,
        metaDescription: page.extracted.metaDescription,
        h1: page.extracted.h1,
        headingsJson: toJson({
          h1Count: page.extracted.h1Count,
          h2: page.extracted.headings.h2,
          h3: page.extracted.headings.h3,
          bodyText: page.extracted.bodyText,
          jsonLd: page.extracted.jsonLd,
          canonicalUrl: page.extracted.seo.canonicalUrl,
          robots: page.extracted.seo.robots,
        }),
        linksJson: toJson(page.extracted.links),
        imagesJson: toJson(page.extracted.images),
        formsJson: toJson(page.extracted.forms),
        wordCount: page.extracted.wordCount,
        ...(page.renderedEvidence
          ? { renderedJson: toJson(page.renderedEvidence) }
          : {}),
      },
    });
  }
}

export async function crawlReportWebsite(
  reportId: string,
  options: CrawlOptions = {},
): Promise<CrawlReportResult> {
  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
    select: {
      normalizedUrl: true,
      url: true,
    },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  const result = await crawlWebsite(report.normalizedUrl || report.url, options);

  await saveCrawledPages(reportId, result.pages);
  await prisma.report.update({
    where: {
      id: reportId,
    },
    data: {
      crawlDiagnostics: toJson(result.diagnostics),
    },
  });

  if (result.failureMessage) {
    throw new Error(result.failureMessage);
  }

  return {
    reportId,
    homepageUrl: result.homepageUrl,
    crawledUrls: result.crawledUrls,
    pagesSaved: result.successfulHtmlPages,
    diagnostics: result.diagnostics,
  };
}
