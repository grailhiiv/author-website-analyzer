import { PageType } from "@/generated/prisma/client";
import { detectPageType } from "@/lib/crawler/extract";

const PRIORITY_PATHS = [
  "/",
  "/books",
  "/book",
  "/my-books",
  "/novels",
  "/series",
  "/bibliography",
  "/titles",
  "/works",
  "/about",
  "/about-me",
  "/author",
  "/bio",
  "/newsletter",
  "/subscribe",
  "/reader-list",
  "/contact",
  "/contact-us",
  "/privacy",
  "/privacy-policy",
  "/privacy-notice",
  "/privacy-disclosure",
  "/blog",
  "/news",
  "/media",
  "/press",
  "/press-kit",
  "/events",
];

const TRACKING_PARAMETER_PATTERNS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^mc_/i,
];

export const CRAWL_PAGE_LIMIT = 10;

export function normalizeCandidateUrl(url: string, homepageUrl: string) {
  try {
    const parsed = new URL(url, homepageUrl);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, "/");

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (TRACKING_PARAMETER_PATTERNS.some((pattern) => pattern.test(key))) {
        parsed.searchParams.delete(key);
      }
    }

    parsed.searchParams.sort();
    return parsed.toString();
  } catch {
    return null;
  }
}

export function parseRobotsSitemapUrls(
  robotsText: string,
  robotsUrl: string,
) {
  const sitemapUrls = new Set<string>();

  for (const line of robotsText.split(/\r?\n/)) {
    const match = line.match(/^\s*sitemap\s*:\s*(\S+)\s*$/i);

    if (!match) {
      continue;
    }

    try {
      const parsed = new URL(match[1], robotsUrl);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        continue;
      }

      parsed.hash = "";
      sitemapUrls.add(parsed.toString());
    } catch {
      // Ignore malformed Sitemap directives.
    }
  }

  return [...sitemapUrls];
}

export function getCrawlContentFingerprint(page: {
  title?: string | null;
  h1?: string | null;
  bodyText?: string | null;
}) {
  const content = [page.title, page.h1, page.bodyText]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();

  return content.length >= 100 ? content : null;
}

function isSameHostname(url: string, homepageUrl: string) {
  return (
    new URL(url).hostname.toLowerCase() ===
    new URL(homepageUrl).hostname.toLowerCase()
  );
}

function getPriorityScore(url: string) {
  const parsed = new URL(url);
  const path =
    parsed.pathname
      .toLowerCase()
      .replace(/\.html?$/i, "")
      .replace(/-{2,}/g, "-")
      .replace(/\/+$/, "") || "/";

  if (path === "/home" || path.startsWith("/home/")) {
    return 9_000;
  }

  // An archive index is useful; its individual entries should not consume the
  // bounded crawl budget before core author, book, contact, and policy pages.
  if (/^\/(?:events|appearances|calendar)\/.+/.test(path)) {
    return 12_000 + path.length;
  }

  const pageTypePriority: Record<PageType, number> = {
    [PageType.HOME]: 0,
    [PageType.ABOUT]: 1,
    [PageType.BOOKS]: 2,
    [PageType.NEWSLETTER]: 3,
    [PageType.CONTACT]: 4,
    [PageType.EVENTS]: 5,
    [PageType.MEDIA_KIT]: 6,
    [PageType.BLOG]: 7,
    [PageType.UNKNOWN]: 8,
  };
  const pageType = detectPageType(url);
  const exactIndex = PRIORITY_PATHS.indexOf(path);

  const prefixIndex = PRIORITY_PATHS.findIndex(
    (priorityPath) =>
      priorityPath !== "/" && path.startsWith(`${priorityPath}/`),
  );
  const pathPriority =
    exactIndex >= 0
      ? exactIndex
      : prefixIndex >= 0
        ? PRIORITY_PATHS.length + prefixIndex
        : PRIORITY_PATHS.length * 2;

  if (/\/privacy(?:-(?:policy|notice|disclosure))?$/.test(path)) {
    return 4_500 + pathPriority;
  }

  const nestedBookDetailPenalty =
    pageType === PageType.BOOKS &&
    path.split("/").filter(Boolean).length > 1
      ? 3_000
      : 0;

  return (
    pageTypePriority[pageType] * 1_000 +
    nestedBookDetailPenalty +
    pathPriority
  );
}

export function prioritizeCrawlUrls({
  homepageUrl,
  sitemapUrls = [],
  homepageInternalLinks = [],
  limit = CRAWL_PAGE_LIMIT,
}: {
  homepageUrl: string;
  sitemapUrls?: string[];
  homepageInternalLinks?: string[];
  limit?: number;
}) {
  const homepage = normalizeCandidateUrl(homepageUrl, homepageUrl);

  if (!homepage) {
    return [];
  }

  const candidates = new Map<string, string>();
  candidates.set(homepage, homepage);

  for (const candidate of [...sitemapUrls, ...homepageInternalLinks]) {
    const normalized = normalizeCandidateUrl(candidate, homepage);

    if (!normalized || !isSameHostname(normalized, homepage)) {
      continue;
    }

    if (new URL(normalized).pathname.endsWith(".xml")) {
      continue;
    }

    candidates.set(normalized, normalized);
  }

  return Array.from(candidates.values())
    .sort((a, b) => {
      if (a === homepage) {
        return -1;
      }

      if (b === homepage) {
        return 1;
      }

      const scoreDifference = getPriorityScore(a) - getPriorityScore(b);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return new URL(a).pathname.length - new URL(b).pathname.length;
    })
    .slice(0, limit);
}

export const crawlPriorityTestExports = {
  getPriorityScore,
  normalizeCandidateUrl,
};
