import { z } from "zod";

import type {
  CategoryScoreResult,
  ScoringFinding,
  ScoringResult,
  ServiceFitLabel,
  TechnicalAuditScoreInput,
} from "@/lib/scoring/engine";
import type {
  AuthorWebsiteSignals,
  ScannedPageSignalInput,
} from "@/lib/signals/author-website-signals";

export const AUTHOR_REPORT_SYSTEM_INSTRUCTION = `You are an author website strategist reviewing a public author website.
Your job is to explain structured audit findings in simple, helpful, non-technical language for an author.
Do not invent facts that were not found in the scan.
Do not claim something is missing unless the scan result says it was not detected.
Focus on brand clarity, book visibility, reader engagement, search visibility, mobile performance, technical health, author trust, and site usability.
Use a calm, professional, helpful, author-first tone.`;

const categoryCritiqueSchema = z
  .object({
    category: z.string().min(1),
    score: z.number().int().min(0).max(100),
    critique: z.string().min(1),
  })
  .strict();

export const reportNarrativeSchema = z
  .object({
    executiveSummary: z.string().min(1),
    whatIsWorking: z.array(z.string().min(1)),
    topProblems: z.array(z.string().min(1)),
    topRecommendations: z.array(z.string().min(1)),
    categoryCritiques: z.array(categoryCritiqueSchema),
    suggestedHomepageImprovement: z.string().min(1),
    suggestedCTAImprovement: z.string().min(1),
    suggestedSeoTitle: z.string().min(1),
    suggestedMetaDescription: z.string().min(1),
    finalRecommendation: z.string().min(1),
  })
  .strict();

export type ReportNarrative = z.infer<typeof reportNarrativeSchema>;

const aiReportNarrativeSchema = reportNarrativeSchema.extend({
  categoryCritiques: z.array(categoryCritiqueSchema.omit({ score: true })),
});

type AiReportNarrative = z.infer<typeof aiReportNarrativeSchema>;

export type ReportNarrativeSource = "ai" | "fallback";

export type ReportNarrativeResult = {
  source: ReportNarrativeSource;
  narrative: ReportNarrative;
};

export type SerializedReportNarrative = {
  kind: "author-report-narrative";
  version: number;
  generatedAt?: string;
  source: ReportNarrativeSource;
  narrative: ReportNarrative;
};

export type ReportNarrativeInput = {
  websiteUrl: string;
  pagesScanned: ScannedPageSignalInput[];
  signals: AuthorWebsiteSignals;
  categoryScores: CategoryScoreResult[];
  findings: ScoringFinding[];
  quickWins: ScoringFinding[];
  serviceFitLabel: ServiceFitLabel;
  overallScore: number;
  technicalAudit?: TechnicalAuditScoreInput | null;
};

type FetchImplementation = (
  input: string | URL,
  init?: RequestInit
) => Promise<Response>;

export type GenerateReportNarrativeOptions = {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImplementation?: FetchImplementation;
};

const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_TIMEOUT_MS = 30000;
const BANNED_CLAIM_PATTERN =
  /\bguaranteed\s+(ranking|rankings|sales|book sales|traffic|results?|revenue|income|conversion|conversions)\b/i;

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "executiveSummary",
    "whatIsWorking",
    "topProblems",
    "topRecommendations",
    "categoryCritiques",
    "suggestedHomepageImprovement",
    "suggestedCTAImprovement",
    "suggestedSeoTitle",
    "suggestedMetaDescription",
    "finalRecommendation",
  ],
  properties: {
    executiveSummary: { type: "string" },
    whatIsWorking: { type: "array", items: { type: "string" } },
    topProblems: { type: "array", items: { type: "string" } },
    topRecommendations: { type: "array", items: { type: "string" } },
    categoryCritiques: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "critique"],
        properties: {
          category: { type: "string" },
          critique: { type: "string" },
        },
      },
    },
    suggestedHomepageImprovement: { type: "string" },
    suggestedCTAImprovement: { type: "string" },
    suggestedSeoTitle: { type: "string" },
    suggestedMetaDescription: { type: "string" },
    finalRecommendation: { type: "string" },
  },
} as const;

