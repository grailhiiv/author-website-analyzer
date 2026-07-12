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

    if (parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }

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
  const path = parsed.pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const exactIndex = PRIORITY_PATHS.indexOf(path);

  if (exactIndex >= 0) {
    return exactIndex;
  }

  if (path === "/home" || path.startsWith("/home/")) {
    return PRIORITY_PATHS.length * 3;
  }

  const prefixIndex = PRIORITY_PATHS.findIndex(
    (priorityPath) =>
      priorityPath !== "/" && path.startsWith(`${priorityPath}/`),
  );

  if (prefixIndex >= 0) {
    return prefixIndex + PRIORITY_PATHS.length;
  }

  return PRIORITY_PATHS.length * 4;
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

      const pageTypeDifference = detectPageType(a).localeCompare(
        detectPageType(b),
      );

      if (pageTypeDifference !== 0) {
        return pageTypeDifference;
      }

      return new URL(a).pathname.length - new URL(b).pathname.length;
    })
    .slice(0, limit);
}

export const crawlPriorityTestExports = {
  getPriorityScore,
  normalizeCandidateUrl,
};
