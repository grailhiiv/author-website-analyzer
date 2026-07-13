import { Prisma } from "@/generated/prisma/client";
import { extractPageData, type ExtractedPageData } from "@/lib/crawler/extract";
import {
  CRAWL_PAGE_LIMIT,
  getCrawlContentFingerprint,
  normalizeCandidateUrl,
  prioritizeCrawlUrls,
} from "@/lib/crawler/prioritize";
import { prisma } from "@/lib/db/prisma.core";
import { validateUrlForScan } from "@/lib/urls/security";

import { CheerioCrawler, Configuration } from "@crawlee/cheerio";
import * as cheerio from "cheerio";

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_REDIRECT_LIMIT = 5;
const USER_AGENT = "GrailHiiv Author Website Analyzer";
const MAX_SITEMAPS = 8;
const MAX_SITEMAP_URLS = 50;

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

function sameHostname(url: string, hostname: string) {
  return new URL(url).hostname.toLowerCase() === hostname.toLowerCase();
}

async function fetchSitemapUrls(
  homepageUrl: string,
  options: ResolvedCrawlOptions,
) {
  const homepageHost = new URL(homepageUrl).hostname;
  const sitemapQueue = [new URL("/sitemap.xml", homepageUrl).toString()];
  const seenSitemaps = new Set<string>();
  const pageUrls = new Set<string>();

  while (
    sitemapQueue.length > 0 &&
    seenSitemaps.size < MAX_SITEMAPS &&
    pageUrls.size < MAX_SITEMAP_URLS
  ) {
    const sitemapUrl = sitemapQueue.shift();

    if (!sitemapUrl || seenSitemaps.has(sitemapUrl)) {
      continue;
    }

    seenSitemaps.add(sitemapUrl);
    const security = await validateUrlForScan(sitemapUrl, {
      redirectLimit: options.redirectLimit,
      timeoutMs: options.sitemapTimeoutMs,
    });

    if (!security.ok || !sameHostname(security.finalUrl, homepageHost)) {
      continue;
    }

    let response: Response;

    try {
      response = await fetchText(security.finalUrl, options.sitemapTimeoutMs);
    } catch {
      continue;
    }

    if (!response.ok) {
      continue;
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    $("url > loc").each((_, element) => {
      if (pageUrls.size >= MAX_SITEMAP_URLS) {
        return false;
      }

      const url = normalizeCandidateUrl($(element).text().trim(), homepageUrl);

      if (url && sameHostname(url, homepageHost)) {
        pageUrls.add(url);
      }

      return undefined;
    });

    $("sitemap > loc").each((_, element) => {
      if (sitemapQueue.length + seenSitemaps.size >= MAX_SITEMAPS) {
        return false;
      }

      const url = normalizeCandidateUrl($(element).text().trim(), homepageUrl);

      if (
        url &&
        sameHostname(url, homepageHost) &&
        !seenSitemaps.has(url)
      ) {
        sitemapQueue.push(url);
      }

      return undefined;
    });
  }

  return [...pageUrls];
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

  const requestedHomepageUrl = report.normalizedUrl || report.url;
  const homepageSecurity = await validateUrlForScan(requestedHomepageUrl, {
    redirectLimit: crawlOptions.redirectLimit,
    timeoutMs: crawlOptions.timeoutMs,
  });

  if (!homepageSecurity.ok) {
    throw new Error(homepageSecurity.message);
  }

  const homepageUrl = homepageSecurity.finalUrl;
  const homepageHostname = new URL(homepageUrl).hostname;
  const homepageNormalizedUrl =
    normalizeCandidateUrl(homepageUrl, homepageUrl) ?? homepageUrl;
  const siteOrigin = new URL(homepageUrl).origin;
  const sitemapUrls = await fetchSitemapUrls(homepageUrl, crawlOptions);
  const crawledPages: CrawledPageResult[] = [];
  const seenUrls = new Set<string>();
  const seenCanonicalUrls = new Set<string>();
  const seenContent = new Set<string>();
  const rememberPage = (page: CrawledPageResult) => {
    const normalizedUrl = normalizeCandidateUrl(page.finalUrl, homepageUrl);
    const canonicalUrl = page.extracted?.seo.canonicalUrl
      ? normalizeCandidateUrl(page.extracted.seo.canonicalUrl, homepageUrl)
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
    const normalizedUrl = normalizeCandidateUrl(page.finalUrl, homepageUrl);
    const canonicalUrl = page.extracted?.seo.canonicalUrl
      ? normalizeCandidateUrl(page.extracted.seo.canonicalUrl, homepageUrl)
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
  type SecurityValidation = Awaited<ReturnType<typeof validateUrlForScan>>;
  const securityCache = new Map<string, Promise<SecurityValidation>>();
  securityCache.set(homepageNormalizedUrl, Promise.resolve(homepageSecurity));
  const validateRequestUrl = (url: string) => {
    const normalizedUrl = normalizeCandidateUrl(url, homepageUrl) ?? url;
    let validation = securityCache.get(normalizedUrl);

    if (!validation) {
      validation = validateUrlForScan(normalizedUrl, {
        redirectLimit: crawlOptions.redirectLimit,
        timeoutMs: crawlOptions.timeoutMs,
      });
      securityCache.set(normalizedUrl, validation);
    }

    return validation;
  };
  let homepageError: string | null = null;
  const configuration = new Configuration({
    defaultRequestQueueId: `crawl-${reportId}`,
    persistStorage: false,
    purgeOnStart: true,
  });

  const crawler = new CheerioCrawler(
    {
      minConcurrency: 1,
      maxConcurrency: crawlOptions.concurrency,
      maxRequestRetries: 1,
      maxRequestsPerCrawl: crawlOptions.pageLimit * 3,
      navigationTimeoutSecs: Math.ceil(crawlOptions.timeoutMs / 1000),
      requestHandlerTimeoutSecs: Math.max(
        30,
        Math.ceil(crawlOptions.timeoutMs / 1000) * 2,
      ),
      preNavigationHooks: [
        async ({ request }, gotOptions) => {
          const security = await validateRequestUrl(request.url);

          if (!security.ok) {
            throw new Error(security.message);
          }

          if (!sameHostname(security.finalUrl, homepageHostname)) {
            throw new Error("The page redirected outside the scanned website.");
          }

          gotOptions.url = new URL(security.finalUrl);
          gotOptions.followRedirect = false;
          gotOptions.maxRedirects = 0;
          gotOptions.headers = {
            ...gotOptions.headers,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "User-Agent": USER_AGENT,
          };
        },
      ],
      async requestHandler({ request, response, body, contentType }) {
        const security = await validateRequestUrl(request.url);

        if (!security.ok || !sameHostname(security.finalUrl, homepageHostname)) {
          return;
        }

        const statusCode = response.statusCode ?? null;
        const isHtml =
          contentType.type === "text/html" ||
          contentType.type === "application/xhtml+xml";
        const html =
          statusCode !== null &&
          statusCode >= 200 &&
          statusCode < 300 &&
          isHtml
            ? typeof body === "string"
              ? body
              : body.toString("utf8")
            : null;
        const extracted = html
          ? extractPageData(html, security.finalUrl, siteOrigin)
          : null;
        const page: CrawledPageResult = {
          requestedUrl: request.url,
          finalUrl: security.finalUrl,
          statusCode,
          extracted,
        };

        if (
          !isDuplicatePage(page) &&
          crawledPages.length < crawlOptions.pageLimit
        ) {
          crawledPages.push(page);
          rememberPage(page);
        }

        if (crawledPages.length >= crawlOptions.pageLimit) {
          crawler.stop("The configured page limit was reached.");
          return;
        }

        if (!extracted) {
          return;
        }

        const currentUrl =
          normalizeCandidateUrl(security.finalUrl, homepageUrl) ??
          security.finalUrl;
        const nextUrls = prioritizeCrawlUrls({
          homepageUrl,
          sitemapUrls:
            currentUrl === homepageNormalizedUrl ? sitemapUrls : [],
          homepageInternalLinks: extracted.links.internal.map(
            (link) => link.href,
          ),
          limit: crawlOptions.pageLimit * 3,
        }).filter((url) => url !== currentUrl && !seenUrls.has(url));

        if (nextUrls.length > 0) {
          const result = await crawler.addRequests(
            nextUrls.map((url) => ({ url, uniqueKey: url })),
          );
          await result.waitForAllRequestsToBeAdded;
        }
      },
      failedRequestHandler({ request }, error) {
        const normalizedUrl =
          normalizeCandidateUrl(request.url, homepageUrl) ?? request.url;

        if (normalizedUrl === homepageNormalizedUrl) {
          homepageError = error.message;
        }
      },
    },
    configuration,
  );

  await crawler.run([{ url: homepageUrl, uniqueKey: homepageNormalizedUrl }]);

  if (crawledPages.length === 0) {
    throw new Error(homepageError ?? "The website homepage could not be crawled.");
  }

  await saveCrawledPages(reportId, crawledPages);

  return {
    reportId,
    homepageUrl,
    crawledUrls: crawledPages.map((page) => page.finalUrl),
    pagesSaved: crawledPages.length,
  };
}