function truncate(value: string, maxLength = 500) {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1).trim()}...`;
}

function limitStrings(values: string[], limit = 5) {
  return values.map((value) => truncate(value, 240)).filter(Boolean).slice(0, limit);
}

function topFindings(findings: ScoringFinding[], limit: number) {
  return [...findings]
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title))
    .slice(0, limit);
}

function toPagePromptData(page: ScannedPageSignalInput) {
  return {
    url: page.url,
    pageType: page.pageType ?? null,
    statusCode: page.statusCode ?? null,
    title: page.title ? truncate(page.title, 160) : null,
    metaDescription: page.metaDescription
      ? truncate(page.metaDescription, 220)
      : null,
    h1: page.h1 ? truncate(page.h1, 160) : null,
    wordCount: page.wordCount ?? null,
  };
}

function detectedEvidence(signal: { detected: boolean; evidence: string[] }) {
  return signal.detected ? limitStrings(signal.evidence, 3) : [];
}

function toSignalPromptData(signals: AuthorWebsiteSignals) {
  return {
    pagesAnalyzed: signals.pagesAnalyzed,
    detected: {
      authorBrand: Object.fromEntries(
        Object.entries(signals.authorBrand).map(([key, signal]) => [
          key,
          detectedEvidence(signal),
        ])
      ),
      bookPromotion: Object.fromEntries(
        Object.entries(signals.bookPromotion).map(([key, signal]) => [
          key,
          detectedEvidence(signal),
        ])
      ),
      newsletter: Object.fromEntries(
        Object.entries(signals.newsletter).map(([key, signal]) => [
          key,
          detectedEvidence(signal),
        ])
      ),
      seo: Object.fromEntries(
        Object.entries(signals.seo).map(([key, signal]) => [
          key,
          detectedEvidence(signal),
        ])
      ),
      trust: Object.fromEntries(
        Object.entries(signals.trust).map(([key, signal]) => [
          key,
          detectedEvidence(signal),
        ])
      ),
      retailers: Object.fromEntries(
        Object.entries(signals.retailers).map(([key, signal]) => [
          key,
          detectedEvidence(signal),
        ])
      ),
      schema: Object.fromEntries(
        Object.entries(signals.schema).map(([key, signal]) => [
          key,
          detectedEvidence(signal),
        ])
      ),
    },
    indexable:
      signals.seo.indexabilitySignals.detected
        ? signals.seo.indexabilitySignals.indexable
        : null,
  };
}

function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function buildReportNarrativePrompt(input: ReportNarrativeInput) {
  const promptData = {
    websiteUrl: input.websiteUrl,
    overallScore: input.overallScore,
    serviceFitLabel: input.serviceFitLabel,
    pagesScanned: input.pagesScanned.map(toPagePromptData),
    authorWebsiteSignals: toSignalPromptData(input.signals),
    categoryScores: input.categoryScores.map((score) => ({
      category: score.category,
      label: score.label,
      score: score.score,
      maxScore: score.maxScore,
      percentageScore: score.percentageScore,
      summary: score.summary,
    })),
    findings: topFindings(input.findings, 12).map((finding) => ({
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      finding: finding.finding,
      recommendation: finding.recommendation,
      practicalActions: finding.practicalActions,
      priority: finding.priority,
    })),
    quickWins: input.quickWins.slice(0, 6).map((finding) => ({
      title: finding.title,
      recommendation: finding.recommendation,
      practicalActions: finding.practicalActions,
    })),
    technicalAudit: input.technicalAudit ?? null,
  };

  return [
    "Return only JSON that matches the requested schema.",
    "Use only the scan facts, deterministic scores, and saved findings below.",
    "Numeric scores are calculated by application code. Do not return, create, or change any score.",
    "Use the supplied primary recommendations and practical actions. You may clarify their wording for the author, but do not invent unsupported fixes.",
    "For categoryCritiques, repeat the provided category label exactly and explain that category only.",
    "Explain missing items only when a provided finding or detected signal supports that statement.",
    "Avoid guaranteed SEO, ranking, traffic, sales, or revenue claims.",
    safeJson(promptData),
  ].join("\n\n");
}

function itemText(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as { type?: unknown; text?: unknown };

  if (item.type === "output_text" && typeof item.text === "string") {
    return item.text;
  }

  return null;
}

export function extractOpenAIResponseText(response: unknown) {
  if (!response || typeof response !== "object") {
    return null;
  }

  const record = response as { output_text?: unknown; output?: unknown };

  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  if (!Array.isArray(record.output)) {
    return null;
  }

  for (const output of record.output) {
    if (!output || typeof output !== "object") {
      continue;
    }

    const content = (output as { content?: unknown }).content;

    if (!Array.isArray(content)) {
      continue;
    }

    const text = content.map(itemText).filter(Boolean).join("\n").trim();

    if (text) {
      return text;
    }
  }

  return null;
}

function hasBannedClaim(narrative: ReportNarrative) {
  return BANNED_CLAIM_PATTERN.test(JSON.stringify(narrative));
}

export function parseReportNarrativeJson(json: string) {
  const parsed = reportNarrativeSchema.parse(JSON.parse(json));

  if (hasBannedClaim(parsed)) {
    throw new Error("AI narrative contained an unsupported guarantee claim.");
  }

  return parsed;
}

function parseAiReportNarrativeJson(json: string) {
  const parsed = aiReportNarrativeSchema.parse(JSON.parse(json));

  if (BANNED_CLAIM_PATTERN.test(JSON.stringify(parsed))) {
    throw new Error("AI narrative contained an unsupported guarantee claim.");
  }

  return parsed;
}

function attachDeterministicCategoryScores(
  narrative: AiReportNarrative,
  categoryScores: CategoryScoreResult[]
): ReportNarrative {
  return {
    ...narrative,
    categoryCritiques: categoryScores.map((score, index) => {
      const matchingCritique = narrative.categoryCritiques.find(
        (item) => item.category === score.label
      );
      const critique = matchingCritique ?? narrative.categoryCritiques[index];

      return {
        category: score.label,
        score: score.percentageScore,
        critique: critique?.critique ?? score.summary,
      };
    }),
  };
}

function findingText(finding: ScoringFinding) {
  return `${finding.title}: ${finding.finding}`;
}

function recommendationText(finding: ScoringFinding) {
  return finding.recommendation.endsWith(".")
    ? finding.recommendation
    : `${finding.recommendation}.`;
}

function strongestScores(scores: CategoryScoreResult[]) {
  return [...scores]
    .filter((score) => score.percentageScore >= 70)
    .sort(
      (a, b) =>
        b.percentageScore - a.percentageScore ||
        a.label.localeCompare(b.label)
    )
    .slice(0, 4);
}

function categoryCritique(
  score: CategoryScoreResult,
  findings: ScoringFinding[]
) {
  const finding = findings.find((item) => item.category === score.category);

  if (!finding) {
    return score.summary;
  }

  return `${score.summary} ${recommendationText(finding)}`;
}

function firstRecommendation(
  findings: ScoringFinding[],
  matcher: (finding: ScoringFinding) => boolean,
  fallback: string
) {
  return findings.find(matcher)?.recommendation ?? fallback;
}

export function buildFallbackReportNarrative(
  input: ReportNarrativeInput
): ReportNarrative {
  const scoringResult: ScoringResult = {
    overallScore: input.overallScore,
    categoryScores: input.categoryScores,
    findings: input.findings,
    quickWins: input.quickWins,
    serviceFitLabel: input.serviceFitLabel,
  };
  const orderedFindings = topFindings(input.findings, 5);
  const strongest = strongestScores(input.categoryScores);
  const working =
    strongest.length > 0
      ? strongest.map((score) => `${score.label}: ${score.summary}`)
      : [
          "The report does not show a clear strong category yet, so the safest next step is to address the highest-priority findings first.",
        ];

  return {
    executiveSummary: buildBasicSummary(scoringResult),
    whatIsWorking: working,
    topProblems:
      orderedFindings.length > 0
        ? orderedFindings.map(findingText)
        : ["No priority problems were saved with this report."],
    topRecommendations:
      orderedFindings.length > 0
        ? orderedFindings.map(recommendationText)
        : ["Keep the author website clear, current, and focused on the reader's next step."],
    categoryCritiques: input.categoryScores.map((score) => ({
      category: score.label,
      score: score.percentageScore,
      critique: categoryCritique(score, input.findings),
    })),
    suggestedHomepageImprovement: firstRecommendation(
      orderedFindings,
      (finding) =>
        finding.category === "BRAND_CLARITY" ||
        finding.category === "BOOK_VISIBILITY",
      "Make the homepage quickly explain who the author is, what they write, which book or series to explore first, and the best next action for readers."
    ),
    suggestedCTAImprovement: firstRecommendation(
      orderedFindings,
      (finding) =>
        finding.category === "READER_ENGAGEMENT" ||
        finding.category === "BOOK_VISIBILITY",
      "Use one clear primary call to action for readers, such as joining the newsletter or viewing the featured book."
    ),
    suggestedSeoTitle: "Author Name | Official Author Website",
    suggestedMetaDescription:
      "Official author website for Author Name. Explore books, author updates, and reader links.",
    finalRecommendation: `Recommended service fit: ${input.serviceFitLabel}. Start with the highest-priority fixes, then refine the homepage, book links, newsletter path, and technical health in that order.`,
  };
}

function buildBasicSummary(result: ScoringResult) {
  const sortedScores = [...result.categoryScores].sort(
    (a, b) =>
      b.percentageScore - a.percentageScore || a.label.localeCompare(b.label)
  );
  const strongest = sortedScores[0];
  const weakest = sortedScores[sortedScores.length - 1];
  const topFix = result.findings[0];
  const parts = [
    `This author website scored ${result.overallScore}/100 using deterministic scan data.`,
  ];

  if (strongest) {
    parts.push(`Its strongest area is ${strongest.label.toLowerCase()}.`);
  }

  if (weakest && weakest.percentageScore < 80) {
    parts.push(`The area that needs the most attention is ${weakest.label.toLowerCase()}.`);
  }

  if (topFix) {
    parts.push(`The top priority is ${topFix.title.toLowerCase()}.`);
  }

  parts.push(`The suggested GrailHiiv service fit is ${result.serviceFitLabel}.`);

  return parts.join(" ");
}

async function fetchOpenAINarrative(
  input: ReportNarrativeInput,
  options: Required<
    Pick<GenerateReportNarrativeOptions, "apiKey" | "model" | "timeoutMs">
  > & {
    fetchImplementation: FetchImplementation;
  }
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await options.fetchImplementation(OPENAI_RESPONSES_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model,
        input: [
          {
            role: "system",
            content: AUTHOR_REPORT_SYSTEM_INSTRUCTION,
          },
          {
            role: "user",
            content: buildReportNarrativePrompt(input),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "author_website_report_narrative",
            strict: true,
            schema: jsonSchema,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned HTTP ${response.status}.`);
    }

    const responseJson = (await response.json()) as unknown;
    const text = extractOpenAIResponseText(responseJson);

    if (!text) {
      throw new Error("OpenAI did not return narrative JSON.");
    }

    return parseAiReportNarrativeJson(text);
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateReportNarrative(
  input: ReportNarrativeInput,
  options: GenerateReportNarrativeOptions = {}
): Promise<ReportNarrativeResult> {
  const apiKey = options.apiKey?.trim();

  if (!apiKey) {
    return {
      source: "fallback",
      narrative: buildFallbackReportNarrative(input),
    };
  }

  try {
    const aiNarrative = await fetchOpenAINarrative(input, {
      apiKey,
      model: options.model?.trim() || DEFAULT_MODEL,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      fetchImplementation: options.fetchImplementation ?? fetch,
    });

    return {
      source: "ai",
      narrative: attachDeterministicCategoryScores(
        aiNarrative,
        input.categoryScores
      ),
    };
  } catch {
    return {
      source: "fallback",
      narrative: buildFallbackReportNarrative(input),
    };
  }
}

