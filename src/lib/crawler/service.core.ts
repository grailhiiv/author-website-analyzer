import { Prisma } from "@/generated/prisma/client";
import { extractPageData, type ExtractedPageData } from "@/lib/crawler/extract";
import { mapWithConcurrency } from "@/lib/analysis/concurrency";
import {
  CRAWL_PAGE_LIMIT,
  getCrawlContentFingerprint,
  normalizeCandidateUrl,
  prioritizeCrawlUrls,
} from "@/lib/crawler/prioritize";
import { prisma } from "@/lib/db/prisma.core";
import { validateUrlForScan } from "@/lib/urls/security";

import * as cheerio from "cheerio";

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_REDIRECT_LIMIT = 5;
const USER_AGENT = "GrailHiiv Author Website Analyzer";

type CrawlOptions = {
  pageLimit?: number;
  timeoutMs?: number;
  redirectLimit?: number;
  concurrency?: number;
  sitemapTimeoutMs?: number;
};

type ResolvedCrawlOptions = {
  pageLimit: number;
  timeoutMs: number;
  redirectLimit: number;
  concurrency: number;
  sitemapTimeoutMs: number;
};

type FetchedPage =
  | {
      ok: true;
      requestedUrl: string;
      finalUrl: string;
      statusCode: number;
      html: string | null;
    }
  | {
      ok: false;
      requestedUrl: string;
      message: string;
    };

export type CrawledPageResult = {
  requestedUrl: string;
  finalUrl: string;
  statusCode: number | null;
  extracted: ExtractedPageData | null;
  errorMessage?: string;
};

export type CrawlReportResult = {
  reportId: string;
  homepageUrl: string;
  crawledUrls: string[];
  pagesSaved: number;
};

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

async function fetchText(url: string, timeoutMs: number) {
  const timeout = timeoutSignal(timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: timeout.signal,
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": USER_AGENT,
      },
    });
  } finally {
    timeout.clear();
  }
}

async function fetchPage(
  requestedUrl: string,
  options: ResolvedCrawlOptions,
): Promise<FetchedPage> {
  const security = await validateUrlForScan(requestedUrl, {
    redirectLimit: options.redirectLimit,
    timeoutMs: options.timeoutMs,
  });

  if (!security.ok) {
    return {
      ok: false,
      requestedUrl,
      message: security.message,
    };
  }

  let response: Response;

  try {
    response = await fetchText(security.finalUrl, options.timeoutMs);
  } catch {
    return {
      ok: false,
      requestedUrl,
      message: "The page could not be reached quickly enough.",
    };
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isHtml =
    contentType.length === 0 ||
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml");

  if (!response.ok || !isHtml) {
    return {
      ok: true,
      requestedUrl,
      finalUrl: security.finalUrl,
      statusCode: response.status,
      html: null,
    };
  }

  return {
    ok: true,
    requestedUrl,
    finalUrl: security.finalUrl,
    statusCode: response.status,
    html: await response.text(),
  };
}

function sameHostname(url: string, hostname: string) {
  return new URL(url).hostname.toLowerCase() === hostname.toLowerCase();
}

async function fetchSitemapUrls(
  homepageUrl: string,
  options: ResolvedCrawlOptions,
) {
  const sitemapUrl = new URL("/sitemap.xml", homepageUrl).toString();
  const security = await validateUrlForScan(sitemapUrl, {
    redirectLimit: options.redirectLimit,
    timeoutMs: options.sitemapTimeoutMs,
  });

  if (!security.ok) {
    return [];
  }

  let response: Response;

  try {
    response = await fetchText(security.finalUrl, options.sitemapTimeoutMs);
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const xml = await response.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const homepageHost = new URL(homepageUrl).hostname;

  return $("url > loc, sitemap > loc")
    .map((_, element) => $(element).text().trim())
    .get()
    .filter((url) => {
      try {
        return (
          ["http:", "https:"].includes(new URL(url).protocol) &&
          sameHostname(url, homepageHost)
        );
      } catch {
        return false;
      }
    })
    .slice(0, 50);
}

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
      },
    });
  }
}

