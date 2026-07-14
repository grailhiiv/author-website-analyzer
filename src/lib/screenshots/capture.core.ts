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
import {
  buildVisualDesignAnalysis,
  type VisualDesignAnalysis,
  type VisualElementSample,
  type VisualViewportEvidence,
  type VisualViewportVariant,
} from "@/lib/screenshots/visual-design";
import { validateUrlForScan } from "@/lib/urls/security";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_REDIRECT_LIMIT = 5;
const DEFAULT_POST_LOAD_WAIT_MS = 1_000;
const TABLET_VIEWPORT = {
  width: 768,
  height: 1024,
};

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
  visualDesignAnalysis: VisualDesignAnalysis | null;
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

async function collectVisualViewportEvidence(
  page: Page,
  variant: VisualViewportVariant,
): Promise<VisualViewportEvidence> {
  // The tsx/esbuild runtime preserves nested function names with this helper.
  // Install the tiny equivalent in the page before Playwright serializes the
  // collector so the same code works in scripts, tests, and the app runtime.
  await page.evaluate(
    "globalThis.__name ??= ((target, value) => { try { Object.defineProperty(target, 'name', { value, configurable: true }); } catch {} return target; })",
  );

  return page.evaluate(async (viewportVariant) => {
    const SAMPLE_LIMIT = 5;
    const LABEL_LIMIT = 80;
    const MINIMUM_TAP_TARGET_PX = 24;
    const SMALL_TEXT_THRESHOLD_PX = 14;
    const MANY_FORM_FIELDS_THRESHOLD = 5;
    const OBSTRUCTIVE_OVERLAY_COVERAGE = 0.2;
    const CTA_PATTERN =
      /\b(buy|order|shop|read|sample|preview|subscribe|sign\s*up|join|newsletter|contact|get\s+in\s+touch|books?)\b/i;

    function round(value: number) {
      return Math.round(value * 100) / 100;
    }

    function normalizeLabel(value: string | null | undefined) {
      return (value ?? "").replace(/\s+/g, " ").trim().slice(0, LABEL_LIMIT);
    }

    function labelFor(element: Element) {
      if (element instanceof HTMLInputElement) {
        return normalizeLabel(
          element.getAttribute("aria-label") ||
            element.placeholder ||
            element.value ||
            element.name ||
            element.type,
        );
      }

      return normalizeLabel(
        element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          element.textContent ||
          element.tagName.toLowerCase(),
      );
    }

    function isRendered(element: Element) {
      const style = window.getComputedStyle(element);

      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number.parseFloat(style.opacity || "1") === 0
      ) {
        return false;
      }

      const rect = element.getBoundingClientRect();

      return rect.width > 0 && rect.height > 0;
    }

    function isInViewport(element: Element) {
      const rect = element.getBoundingClientRect();

      return (
        isRendered(element) &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth
      );
    }

    function isAboveFold(element: Element) {
      const rect = element.getBoundingClientRect();

      return isInViewport(element) && rect.top < window.innerHeight;
    }

    function sampleElement(element: Element): VisualElementSample {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return {
        label: labelFor(element) || element.tagName.toLowerCase(),
        width: round(rect.width),
        height: round(rect.height),
        fontSize: round(Number.parseFloat(style.fontSize || "0")),
      };
    }

    const allElements = Array.from(document.body?.querySelectorAll("*") ?? []);
    const visibleHeadings = Array.from(document.querySelectorAll("h1")).filter(
      isRendered,
    );
    const navigationRegions = Array.from(
      document.querySelectorAll("nav, [role='navigation']"),
    ).filter(isRendered);
    const navigationLinks = [
      ...new Set(
        navigationRegions.flatMap((navigation) =>
          Array.from(navigation.querySelectorAll("a[href]")),
        ),
      ),
    ].filter(isInViewport);
    const navigationControls = Array.from(
      document.querySelectorAll(
        "button[aria-controls], [role='button'][aria-controls], button[aria-label], button[title]",
      ),
    ).filter(
      (element) =>
        isInViewport(element) &&
        /\b(menu|navigation|nav)\b/i.test(labelFor(element)),
    );
    function isInternalLink(element: Element) {
      if (!(element instanceof HTMLAnchorElement)) {
        return false;
      }

      try {
        return new URL(element.href, window.location.href).origin ===
          window.location.origin;
      } catch {
        return false;
      }
    }

    let navigationControlActivationAttempted = false;
    let navigationControlRevealedLinks: Element[] = [];

    if (
      viewportVariant !== "desktop" &&
      navigationLinks.length === 0 &&
      navigationControls.length > 0
    ) {
      const control = navigationControls[0];
      const controlledId = control.getAttribute("aria-controls");
      const controlledElement = controlledId
        ? document.getElementById(controlledId)
        : null;
      const initiallyVisibleInternalLinks = new Set(
        Array.from(document.querySelectorAll("a[href]"))
          .filter((element) => isInternalLink(element) && isInViewport(element))
          .map((element) => (element as HTMLAnchorElement).href),
      );

      navigationControlActivationAttempted = true;

      try {
        (control as HTMLElement).click();
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );

        const candidates = controlledElement
          ? Array.from(controlledElement.querySelectorAll("a[href]"))
          : Array.from(document.querySelectorAll("a[href]"));

        navigationControlRevealedLinks = candidates.filter(
          (element) =>
            isInternalLink(element) &&
            isInViewport(element) &&
            (controlledElement !== null ||
              !initiallyVisibleInternalLinks.has(
                (element as HTMLAnchorElement).href,
              )),
        );
      } finally {
        try {
          (control as HTMLElement).click();
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
        } catch {
          // Closing a menu is cleanup only and must not discard captured evidence.
        }
      }
    }
    const interactiveElements = Array.from(
      document.querySelectorAll(
        "a[href], button, input:not([type='hidden']), select, textarea, [role='button'], [role='link']",
      ),
    ).filter(isRendered);
    const actionableElements = interactiveElements.filter((element) => {
      const isButtonLike =
        element instanceof HTMLButtonElement ||
        (element instanceof HTMLInputElement &&
          ["button", "submit"].includes(element.type)) ||
        element.getAttribute("role") === "button";
      const isNavigationLink = Boolean(
        element.closest("nav, [role='navigation']"),
      );

      return (
        CTA_PATTERN.test(labelFor(element)) &&
        (isButtonLike || !isNavigationLink)
      );
    });
    const forms = Array.from(document.querySelectorAll("form")).filter(
      isRendered,
    );
    const formFieldCounts = forms.map(
      (form) =>
        form.querySelectorAll(
          "input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea",
        ).length,
    );

    function hasClippingAncestor(element: Element) {
      let current = element.parentElement;

      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);

        if (["hidden", "clip", "auto", "scroll"].includes(style.overflowX)) {
          return true;
        }

        current = current.parentElement;
      }

      return false;
    }

    const horizontalOverflowElements = allElements.filter((element) => {
      if (!isRendered(element) || element.closest("[aria-hidden='true']")) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      const extendsPastViewport =
        rect.right > window.innerWidth + 4 || rect.left < -4;

      return extendsPastViewport && !hasClippingAncestor(element);
    });
    const textElements = allElements.filter((element) => {
      if (!isRendered(element)) {
        return false;
      }

      return Array.from(element.childNodes).some(
        (node) =>
          node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
      );
    });
    const undersizedText = textElements.filter((element) => {
      const fontSize = Number.parseFloat(
        window.getComputedStyle(element).fontSize || "0",
      );

      return fontSize > 0 && fontSize < SMALL_TEXT_THRESHOLD_PX;
    });
    const undersizedInteractive = interactiveElements.filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const isInlineTextLink =
        element instanceof HTMLAnchorElement &&
        style.display === "inline" &&
        (element.parentElement?.textContent?.trim().length ?? 0) >
          labelFor(element).length + 20;

      return (
        !isInlineTextLink &&
        (rect.width < MINIMUM_TAP_TARGET_PX ||
          rect.height < MINIMUM_TAP_TARGET_PX)
      );
    });

    type Rgb = { red: number; green: number; blue: number; alpha: number };

    function parseRgb(value: string): Rgb | null {
      const match = value.match(
        /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i,
      );

      if (!match) {
        return null;
      }

      return {
        red: Number(match[1]),
        green: Number(match[2]),
        blue: Number(match[3]),
        alpha: match[4] === undefined ? 1 : Number(match[4]),
      };
    }

    function backgroundFor(element: Element): Rgb | null {
      let current: Element | null = element;

      while (current) {
        const style = window.getComputedStyle(current);

        if (style.backgroundImage !== "none") {
          return null;
        }

        const color = parseRgb(style.backgroundColor);

        if (color && color.alpha >= 0.99) {
          return color;
        }

        current = current.parentElement;
      }

      return { red: 255, green: 255, blue: 255, alpha: 1 };
    }

    function luminance(color: Rgb) {
      const channels = [color.red, color.green, color.blue].map((channel) => {
        const normalized = channel / 255;

        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });

      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }

    const contrastResults = textElements.flatMap((element) => {
      const style = window.getComputedStyle(element);
      const foreground = parseRgb(style.color);
      const background = backgroundFor(element);

      if (!foreground || foreground.alpha < 0.99 || !background) {
        return [];
      }

      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      const ratio = (lighter + 0.05) / (darker + 0.05);
      const fontSize = Number.parseFloat(style.fontSize || "0");
      const fontWeight = Number.parseInt(style.fontWeight || "400", 10) || 400;
      const isLargeText =
        fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const threshold = isLargeText ? 3 : 4.5;

      return [{ element, ratio, fails: ratio < threshold }];
    });
    const lowContrastResults = contrastResults.filter((result) => result.fails);
    const overlayCandidates = allElements.flatMap((element) => {
      const style = window.getComputedStyle(element);

      if (style.position !== "fixed" || !isInViewport(element)) {
        return [];
      }

      const rect = element.getBoundingClientRect();
      const visibleWidth = Math.max(
        0,
        Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0),
      );
      const visibleHeight = Math.max(
        0,
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0),
      );
      const coverage =
        (visibleWidth * visibleHeight) /
        Math.max(1, window.innerWidth * window.innerHeight);
      const isInteractiveOverlay =
        element.matches("[role='dialog'], [aria-modal='true']") ||
        Boolean(
          element.querySelector(
            "button, a[href], input, select, textarea, [role='button']",
          ),
        );

      return coverage >= OBSTRUCTIVE_OVERLAY_COVERAGE && isInteractiveOverlay
        ? [coverage]
        : [];
    });
    const lowContrastSamples = lowContrastResults
      .slice(0, SAMPLE_LIMIT)
      .map(({ element, ratio }) => ({
        ...sampleElement(element),
        contrastRatio: round(ratio),
      }));

    return {
      variant: viewportVariant,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentWidth: Math.max(
        document.documentElement.scrollWidth,
        document.body?.scrollWidth ?? 0,
      ),
      documentHeight: Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0,
      ),
      visibleHeadingCount: visibleHeadings.length,
      headingsAboveFoldCount: visibleHeadings.filter(isAboveFold).length,
      visibleNavigationCount: navigationRegions.length,
      visibleNavigationControlCount: navigationControls.length,
      navigationLinkCount: navigationLinks.length,
      navigationControlActivationAttempted,
      navigationControlRevealedLinkCount:
        navigationControlRevealedLinks.length,
      navigationControlSamples: navigationControls
        .slice(0, SAMPLE_LIMIT)
        .map(labelFor)
        .filter(Boolean),
      navigationLinkSamples: navigationLinks
        .slice(0, SAMPLE_LIMIT)
        .map(labelFor)
        .filter(Boolean),
      navigationControlRevealedLinkSamples: navigationControlRevealedLinks
        .slice(0, SAMPLE_LIMIT)
        .map(labelFor)
        .filter(Boolean),
      visibleCtaCount: actionableElements.length,
      ctasAboveFoldCount: actionableElements.filter(isAboveFold).length,
      ctaSamples: actionableElements
        .slice(0, SAMPLE_LIMIT)
        .map(labelFor)
        .filter(Boolean),
      visibleFormCount: forms.length,
      formsWithManyFieldsCount: formFieldCounts.filter(
        (count) => count > MANY_FORM_FIELDS_THRESHOLD,
      ).length,
      largestFormFieldCount: Math.max(0, ...formFieldCounts),
      formSamples: forms.slice(0, SAMPLE_LIMIT).map((form, index) => {
        const label =
          normalizeLabel(form.getAttribute("aria-label")) ||
          `Form ${index + 1}`;

        return `${label} (${formFieldCounts[index]} fields)`;
      }),
      interactiveElementCount: interactiveElements.length,
      undersizedInteractiveCount: undersizedInteractive.length,
      undersizedInteractiveSamples: undersizedInteractive
        .slice(0, SAMPLE_LIMIT)
        .map(sampleElement),
      textElementCount: textElements.length,
      undersizedTextCount: undersizedText.length,
      undersizedTextSamples: undersizedText
        .slice(0, SAMPLE_LIMIT)
        .map(sampleElement),
      contrastTextCount: contrastResults.length,
      lowContrastTextCount: lowContrastResults.length,
      lowContrastTextSamples: lowContrastSamples,
      horizontalOverflowElementCount: horizontalOverflowElements.length,
      horizontalOverflowElementSamples: horizontalOverflowElements
        .slice(0, SAMPLE_LIMIT)
        .map(sampleElement),
      obstructiveOverlayCount: overlayCandidates.length,
      largestOverlayCoverage: round(Math.max(0, ...overlayCandidates)),
    };
  }, variant);
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
  >,
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

    await page
      .addStyleTag({
        content:
          "*, *::before, *::after { animation-delay: 0s !important; animation-duration: 0s !important; transition-duration: 0s !important; caret-color: transparent !important; }",
      })
      .catch(() => undefined);

    const visualEvidence: VisualViewportEvidence[] = [];
    const visualErrors: string[] = [];

    try {
      visualEvidence.push(await collectVisualViewportEvidence(page, variant));
    } catch (error) {
      visualErrors.push(
        `${variant}: ${
          error instanceof Error
            ? error.message
            : "Visual evidence collection failed."
        }`,
      );
    }

    const buffer = await page.screenshot({
      // Save only what is visible in the configured desktop or mobile viewport.
      // Full-page captures become extremely tall and are not representative of
      // the browser-sized preview shown in the report overview.
      fullPage: false,
      timeout: options.timeoutMs,
      type: "png",
    });

    if (variant === "desktop") {
      try {
        await page.setViewportSize(TABLET_VIEWPORT);
        await page.waitForTimeout(150);
        visualEvidence.push(
          await collectVisualViewportEvidence(page, "tablet"),
        );
      } catch (error) {
        visualErrors.push(
          `tablet: ${
            error instanceof Error
              ? error.message
              : "Visual evidence collection failed."
          }`,
        );
      }
    }

    const asset = await options.storage.save(
      buffer,
      screenshotKey(options.websiteDomain, variant),
    );

    return { asset, visualEvidence, visualErrors };
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
  options: CaptureHomepageScreenshotsOptions,
): Promise<HomepageScreenshotResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const waitAfterLoadMs = Math.min(
    options.waitAfterLoadMs ?? DEFAULT_POST_LOAD_WAIT_MS,
    timeoutMs,
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
      visualDesignAnalysis: null,
      errors: [security.message],
    };
  }

  const browser =
    options.browser ?? (await chromium.launch({ headless: true }));
  const shouldCloseBrowser = !options.browser;
  const screenshots: Partial<
    Record<ScreenshotVariant, ScreenshotStorageAsset>
  > = {};
  const errors: string[] = [];
  const visualEvidence: VisualViewportEvidence[] = [];
  const visualErrors: string[] = [];

  try {
    const variants = ["desktop", "mobile"] satisfies ScreenshotVariant[];
    const captures = await Promise.all(
      variants.map(async (variant) => {
        try {
          const capture = await captureVariant(
            browser,
            security.finalUrl,
            variant,
            {
              websiteDomain: options.websiteDomain,
              storage,
              timeoutMs,
              waitAfterLoadMs,
            },
          );

          return { capture, error: null, variant };
        } catch (error) {
          return {
            capture: null,
            error:
              error instanceof Error
                ? error.message
                : "Screenshot capture failed.",
            variant,
          };
        }
      }),
    );

    for (const capture of captures) {
      if (capture.capture) {
        screenshots[capture.variant] = capture.capture.asset;
        visualEvidence.push(...capture.capture.visualEvidence);
        visualErrors.push(...capture.capture.visualErrors);
      } else if (capture.error) {
        errors.push(`${capture.variant}: ${capture.error}`);
        visualErrors.push(`${capture.variant}: ${capture.error}`);
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
    visualDesignAnalysis: buildVisualDesignAnalysis(
      visualEvidence,
      visualErrors,
    ),
    errors,
  };
}
