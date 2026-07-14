import {
  BROWSER_FALLBACK_POLICY_VERSION,
  detectBrowserFallbackTrigger,
  mergeRenderedExtraction,
  type BrowserFallbackTriggerCode,
} from "@/lib/crawler/browser-fallback.core";
import {
  CRAWLER_EXTRACTION_VERSION,
  extractPageData,
  type ExtractedPageData,
} from "@/lib/crawler/extract";
import {
  ANALYZER_DIAGNOSTICS_VERSION,
  SIGNAL_RESOLUTION_VERSION,
  buildAnalyzerDiagnostics,
  type AnalyzerSignalResolution,
} from "@/lib/signals/analyzer-diagnostics";
import {
  detectAuthorWebsiteSignals,
  type AuthorWebsiteSignals,
  type ScannedPageSignalInput,
} from "@/lib/signals/author-website-signals";
import { extractedPageToScannedPageSignalInput } from "@/lib/signals/scanned-page-input";
import {
  EVIDENCE_OBSERVATION_VERSION,
  PAGE_ROLE_CLASSIFIER_VERSION,
  type EvidenceObservation,
  type EvidenceObservationState,
  type EvidenceSourceKind,
  type PageRole,
} from "@/lib/signals/page-role-classifier";

import { z } from "zod";

export const AUTHOR_SITE_BENCHMARK_SCHEMA_VERSION = "1.0.0";
export const AUTHOR_SITE_BENCHMARK_FIXED_TIME = "2026-07-14T00:00:00.000Z";

const pageRoles = [
  "HOME",
  "ABOUT",
  "BOOKS_INDEX",
  "BOOK_DETAIL",
  "SERIES",
  "NEWSLETTER",
  "CONTACT",
  "EVENTS",
  "MEDIA_KIT",
  "BLOG_INDEX",
  "ARTICLE",
  "PRIVACY",
  "STORE",
  "UTILITY",
  "UNKNOWN",
] as const satisfies readonly PageRole[];

const evidenceSourceKinds = [
  "http",
  "dom",
  "jsonld",
  "link",
  "image",
  "form",
  "text",
  "audit",
] as const satisfies readonly EvidenceSourceKind[];

const observationStates = [
  "present",
  "absent",
  "unknown",
  "not_applicable",
  "conflicting",
] as const satisfies readonly EvidenceObservationState[];

const outcomeStates = ["present", "absent", "unknown"] as const;
const triggerCodes = [
  "empty_application_root",
  "javascript_required_noscript",
  "unresolved_widget_placeholder",
] as const satisfies readonly BrowserFallbackTriggerCode[];

const fixturePathSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      !/^(?:[a-z]:|[\\/])/i.test(value) &&
      !/(?:^|[\\/])\.\.(?:[\\/]|$)/.test(value),
    "Fixture paths must stay relative to the benchmark directory.",
  );

const sitePathSchema = z.string().min(1).startsWith("/");

const observationExpectationSchema = z
  .object({
    signalId: z.string().min(1),
    path: sitePathSchema,
    sourceKind: z.enum(evidenceSourceKinds).optional(),
    state: z.enum(observationStates).optional(),
  })
  .strict();