export async function crawlReportWebsite(
  reportId: string,
  options: CrawlOptions = {},
): Promise<CrawlReportResult> {
  const crawlOptions = {
    pageLimit: Math.min(
      options.pageLimit ?? CRAWL_PAGE_LIMIT,
      CRAWL_PAGE_LIMIT,
    ),
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    redirectLimit: options.redirectLimit ?? DEFAULT_REDIRECT_LIMIT,
    concurrency: Math.max(1, Math.min(options.concurrency ?? 4, 4)),
    sitemapTimeoutMs: options.sitemapTimeoutMs ?? 3_000,
  } satisfies ResolvedCrawlOptions;
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

  const homepage = await fetchPage(
    report.normalizedUrl || report.url,
    crawlOptions,
  );

  if (!homepage.ok) {
    throw new Error(homepage.message);
  }

  const siteOrigin = new URL(homepage.finalUrl).origin;
  const crawledPages: CrawledPageResult[] = [];
  const homepageExtracted = homepage.html
    ? extractPageData(homepage.html, homepage.finalUrl, siteOrigin)
    : null;

  crawledPages.push({
    requestedUrl: homepage.requestedUrl,
    finalUrl: homepage.finalUrl,
    statusCode: homepage.statusCode,
    extracted: homepageExtracted,
  });

  const sitemapUrls = await fetchSitemapUrls(homepage.finalUrl, crawlOptions);
  const homepageLinks =
    homepageExtracted?.links.internal.map((link) => link.href) ?? [];
  const crawlQueue = prioritizeCrawlUrls({
    homepageUrl: homepage.finalUrl,
    sitemapUrls,
    homepageInternalLinks: homepageLinks,
    limit: crawlOptions.pageLimit * 3,
  });

  const homepageHostname = new URL(homepage.finalUrl).hostname;
  const seenUrls = new Set<string>();
  const seenCanonicalUrls = new Set<string>();
  const seenContent = new Set<string>();
  const rememberPage = (page: CrawledPageResult) => {
    const normalizedUrl = normalizeCandidateUrl(
      page.finalUrl,
      homepage.finalUrl,
    );
    const canonicalUrl = page.extracted?.seo.canonicalUrl
      ? normalizeCandidateUrl(
          page.extracted.seo.canonicalUrl,
          homepage.finalUrl,
        )
      : null;
    const fingerprint = page.extracted
      ? getCrawlContentFingerprint(page.extracted)
      : null;

    if (normalizedUrl) {
      seenUrls.add(normalizedUrl);
    }

    if (canonicalUrl) {
      seenCanonicalUrls.add(canonicalUrl);
    }

    if (fingerprint) {
      seenContent.add(fingerprint);
    }
  };
  const isDuplicatePage = (page: CrawledPageResult) => {
    const normalizedUrl = normalizeCandidateUrl(
      page.finalUrl,
      homepage.finalUrl,
    );
    const canonicalUrl = page.extracted?.seo.canonicalUrl
      ? normalizeCandidateUrl(
          page.extracted.seo.canonicalUrl,
          homepage.finalUrl,
        )
      : null;
    const fingerprint = page.extracted
      ? getCrawlContentFingerprint(page.extracted)
      : null;

    return Boolean(
      (normalizedUrl && seenUrls.has(normalizedUrl)) ||
      (canonicalUrl &&
        (seenUrls.has(canonicalUrl) || seenCanonicalUrls.has(canonicalUrl))) ||
      (fingerprint && seenContent.has(fingerprint)),
    );
  };

  rememberPage(crawledPages[0]);

  for (
    let index = 1;
    index < crawlQueue.length && crawledPages.length < crawlOptions.pageLimit;
    index += crawlOptions.concurrency
  ) {
    const batch = crawlQueue.slice(index, index + crawlOptions.concurrency);
    const secondaryPages = await mapWithConcurrency(
      batch,
      crawlOptions.concurrency,
      async (targetUrl): Promise<CrawledPageResult | null> => {
        const page = await fetchPage(targetUrl, crawlOptions);

        if (!page.ok || !sameHostname(page.finalUrl, homepageHostname)) {
          return null;
        }

        return {
          requestedUrl: page.requestedUrl,
          finalUrl: page.finalUrl,
          statusCode: page.statusCode,
          extracted: page.html
            ? extractPageData(page.html, page.finalUrl, siteOrigin)
            : null,
        };
      },
    );

    for (const page of secondaryPages) {
      if (
        !page ||
        isDuplicatePage(page) ||
        crawledPages.length >= crawlOptions.pageLimit
      ) {
        continue;
      }

      crawledPages.push(page);
      rememberPage(page);
    }
  }

  await saveCrawledPages(reportId, crawledPages);

  return {
    reportId,
    homepageUrl: homepage.finalUrl,
    crawledUrls: crawledPages.map((page) => page.finalUrl),
    pagesSaved: crawledPages.length,
  };
}
