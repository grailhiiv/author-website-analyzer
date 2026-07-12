import {
  chromium,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
} from "playwright";

import {
  createLocalScreenshotStorage,
  type ScreenshotStorage,
  type ScreenshotStorageAsset,
} from "@/lib/screenshots/storage";
import { validateUrlForScan } from "@/lib/urls/security";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_REDIRECT_LIMIT = 5;
const DEFAULT_POST_LOAD_WAIT_MS = 1_000;

const DESKTOP_CONTEXT: BrowserContextOptions = {
  acceptDownloads: false,
  deviceScaleFactor: 1,
  viewport: {
    width: 1440,
    height: 1200,
  },
};

const MOBILE_CONTEXT: BrowserContextOptions = {
  acceptDownloads: false,
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  viewport: {
    width: 390,
    height: 844,
  },
};

export type ScreenshotVariant = "desktop" | "mobile";

export type HomepageScreenshotResult = {
  ok: boolean;
  homepageUrl: string;
  screenshots: Partial<Record<ScreenshotVariant, ScreenshotStorageAsset>>;
  errors: string[];
};

type CaptureHomepageScreenshotsOptions = {
  websiteDomain: string;
  browser?: Browser;
  storage?: ScreenshotStorage;
  timeoutMs?: number;
  redirectLimit?: number;
  waitAfterLoadMs?: number;
};

function contextOptionsForVariant(variant: ScreenshotVariant) {
  return variant === "desktop" ? DESKTOP_CONTEXT : MOBILE_CONTEXT;
}

function screenshotKey(websiteDomain: string, variant: ScreenshotVariant) {
  return `${websiteDomain}/homepage-${variant}.png`;
}

function isAllowedRequestProtocol(url: string) {
  try {
    const protocol = new URL(url).protocol;

    return ["http:", "https:", "about:", "blob:", "data:"].includes(protocol);
  } catch {
    return false;
  }
}

async function prepareContext(context: BrowserContext) {
  await context.route("**/*", async (route) => {
    if (!isAllowedRequestProtocol(route.request().url())) {
      await route.abort("blockedbyclient");
      return;
    }

    await route.continue();
  });
}

async function captureVariant(
  browser: Browser,
  targetUrl: string,
  variant: ScreenshotVariant,
  options: Required<
    Pick<
      CaptureHomepageScreenshotsOptions,
      "websiteDomain" | "storage" | "timeoutMs" | "waitAfterLoadMs"
    >
  >
) {
  const context = await browser.newContext(contextOptionsForVariant(variant));

  try {
    await prepareContext(context);

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(options.timeoutMs);
    page.setDefaultTimeout(options.timeoutMs);
    page.on("download", (download) => {
      void download.cancel().catch(() => undefined);
    });

    await page.goto(targetUrl, {
      timeout: options.timeoutMs,
      waitUntil: "domcontentloaded",
    });
    await page
      .waitForLoadState("networkidle", {
        timeout: Math.min(3_000, options.timeoutMs),
      })
      .catch(() => undefined);
    await waitAfterLoad(page, options.waitAfterLoadMs);
    assertPageStayedOnSafeProtocol(page);

    const buffer = await page.screenshot({
      // Save only what is visible in the configured desktop or mobile viewport.
      // Full-page captures become extremely tall and are not representative of
      // the browser-sized preview shown in the report overview.
      fullPage: false,
      timeout: options.timeoutMs,
      type: "png",
    });

    return await options.storage.save(
      buffer,
      screenshotKey(options.websiteDomain, variant)
    );
  } finally {
    await context.close().catch(() => undefined);
  }
}

async function waitAfterLoad(page: Page, waitMs: number) {
  if (waitMs <= 0) {
    return;
  }

  await page.waitForTimeout(waitMs);
}

function assertPageStayedOnSafeProtocol(page: Page) {
  if (!isAllowedRequestProtocol(page.url())) {
    throw new Error("The page tried to navigate to an unsafe URL.");
  }
}

export async function captureHomepageScreenshots(
  homepageUrl: string,
  options: CaptureHomepageScreenshotsOptions
): Promise<HomepageScreenshotResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const waitAfterLoadMs = Math.min(
    options.waitAfterLoadMs ?? DEFAULT_POST_LOAD_WAIT_MS,
    timeoutMs
  );
  const storage = options.storage ?? createLocalScreenshotStorage();
  const security = await validateUrlForScan(homepageUrl, {
    redirectLimit: options.redirectLimit ?? DEFAULT_REDIRECT_LIMIT,
    timeoutMs: Math.min(5_000, timeoutMs),
  });

  if (!security.ok) {
    return {
      ok: false,
      homepageUrl,
      screenshots: {},
      errors: [security.message],
    };
  }

  const browser = options.browser ?? (await chromium.launch({ headless: true }));
  const shouldCloseBrowser = !options.browser;
  const screenshots: Partial<Record<ScreenshotVariant, ScreenshotStorageAsset>> =
    {};
  const errors: string[] = [];

  try {
    const variants = [
      "desktop",
      "mobile",
    ] satisfies ScreenshotVariant[];
    const captures = await Promise.all(
      variants.map(async (variant) => {
        try {
          const asset = await captureVariant(
            browser,
            security.finalUrl,
            variant,
            {
              websiteDomain: options.websiteDomain,
              storage,
              timeoutMs,
              waitAfterLoadMs,
            }
          );

          return { asset, error: null, variant };
        } catch (error) {
          return {
            asset: null,
            error:
              error instanceof Error
                ? error.message
                : "Screenshot capture failed.",
            variant,
          };
        }
      })
    );

    for (const capture of captures) {
      if (capture.asset) {
        screenshots[capture.variant] = capture.asset;
      } else if (capture.error) {
        errors.push(`${capture.variant}: ${capture.error}`);
      }
    }
  } finally {
    if (shouldCloseBrowser) {
      await browser.close().catch(() => undefined);
    }
  }

  return {
    ok: errors.length === 0,
    homepageUrl: security.finalUrl,
    screenshots,
    errors,
  };
}