export function serializeReportNarrative(result: ReportNarrativeResult) {
  return JSON.stringify({
    kind: "author-report-narrative",
    version: 1,
    generatedAt: new Date().toISOString(),
    source: result.source,
    narrative: result.narrative,
  });
}

export function parseSerializedReportNarrative(
  summary: string | null
): SerializedReportNarrative | null {
  if (!summary) {
    return null;
  }

  try {
    const parsed = JSON.parse(summary) as {
      kind?: unknown;
      version?: unknown;
      generatedAt?: unknown;
      source?: unknown;
      narrative?: unknown;
    };

    if (parsed.kind !== "author-report-narrative") {
      return null;
    }

    const narrative = reportNarrativeSchema.safeParse(parsed.narrative);

    if (!narrative.success) {
      return null;
    }

    return {
      kind: "author-report-narrative",
      version: typeof parsed.version === "number" ? parsed.version : 1,
      generatedAt:
        typeof parsed.generatedAt === "string" ? parsed.generatedAt : undefined,
      source: parsed.source === "ai" ? "ai" : "fallback",
      narrative: narrative.data,
    };
  } catch {
    return null;
  }
}

export function getExecutiveSummaryFromReportSummary(summary: string | null) {
  if (!summary) {
    return null;
  }

  return parseSerializedReportNarrative(summary)?.narrative.executiveSummary ?? summary;
}
