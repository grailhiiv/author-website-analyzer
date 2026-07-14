import { PageType } from "@/generated/prisma/client";
import {
  extractPageData,
  type ExtractedForm,
  type ExtractedImage,
  type ExtractedLink,
  type ExtractedPageData,
} from "@/lib/crawler/extract";
import { validatePublicHttpUrl, validateUrlForScan } from "@/lib/urls/security";

import * as cheerio from "cheerio";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

export const BROWSER_FALLBACK_POLICY_VERSION = "1.0.0";
export const BROWSER_FALLBACK_PAGE_LIMIT = 2;
export const BROWSER_FALLBACK_NAVIGATION_TIMEOUT_MS = 8_000;
export const BROWSER_FALLBACK_PAGE_DEADLINE_MS = 12_000;
export const BROWSER_FALLBACK_REPORT_DEADLINE_MS = 25_000;
export const BROWSER_FALLBACK_REQUEST_LIMIT = 40;
export const BROWSER_FALLBACK_REPORT_REQUEST_LIMIT = 80;
export const BROWSER_FALLBACK_MAX_HTML_BYTES = 2_000_000;

export type BrowserFallbackTriggerCode =
  | "empty_application_root"
  | "javascript_required_noscript"
  | "unresolved_widget_placeholder";

export type BrowserFallbackTrigger = {
  url: string;
  codes: BrowserFallbackTriggerCode[];
};

export type BrowserRenderResult = {
  requestedUrl: string;
  finalUrl: string;
  statusCode: number | null;
  html: string;
  htmlTruncated: boolean;
  requestCount: number;
  abortedRequestCount: number;
};

export type BrowserRenderSession = {
  render(url: string): Promise<BrowserRenderResult>;
  close(): Promise<void>;
};

export type BrowserRenderSessionFactory = (options: {
  homepageUrl: string;
  navigationTimeoutMs: number;
  requestLimit: number;
}) => Promise<BrowserRenderSession>;

const HIGH_VALUE_PAGE_TYPES = new Set<PageType>([
  PageType.HOME,
  PageType.ABOUT,
  PageType.BOOKS,
  PageType.NEWSLETTER,
  PageType.CONTACT,
]);

function normalizedWordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function detectBrowserFallbackTrigger({
  html,
  extracted,
  homepageUrl,
}: {
  html: string;
  extracted: ExtractedPageData;
  homepageUrl: string;
}): BrowserFallbackTrigger | null {
  if (
    extracted.url !== homepageUrl &&
    !HIGH_VALUE_PAGE_TYPES.has(extracted.pageType)
  ) {
    return null;
  }

  const meaningfulInternalLinks = extracted.links.internal.filter(
    (link) => link.text.trim().length >= 2,
  ).length;
  const $ = cheerio.load(html);
  const mainText = $("main, [role='main']").first().text().trim();
  const materiallyThin =
    extracted.wordCount < 80 &&
    (!extracted.h1 || normalizedWordCount(mainText) < 20 || meaningfulInternalLinks <= 2);

  if (!materiallyThin) {
    return null;
  }

  const codes: BrowserFallbackTriggerCode[] = [];
  const applicationRoot = $("#__next, #root, #app").first();
  const hasFrameworkBundle = $(
    "script[src*='_next/'], script[src*='webpack'], script[src*='vite'], script[type='module']",
  ).length > 0;

  if (
    applicationRoot.length > 0 &&
    normalizedWordCount(applicationRoot.text()) < 5 &&
    hasFrameworkBundle
  ) {
    codes.push("empty_application_root");
  }

  if (
    $("noscript")
      .toArray()
      .some((element) => /(?:enable|require(?:s|d)?)\s+javascript/i.test($(element).text()))
  ) {
    codes.push("javascript_required_noscript");
  }

  if (
    $("[data-widget], [data-embed], [data-reactroot], .newsletter-widget")
      .toArray()
      .some((element) => normalizedWordCount($(element).text()) < 5)
  ) {
    codes.push("unresolved_widget_placeholder");
  }

  return codes.length > 0 ? { url: extracted.url, codes } : null;
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function mergeRenderedExtraction(
  staticData: ExtractedPageData,
  renderedData: ExtractedPageData,
): { extracted: ExtractedPageData; adopted: boolean } {
  const renderedIsRicher =
    renderedData.wordCount >= staticData.wordCount + 20 ||
    (!staticData.h1 && Boolean(renderedData.h1)) ||
    renderedData.forms.length > staticData.forms.length ||
    renderedData.links.internal.length >= staticData.links.internal.length + 3;

  if (!renderedIsRicher) {
    return { extracted: staticData, adopted: false };
  }

  const linkKey = (link: ExtractedLink) => `${link.href}\u0000${link.text}\u0000${link.rel ?? ""}`;
  const imageKey = (image: ExtractedImage) => `${image.src}\u0000${image.alt ?? ""}`;
  const formKey = (form: ExtractedForm) =>
    `${form.action ?? ""}\u0000${form.method}\u0000${form.fields.map((field) => `${field.name}:${field.type}`).join("|")}`;

  return {
    adopted: true,
    extracted: {
      ...staticData,
      title: staticData.title || renderedData.title,
      metaDescription: staticData.metaDescription || renderedData.metaDescription,
      h1: staticData.h1 || renderedData.h1,
      h1Count: Math.max(staticData.h1Count, renderedData.h1Count),
      bodyText:
        renderedData.wordCount >= staticData.wordCount + 20
          ? renderedData.bodyText
          : staticData.bodyText,
      wordCount: Math.max(staticData.wordCount, renderedData.wordCount),
      headings: {
        h2: uniqueBy([...staticData.headings.h2, ...renderedData.headings.h2], (value) => value),
        h3: uniqueBy([...staticData.headings.h3, ...renderedData.headings.h3], (value) => value),
      },
      links: {
        internal: uniqueBy([...staticData.links.internal, ...renderedData.links.internal], linkKey),
        external: uniqueBy([...staticData.links.external, ...renderedData.links.external], linkKey),
        socialProfiles: uniqueBy(
          [...staticData.links.socialProfiles, ...renderedData.links.socialProfiles],
          linkKey,
        ),
        retailerLinks: uniqueBy(
          [...staticData.links.retailerLinks, ...renderedData.links.retailerLinks],
          linkKey,
        ),
        ctas: uniqueBy(
          [...staticData.links.ctas, ...renderedData.links.ctas],
          (cta) => `${cta.type}\u0000${cta.text}\u0000${cta.href ?? ""}`,
        ),
        emails: uniqueBy([...staticData.links.emails, ...renderedData.links.emails], (value) => value),
      },
      images: uniqueBy([...staticData.images, ...renderedData.images], imageKey),
      forms: uniqueBy([...staticData.forms, ...renderedData.forms], formKey),
      jsonLd: uniqueBy(
        [...staticData.jsonLd, ...renderedData.jsonLd],
        (value) => JSON.stringify(value),
      ),
      // Canonical and robots remain response/static-authoritative.
      seo: staticData.seo,
    },
  };
}

async function closePage(page: Page) {
  if (!page.isClosed()) await page.close({ runBeforeUnload: false });
}

export const createBrowserRenderSession: BrowserRenderSessionFactory = async ({
  homepageUrl,
  navigationTimeoutMs,
  requestLimit,
}) => {
  const homepageHostname = new URL(homepageUrl).hostname.toLowerCase();
  let browser: Browser | null = await chromium.launch({ headless: true });
  const context: BrowserContext = await browser.newContext({
    acceptDownloads: false,
    serviceWorkers: "block",
  });

  return {
    async render(url) {
      const validation = await validateUrlForScan(url, {
        timeoutMs: navigationTimeoutMs,
      });
      if (!validation.ok) throw new Error(validation.message);
      if (new URL(validation.finalUrl).hostname.toLowerCase() !== homepageHostname) {
        throw new Error("Browser navigation left the validated website hostname.");
      }

      const page = await context.newPage();
      page.on("popup", (popup) => void closePage(popup));
      const pageDeadline = setTimeout(
        () => void closePage(page).catch(() => undefined),
        BROWSER_FALLBACK_PAGE_DEADLINE_MS,
      );
      let requestCount = 0;
      let abortedRequestCount = 0;
      const hostnameValidation = new Map<string, Promise<boolean>>();

      page.on("dialog", (dialog) => void dialog.dismiss());
      await page.route("**/*", async (route) => {
        const request = route.request();
        const requestUrl = request.url();
        const resourceType = request.resourceType();

        requestCount += 1;
        if (
          requestCount > requestLimit ||
          ["media", "font", "websocket"].includes(resourceType)
        ) {
          abortedRequestCount += 1;
          await route.abort("blockedbyclient");
          return;
        }

        let parsed: URL;
        try {
          parsed = new URL(requestUrl);
        } catch {
          abortedRequestCount += 1;
          await route.abort("blockedbyclient");
          return;
        }

        if (["data:", "blob:"].includes(parsed.protocol) && !request.isNavigationRequest()) {
          await route.continue();
          return;
        }

        if (!["http:", "https:"].includes(parsed.protocol)) {
          abortedRequestCount += 1;
          await route.abort("blockedbyclient");
          return;
        }

        const requestHostname = parsed.hostname.toLowerCase();
        if (requestHostname !== homepageHostname) {
          abortedRequestCount += 1;
          await route.abort("blockedbyclient");
          return;
        }

        let safe = hostnameValidation.get(requestHostname);
        if (!safe) {
          safe = validatePublicHttpUrl(requestUrl).then((result) => result.ok);
          hostnameValidation.set(requestHostname, safe);
        }

        if (!(await safe)) {
          abortedRequestCount += 1;
          await route.abort("blockedbyclient");
          return;
        }

        await route.continue();
      });

      try {
        const response = await page.goto(validation.finalUrl, {
          waitUntil: "domcontentloaded",
          timeout: navigationTimeoutMs,
        });
        const contentType = response?.headers()["content-type"]?.toLowerCase() ?? "";
        if (
          response &&
          !contentType.includes("text/html") &&
          !contentType.includes("application/xhtml+xml")
        ) {
          throw new Error("The browser destination did not return HTML.");
        }
        await page.waitForLoadState("networkidle", { timeout: 1_500 }).catch(() => undefined);
        const finalUrl = page.url();
        const finalValidation = await validatePublicHttpUrl(finalUrl);
        if (
          !finalValidation.ok ||
          finalValidation.hostname.toLowerCase() !== homepageHostname
        ) {
          throw new Error("Browser navigation ended outside the validated website hostname.");
        }

        const statusCode = response?.status() ?? null;
        const fullHtml = await page.content();
        const html = fullHtml.slice(0, BROWSER_FALLBACK_MAX_HTML_BYTES);
        return {
          requestedUrl: url,
          finalUrl,
          statusCode,
          html,
          htmlTruncated: html.length < fullHtml.length,
          requestCount,
          abortedRequestCount,
        };
      } finally {
        clearTimeout(pageDeadline);
        await closePage(page);
      }
    },
    async close() {
      await context.close();
      await browser?.close();
      browser = null;
    },
  };
};

export function extractRenderedPage(result: BrowserRenderResult, siteOrigin: string) {
  return extractPageData(result.html, result.finalUrl, siteOrigin);
}
