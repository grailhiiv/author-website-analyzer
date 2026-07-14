export const PAGESPEED_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export const DEFAULT_PAGESPEED_TIMEOUT_MS = 60_000;

export const PAGESPEED_CATEGORIES = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
] as const;

export const KEY_LIGHTHOUSE_AUDIT_IDS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "cumulative-layout-shift",
  "total-blocking-time",
  "speed-index",
  "interactive",
  "server-response-time",
  "render-blocking-resources",
  "uses-responsive-images",
  "image-size-responsive",
  "document-title",
  "meta-description",
  "viewport",
] as const;

export type PageSpeedStrategy = "mobile" | "desktop";

export type PageSpeedScores = {
  performance: number | null;
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
};

export type KeyLighthouseAudit = {
  id: string;
  title: string | null;
  score: number | null;
  numericValue: number | null;
  displayValue: string | null;
};

export type KeyLighthouseData = {
  strategy: PageSpeedStrategy;
  finalUrl: string | null;
  fetchTime: string | null;
  lighthouseVersion: string | null;
  categories: PageSpeedScores;
  audits: Record<string, KeyLighthouseAudit | null>;
};

export type PageSpeedStrategySuccess = {
  ok: true;
  strategy: PageSpeedStrategy;
  scores: PageSpeedScores;
  lighthouse: KeyLighthouseData;
};

export type PageSpeedStrategyFailure = {
  ok: false;
  strategy: PageSpeedStrategy;
  scores: PageSpeedScores;
  lighthouse: KeyLighthouseData | null;
  error: string;
};

export type PageSpeedStrategyResult =
  | PageSpeedStrategySuccess
  | PageSpeedStrategyFailure;

export type PageSpeedAuditResult = {
  homepageUrl: string;
  mobile: PageSpeedStrategyResult;
  desktop: PageSpeedStrategyResult;
  lighthouseJson: {
    source: "pagespeed-insights";
    homepageUrl: string;
    mobile: KeyLighthouseData | null;
    desktop: KeyLighthouseData | null;
    errors: Partial<Record<PageSpeedStrategy, string>>;
  };
};

type FetchImplementation = (
  input: string | URL,
  init?: RequestInit
) => Promise<Response>;

type PageSpeedOptions = {
  apiKey: string;
  timeoutMs?: number;
  fetchImplementation?: FetchImplementation;
};

type LighthouseCategory = {
  score?: number | null;
};

type LighthouseAudit = {
  id?: string;
  title?: string;
  score?: number | null;
  numericValue?: number;
  displayValue?: string;
};

type PageSpeedApiResponse = {
  lighthouseResult?: {
    finalUrl?: string;
    fetchTime?: string;
    lighthouseVersion?: string;
    categories?: Partial<
      Record<(typeof PAGESPEED_CATEGORIES)[number], LighthouseCategory>
    >;
    audits?: Record<string, LighthouseAudit | undefined>;
  };
};

const EMPTY_SCORES: PageSpeedScores = {
  performance: null,
  accessibility: null,
  seo: null,
  bestPractices: null,
};

function cloneEmptyScores(): PageSpeedScores {
  return { ...EMPTY_SCORES };
}

export function normalizePageSpeedScore(score: unknown) {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  const normalizedScore = score <= 1 ? score * 100 : score;

  return Math.max(0, Math.min(100, Math.round(normalizedScore)));
}

export function extractPageSpeedScores(
  response: PageSpeedApiResponse
): PageSpeedScores {
  const categories = response.lighthouseResult?.categories;

  return {
    performance: normalizePageSpeedScore(categories?.performance?.score),
    accessibility: normalizePageSpeedScore(categories?.accessibility?.score),
    seo: normalizePageSpeedScore(categories?.seo?.score),
    bestPractices: normalizePageSpeedScore(
      categories?.["best-practices"]?.score
    ),
  };
}

function pickAudit(audit: LighthouseAudit | undefined, id: string) {
  if (!audit) {
    return null;
  }

  return {
    id: audit.id ?? id,
    title: audit.title ?? null,
    score: normalizePageSpeedScore(audit.score),
    numericValue:
      typeof audit.numericValue === "number" && Number.isFinite(audit.numericValue)
        ? audit.numericValue
        : null,
    displayValue: audit.displayValue ?? null,
  };
}

export function extractKeyLighthouseData(
  strategy: PageSpeedStrategy,
  response: PageSpeedApiResponse
): KeyLighthouseData {
  const lighthouseResult = response.lighthouseResult;
  const audits = lighthouseResult?.audits ?? {};

  return {
    strategy,
    finalUrl: lighthouseResult?.finalUrl ?? null,
    fetchTime: lighthouseResult?.fetchTime ?? null,
    lighthouseVersion: lighthouseResult?.lighthouseVersion ?? null,
    categories: extractPageSpeedScores(response),
    audits: Object.fromEntries(
      KEY_LIGHTHOUSE_AUDIT_IDS.map((id) => [id, pickAudit(audits[id], id)])
    ),
  };
}

export function buildPageSpeedUrl(
  homepageUrl: string,
  strategy: PageSpeedStrategy,
  apiKey: string
) {
  const url = new URL(PAGESPEED_ENDPOINT);

  url.searchParams.set("url", homepageUrl);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("strategy", strategy);

  for (const category of PAGESPEED_CATEGORIES) {
    url.searchParams.append("category", category);
  }

  return url;
}

async function fetchJsonWithTimeout(
  url: URL,
  timeoutMs: number,
  fetchImplementation: FetchImplementation
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImplementation(url, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`PageSpeed Insights returned HTTP ${response.status}.`);
    }

    return (await response.json()) as PageSpeedApiResponse;
  } finally {
    clearTimeout(timeout);
  }
}

function friendlyError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "PageSpeed Insights took too long to respond.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "PageSpeed Insights could not be reached.";
}

export async function runPageSpeedStrategy(
  homepageUrl: string,
  strategy: PageSpeedStrategy,
  options: PageSpeedOptions
): Promise<PageSpeedStrategyResult> {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_PAGESPEED_TIMEOUT_MS;
  const url = buildPageSpeedUrl(homepageUrl, strategy, options.apiKey);

  try {
    const response = await fetchJsonWithTimeout(
      url,
      timeoutMs,
      fetchImplementation
    );
    const lighthouse = extractKeyLighthouseData(strategy, response);

    return {
      ok: true,
      strategy,
      scores: lighthouse.categories,
      lighthouse,
    };
  } catch (error) {
    return {
      ok: false,
      strategy,
      scores: cloneEmptyScores(),
      lighthouse: null,
      error: friendlyError(error),
    };
  }
}

export async function runPageSpeedAudit(
  homepageUrl: string,
  options: PageSpeedOptions
): Promise<PageSpeedAuditResult> {
  const [mobile, desktop] = await Promise.all([
    runPageSpeedStrategy(homepageUrl, "mobile", options),
    runPageSpeedStrategy(homepageUrl, "desktop", options),
  ]);
  const errors: Partial<Record<PageSpeedStrategy, string>> = {};

  if (!mobile.ok) {
    errors.mobile = mobile.error;
  }

  if (!desktop.ok) {
    errors.desktop = desktop.error;
  }

  return {
    homepageUrl,
    mobile,
    desktop,
    lighthouseJson: {
      source: "pagespeed-insights",
      homepageUrl,
      mobile: mobile.lighthouse,
      desktop: desktop.lighthouse,
      errors,
    },
  };
}