const benchmarkPageSchema = z
  .object({
    path: sitePathSchema,
    fixture: fixturePathSchema,
    statusCode: z.number().int().min(100).max(599).optional(),
    expectedPrimaryRole: z.enum(pageRoles),
    expectedSecondaryRoles: z.array(z.enum(pageRoles)).optional(),
    renderedFixture: fixturePathSchema.optional(),
    expectedFallback: z
      .object({
        triggerCodes: z.array(z.enum(triggerCodes)),
        adopted: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((page, context) => {
    if (page.renderedFixture && !page.expectedFallback) {
      context.addIssue({
        code: "custom",
        path: ["expectedFallback"],
        message: "A rendered fixture requires an explicit fallback expectation.",
      });
    }

    if (page.expectedFallback?.adopted !== undefined && !page.renderedFixture) {
      context.addIssue({
        code: "custom",
        path: ["renderedFixture"],
        message: "An adoption expectation requires a rendered fixture.",
      });
    }
  });

const benchmarkCaseSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().min(1),
    tags: z.array(z.string().min(1)).min(1),
    baseUrl: z.string().url(),
    pages: z.array(benchmarkPageSchema).min(1),
    crawl: z
      .object({
        discoveredPaths: z.array(sitePathSchema),
        attemptedPaths: z.array(sitePathSchema),
        failedPaths: z.array(sitePathSchema).optional(),
      })
      .strict()
      .optional(),
    expectedSignals: z.record(z.string(), z.boolean()).optional(),
    expectedOutcomes: z
      .record(z.string(), z.enum(outcomeStates))
      .optional(),
    expectedObservations: z.array(observationExpectationSchema).optional(),
    forbiddenObservations: z.array(observationExpectationSchema).optional(),
  })
  .strict()
  .superRefine((benchmarkCase, context) => {
    const paths = new Set<string>();
    for (const [index, page] of benchmarkCase.pages.entries()) {
      if (paths.has(page.path)) {
        context.addIssue({
          code: "custom",
          path: ["pages", index, "path"],
          message: `Duplicate page path: ${page.path}`,
        });
      }
      paths.add(page.path);
    }
  });

export const benchmarkCorpusSchema = z
  .object({
    schemaVersion: z.literal(AUTHOR_SITE_BENCHMARK_SCHEMA_VERSION),
    description: z.string().min(1),
    cases: z.array(benchmarkCaseSchema).min(1),
  })
  .strict()
  .superRefine((corpus, context) => {
    const ids = new Set<string>();
    for (const [index, benchmarkCase] of corpus.cases.entries()) {
      if (ids.has(benchmarkCase.id)) {
        context.addIssue({
          code: "custom",
          path: ["cases", index, "id"],
          message: `Duplicate benchmark case id: ${benchmarkCase.id}`,
        });
      }
      ids.add(benchmarkCase.id);
    }
  });

export type AuthorSiteBenchmarkCorpus = z.infer<typeof benchmarkCorpusSchema>;
export type AuthorSiteBenchmarkCase = AuthorSiteBenchmarkCorpus["cases"][number];

export type ConfusionMetrics = {
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
  precision: number;
  recall: number;
};

export type AuthorSiteBenchmarkCaseResult = {
  id: string;
  description: string;
  tags: string[];
  passed: boolean;
  failures: string[];
  pageCount: number;
  signalExpectationCount: number;
  outcomeExpectationCount: number;
};

export type AuthorSiteBenchmarkReport = {
  schemaVersion: string;
  versions: {
    extraction: string;
    pageRoleClassifier: string;
    evidenceObservation: string;
    analyzerDiagnostics: string;
    signalResolution: string;
    browserFallbackPolicy: string;
  };
  passed: boolean;
  cases: AuthorSiteBenchmarkCaseResult[];
  metrics: {
    signals: ConfusionMetrics & {
      labeled: number;
      bySignal: Record<string, ConfusionMetrics & { labeled: number }>;
    };
    primaryRoles: {
      correct: number;
      total: number;
      accuracy: number;
      byRole: Record<string, ConfusionMetrics & { labeled: number }>;
    };
    secondaryRoles: {
      exactMatches: number;
      labeledPages: number;
      accuracy: number;
    };
    evidence: {
      expectedFound: number;
      expectedTotal: number;
      recall: number;
      forbiddenViolations: number;
      forbiddenTotal: number;
    };
    browserTrigger: ConfusionMetrics & { labeled: number };
    browserAdoption: {
      correct: number;
      labeled: number;
      accuracy: number;
    };
    outcomes: {
      correct: number;
      labeled: number;
      accuracy: number;
      stateCounts: Record<AnalyzerSignalResolution["state"], number>;
      unknownRate: number;
      totalResolved: number;
    };
    crawlCoverage: {
      discoveredUrls: number;
      attemptedUrls: number;
      successfulHtmlPages: number;
      successfulToDiscoveredRatio: number;
    };
  };
};

type MutableConfusion = Omit<ConfusionMetrics, "precision" | "recall">;

function emptyConfusion(): MutableConfusion {
  return {
    truePositive: 0,
    falsePositive: 0,
    falseNegative: 0,
    trueNegative: 0,
  };
}

function addConfusion(
  metrics: MutableConfusion,
  expected: boolean,
  actual: boolean,
) {
  if (expected && actual) metrics.truePositive += 1;
  else if (!expected && actual) metrics.falsePositive += 1;
  else if (expected && !actual) metrics.falseNegative += 1;
  else metrics.trueNegative += 1;
}

function ratio(numerator: number, denominator: number, emptyValue = 1) {
  return denominator === 0 ? emptyValue : numerator / denominator;
}

function finalizeConfusion(metrics: MutableConfusion): ConfusionMetrics {
  return {
    ...metrics,
    precision: ratio(
      metrics.truePositive,
      metrics.truePositive + metrics.falsePositive,
    ),
    recall: ratio(
      metrics.truePositive,
      metrics.truePositive + metrics.falseNegative,
    ),
  };
}

function sortedUnique<T extends string>(values: T[]) {
  return [...new Set(values)].sort();
}

function equalStringSets(left: string[], right: string[]) {
  return JSON.stringify(sortedUnique(left)) === JSON.stringify(sortedUnique(right));
}

function getSignalDetection(
  signals: AuthorWebsiteSignals,
  dottedPath: string,
): boolean | null {
  let current: unknown = signals;

  for (const segment of dottedPath.split(".")) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (!current || typeof current !== "object") return null;
  const detected = (current as Record<string, unknown>).detected;
  return typeof detected === "boolean" ? detected : null;
}

function matchesObservation(
  observation: EvidenceObservation,
  expectation: z.infer<typeof observationExpectationSchema>,
  baseUrl: string,
) {
  return (
    observation.signalId === expectation.signalId &&
    observation.sourceUrl === new URL(expectation.path, baseUrl).toString() &&
    (!expectation.sourceKind ||
      observation.sourceKind === expectation.sourceKind) &&
    (!expectation.state || observation.state === expectation.state)
  );
}

function makeCrawlDiagnostics({
  benchmarkCase,
  pages,
  triggerCandidates,
  renderedUrls,
}: {
  benchmarkCase: AuthorSiteBenchmarkCase;
  pages: ScannedPageSignalInput[];
  triggerCandidates: Array<{
    url: string;
    codes: BrowserFallbackTriggerCode[];
  }>;
  renderedUrls: string[];
}) {
  const defaultPaths = benchmarkCase.pages.map((page) => page.path);
  const discoveredPaths = benchmarkCase.crawl?.discoveredPaths ?? defaultPaths;
  const attemptedPaths = benchmarkCase.crawl?.attemptedPaths ?? defaultPaths;
  const failedPaths = benchmarkCase.crawl?.failedPaths ?? [];
  const discoveredUrls = discoveredPaths.map((path) =>
    new URL(path, benchmarkCase.baseUrl).toString(),
  );
  const attemptedUrls = attemptedPaths.map((path) =>
    new URL(path, benchmarkCase.baseUrl).toString(),
  );
  const failedUrls = failedPaths.map((path) =>
    new URL(path, benchmarkCase.baseUrl).toString(),
  );
  const triggeredUrls = new Set(triggerCandidates.map((item) => item.url));
  const renderedSet = new Set(renderedUrls);
  const browserStatus =
    triggerCandidates.length === 0
      ? "not_needed"
      : renderedUrls.length === 0
        ? "failed"
        : [...triggeredUrls].every((url) => renderedSet.has(url))
          ? "completed"
          : "partial";

  return {
    schemaVersion: "1.1.0",
    extractionVersion: CRAWLER_EXTRACTION_VERSION,
    limits: { maxSavedHtmlPages: 10, maxRequests: 30, maxRenderedPages: 2 },
    discoveredUrls,
    attemptedUrls,
    attemptedRequests: attemptedUrls.length,
    savedHtmlPages: pages.filter(
      (page) =>
        page.statusCode === null ||
        page.statusCode === undefined ||
        (page.statusCode >= 200 && page.statusCode < 300),
    ).length,
    failedRequests: failedUrls.map((url) => ({
      requestedUrl: url,
      reason: "request_failed",
    })),
    skippedUrls: [],
    browserFallback: {
      policyVersion: BROWSER_FALLBACK_POLICY_VERSION,
      enabled: true,
      status: browserStatus,
      triggerCandidates,
      attemptedUrls: renderedUrls,
      renderedUrls,
      adoptedUrls: [],
      requestCount: 0,
      abortedRequestCount: 0,
      failures:
        browserStatus === "failed"
          ? triggerCandidates.map((item) => ({
              url: item.url,
              code: "benchmark_render_unavailable",
            }))
          : [],
    },
  };
}

export function parseAuthorSiteBenchmarkCorpus(
  value: unknown,
): AuthorSiteBenchmarkCorpus {
  return benchmarkCorpusSchema.parse(value);
}

export async function runAuthorSiteBenchmark({
  corpus: corpusInput,
  readFixture,
  analyzedAt = AUTHOR_SITE_BENCHMARK_FIXED_TIME,
}: {
  corpus: unknown;
  readFixture: (fixturePath: string) => Promise<string>;
  analyzedAt?: string;
}): Promise<AuthorSiteBenchmarkReport> {
  const corpus = parseAuthorSiteBenchmarkCorpus(corpusInput);
  const signalTotals = emptyConfusion();
  const signalById = new Map<string, MutableConfusion>();
  const roleTotals = new Map<PageRole, MutableConfusion>();
  const browserTriggerTotals = emptyConfusion();
  let primaryRoleCorrect = 0;
  let primaryRoleTotal = 0;
  let secondaryExactMatches = 0;
  let secondaryLabeledPages = 0;
  let expectedEvidenceFound = 0;
  let expectedEvidenceTotal = 0;
  let forbiddenEvidenceViolations = 0;
  let forbiddenEvidenceTotal = 0;
  let browserTriggerLabeled = 0;
  let browserAdoptionCorrect = 0;
  let browserAdoptionLabeled = 0;
  let outcomeCorrect = 0;
  let outcomeLabeled = 0;
  let totalResolvedOutcomes = 0;
  let crawlDiscovered = 0;
  let crawlAttempted = 0;
  let crawlSuccessful = 0;
  const outcomeStateCounts: Record<AnalyzerSignalResolution["state"], number> = {
    present: 0,
    absent: 0,
    unknown: 0,
    not_applicable: 0,
    conflicting: 0,
  };
  const caseResults: AuthorSiteBenchmarkCaseResult[] = [];

  for (const benchmarkCase of corpus.cases) {
    const failures: string[] = [];
    const pageRecords: Array<{
      manifest: AuthorSiteBenchmarkCase["pages"][number];
      extracted: ExtractedPageData;
      statusCode: number;
    }> = [];
    const triggerCandidates: Array<{
      url: string;
      codes: BrowserFallbackTriggerCode[];
    }> = [];
    const renderedUrls: string[] = [];

    for (const page of benchmarkCase.pages) {
      const pageUrl = new URL(page.path, benchmarkCase.baseUrl).toString();
      const staticHtml = await readFixture(page.fixture);
      const staticExtraction = extractPageData(
        staticHtml,
        pageUrl,
        new URL(benchmarkCase.baseUrl).origin,
      );
      const trigger = detectBrowserFallbackTrigger({
        html: staticHtml,
        extracted: staticExtraction,
        homepageUrl: new URL("/", benchmarkCase.baseUrl).toString(),
      });
      let finalExtraction = staticExtraction;

      if (trigger) triggerCandidates.push(trigger);

      if (page.expectedFallback) {
        browserTriggerLabeled += 1;
        const expectedTriggered = page.expectedFallback.triggerCodes.length > 0;
        const actualTriggered = Boolean(trigger);
        addConfusion(browserTriggerTotals, expectedTriggered, actualTriggered);

        const actualCodes = trigger?.codes ?? [];
        if (!equalStringSets(page.expectedFallback.triggerCodes, actualCodes)) {
          failures.push(
            `${page.path}: expected browser trigger codes [${page.expectedFallback.triggerCodes.join(", ")}], received [${actualCodes.join(", ")}].`,
          );
        }
      }

      if (page.renderedFixture && trigger) {
        const renderedHtml = await readFixture(page.renderedFixture);
        const renderedExtraction = extractPageData(
          renderedHtml,
          pageUrl,
          new URL(benchmarkCase.baseUrl).origin,
        );
        const merged = mergeRenderedExtraction(
          staticExtraction,
          renderedExtraction,
        );
        finalExtraction = merged.extracted;
        renderedUrls.push(pageUrl);

        if (page.expectedFallback?.adopted !== undefined) {
          browserAdoptionLabeled += 1;
          if (page.expectedFallback.adopted === merged.adopted) {
            browserAdoptionCorrect += 1;
          } else {
            failures.push(
              `${page.path}: expected rendered adoption ${page.expectedFallback.adopted}, received ${merged.adopted}.`,
            );
          }
        }
      } else if (page.expectedFallback?.adopted !== undefined) {
        browserAdoptionLabeled += 1;
        failures.push(
          `${page.path}: rendered adoption could not be evaluated because the fallback did not trigger.`,
        );
      }

      pageRecords.push({
        manifest: page,
        extracted: finalExtraction,
        statusCode: page.statusCode ?? 200,
      });
    }

    const pages = pageRecords.map((record) =>
      extractedPageToScannedPageSignalInput(
        record.extracted,
        record.statusCode,
      ),
    );
    const signals = detectAuthorWebsiteSignals(pages);
    const crawlDiagnostics = makeCrawlDiagnostics({
      benchmarkCase,
      pages,
      triggerCandidates,
      renderedUrls,
    });
    const diagnostics = buildAnalyzerDiagnostics({
      crawlDiagnostics,
      pages,
      signals,
      analyzedAt,
    });

    for (const record of pageRecords) {
      const pageUrl = record.extracted.url;
      const classification = signals.pageRoles?.find(
        (item) => item.sourceUrl === pageUrl,
      );
      const actualRole = classification?.primaryRole ?? "UNKNOWN";
      const expectedRole = record.manifest.expectedPrimaryRole;

      primaryRoleTotal += 1;
      if (actualRole === expectedRole) primaryRoleCorrect += 1;
      else {
        failures.push(
          `${record.manifest.path}: expected primary role ${expectedRole}, received ${actualRole}.`,
        );
      }

      for (const role of pageRoles) {
        const totals = roleTotals.get(role) ?? emptyConfusion();
        addConfusion(totals, expectedRole === role, actualRole === role);
        roleTotals.set(role, totals);
      }

      if (record.manifest.expectedSecondaryRoles) {
        secondaryLabeledPages += 1;
        const actualSecondary = classification?.secondaryRoles ?? [];
        if (
          equalStringSets(
            record.manifest.expectedSecondaryRoles,
            actualSecondary,
          )
        ) {
          secondaryExactMatches += 1;
        } else {
          failures.push(
            `${record.manifest.path}: expected secondary roles [${record.manifest.expectedSecondaryRoles.join(", ")}], received [${actualSecondary.join(", ")}].`,
          );
        }
      }
    }

    const signalExpectations = benchmarkCase.expectedSignals ?? {};
    for (const [signalId, expected] of Object.entries(signalExpectations)) {
      const actual = getSignalDetection(signals, signalId);
      if (actual === null) {
        failures.push(`${signalId}: is not a valid boolean detector path.`);
        continue;
      }

      addConfusion(signalTotals, expected, actual);
      const byId = signalById.get(signalId) ?? emptyConfusion();
      addConfusion(byId, expected, actual);
      signalById.set(signalId, byId);

      if (expected !== actual) {
        failures.push(`${signalId}: expected ${expected}, received ${actual}.`);
      }
    }

    const observations = signals.observations ?? [];
    for (const expectation of benchmarkCase.expectedObservations ?? []) {
      expectedEvidenceTotal += 1;
      if (
        observations.some((observation) =>
          matchesObservation(observation, expectation, benchmarkCase.baseUrl),
        )
      ) {
        expectedEvidenceFound += 1;
      } else {
        failures.push(
          `${expectation.path}: expected observation ${expectation.signalId}${expectation.sourceKind ? ` from ${expectation.sourceKind}` : ""} was not found.`,
        );
      }
    }

    for (const expectation of benchmarkCase.forbiddenObservations ?? []) {
      forbiddenEvidenceTotal += 1;
      if (
        observations.some((observation) =>
          matchesObservation(observation, expectation, benchmarkCase.baseUrl),
        )
      ) {
        forbiddenEvidenceViolations += 1;
        failures.push(
          `${expectation.path}: forbidden observation ${expectation.signalId}${expectation.sourceKind ? ` from ${expectation.sourceKind}` : ""} was emitted.`,
        );
      }
    }

    const outcomesById = new Map(
      diagnostics.outcomes.map((outcome) => [outcome.signalId, outcome]),
    );
    for (const outcome of diagnostics.outcomes) {
      outcomeStateCounts[outcome.state] += 1;
      totalResolvedOutcomes += 1;
    }
    for (const [signalId, expected] of Object.entries(
      benchmarkCase.expectedOutcomes ?? {},
    )) {
      outcomeLabeled += 1;
      const actual = outcomesById.get(signalId)?.state;
      if (actual === expected) outcomeCorrect += 1;
      else {
        failures.push(
          `${signalId}: expected diagnostic outcome ${expected}, received ${actual ?? "missing"}.`,
        );
      }
    }

    crawlDiscovered += diagnostics.coverage.discoveredUrlCount;
    crawlAttempted += diagnostics.coverage.attemptedUrlCount;
    crawlSuccessful += diagnostics.coverage.successfulHtmlPageCount;

    caseResults.push({
      id: benchmarkCase.id,
      description: benchmarkCase.description,
      tags: benchmarkCase.tags,
      passed: failures.length === 0,
      failures,
      pageCount: pageRecords.length,
      signalExpectationCount: Object.keys(signalExpectations).length,
      outcomeExpectationCount: Object.keys(
        benchmarkCase.expectedOutcomes ?? {},
      ).length,
    });
  }

  const finalizedSignals = finalizeConfusion(signalTotals);
  const finalizedBrowserTriggers = finalizeConfusion(browserTriggerTotals);

  return {
    schemaVersion: AUTHOR_SITE_BENCHMARK_SCHEMA_VERSION,
    versions: {
      extraction: CRAWLER_EXTRACTION_VERSION,
      pageRoleClassifier: PAGE_ROLE_CLASSIFIER_VERSION,
      evidenceObservation: EVIDENCE_OBSERVATION_VERSION,
      analyzerDiagnostics: ANALYZER_DIAGNOSTICS_VERSION,
      signalResolution: SIGNAL_RESOLUTION_VERSION,
      browserFallbackPolicy: BROWSER_FALLBACK_POLICY_VERSION,
    },
    passed: caseResults.every((result) => result.passed),
    cases: caseResults,
    metrics: {
      signals: {
        ...finalizedSignals,
        labeled:
          signalTotals.truePositive +
          signalTotals.falsePositive +
          signalTotals.falseNegative +
          signalTotals.trueNegative,
        bySignal: Object.fromEntries(
          [...signalById.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([signalId, totals]) => {
              const finalized = finalizeConfusion(totals);
              return [
                signalId,
                {
                  ...finalized,
                  labeled:
                    totals.truePositive +
                    totals.falsePositive +
                    totals.falseNegative +
                    totals.trueNegative,
                },
              ];
            }),
        ),
      },
      primaryRoles: {
        correct: primaryRoleCorrect,
        total: primaryRoleTotal,
        accuracy: ratio(primaryRoleCorrect, primaryRoleTotal),
        byRole: Object.fromEntries(
          [...roleTotals.entries()].map(([role, totals]) => {
            const finalized = finalizeConfusion(totals);
            return [
              role,
              {
                ...finalized,
                labeled:
                  totals.truePositive +
                  totals.falsePositive +
                  totals.falseNegative +
                  totals.trueNegative,
              },
            ];
          }),
        ),
      },
      secondaryRoles: {
        exactMatches: secondaryExactMatches,
        labeledPages: secondaryLabeledPages,
        accuracy: ratio(secondaryExactMatches, secondaryLabeledPages),
      },
      evidence: {
        expectedFound: expectedEvidenceFound,
        expectedTotal: expectedEvidenceTotal,
        recall: ratio(expectedEvidenceFound, expectedEvidenceTotal),
        forbiddenViolations: forbiddenEvidenceViolations,
        forbiddenTotal: forbiddenEvidenceTotal,
      },
      browserTrigger: {
        ...finalizedBrowserTriggers,
        labeled: browserTriggerLabeled,
      },
      browserAdoption: {
        correct: browserAdoptionCorrect,
        labeled: browserAdoptionLabeled,
        accuracy: ratio(browserAdoptionCorrect, browserAdoptionLabeled),
      },
      outcomes: {
        correct: outcomeCorrect,
        labeled: outcomeLabeled,
        accuracy: ratio(outcomeCorrect, outcomeLabeled),
        stateCounts: outcomeStateCounts,
        unknownRate: ratio(
          outcomeStateCounts.unknown,
          totalResolvedOutcomes,
          0,
        ),
        totalResolved: totalResolvedOutcomes,
      },
      crawlCoverage: {
        discoveredUrls: crawlDiscovered,
        attemptedUrls: crawlAttempted,
        successfulHtmlPages: crawlSuccessful,
        successfulToDiscoveredRatio: ratio(
          crawlSuccessful,
          crawlDiscovered,
          0,
        ),
      },
    },
  };
}
