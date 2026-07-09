import { z } from "zod";

import { extractOpenAIResponseText } from "@/lib/ai/report-narrative.core";

export const OUTREACH_SYSTEM_INSTRUCTION = `You are helping a GrailHiiv admin write a short outreach message to an author after reviewing their public author website report.
Keep the tone calm, helpful, low-pressure, and author-first.
Do not sound spammy.
Do not insult the author's website.
Mention only one or two specific report issues.
Do not invent facts.
Avoid exaggerated SEO, ranking, traffic, sales, or revenue claims.
Use a soft call to action.`;

export const outreachMessageSchema = z
  .object({
    emailVersion: z.string().min(1),
    shortDmVersion: z.string().min(1),
    followUpVersion: z.string().min(1),
  })
  .strict();

export type OutreachMessage = z.infer<typeof outreachMessageSchema>;
export type OutreachMessageSource = "ai" | "fallback";

export type OutreachMessageResult = {
  source: OutreachMessageSource;
  message: OutreachMessage;
};

export type SerializedOutreachMessage = {
  kind: "admin-outreach-message";
  version: number;
  generatedAt?: string;
  source: OutreachMessageSource;
  message: OutreachMessage;
};

export type OutreachFindingInput = {
  title: string;
  finding: string;
  recommendation: string;
  priority: number;
  severity?: string | null;
  category?: string | null;
};

export type OutreachMessageInput = {
  authorName?: string | null;
  websiteUrl: string;
  domain: string;
  authorType: string;
  websiteGoal?: string | null;
  overallScore?: number | null;
  serviceFit?: string | null;
  findings: OutreachFindingInput[];
};

type FetchImplementation = (
  input: string | URL,
  init?: RequestInit
) => Promise<Response>;

export type GenerateOutreachMessageOptions = {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImplementation?: FetchImplementation;
};

const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_TIMEOUT_MS = 30000;
const BANNED_OUTREACH_PATTERN =
  /\b(guaranteed|terrible|awful|bad website|broken website|rank #?1|skyrocket|explode your sales|massive sales)\b/i;

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["emailVersion", "shortDmVersion", "followUpVersion"],
  properties: {
    emailVersion: { type: "string" },
    shortDmVersion: { type: "string" },
    followUpVersion: { type: "string" },
  },
} as const;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength = 320) {
  const compact = normalizeWhitespace(value);

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1).trim()}...`;
}

function firstName(input: OutreachMessageInput) {
  const name = input.authorName?.trim();

  if (!name) {
    return "[Name]";
  }

  return name.split(/\s+/)[0] ?? name;
}

function sortedFindings(input: OutreachMessageInput) {
  return [...input.findings]
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title))
    .slice(0, 2);
}

function findingPhrase(input: OutreachMessageInput) {
  const findings = sortedFindings(input);

  if (findings.length === 0) {
    return "a few places where the reader journey could be clearer";
  }

  return findings.map((finding) => finding.title.toLowerCase()).join(" and ");
}

function servicePhrase(serviceFit: string | null | undefined) {
  const fit = serviceFit?.trim();

  if (!fit || fit.toLowerCase() === "not sure") {
    return "a clearer author website";
  }

  return fit.toLowerCase();
}

function hasBannedOutreachClaim(message: OutreachMessage) {
  return BANNED_OUTREACH_PATTERN.test(JSON.stringify(message));
}

export function parseOutreachMessageJson(json: string) {
  const parsed = outreachMessageSchema.parse(JSON.parse(json));

  if (hasBannedOutreachClaim(parsed)) {
    throw new Error("Outreach message contained unsupported sales language.");
  }

  return parsed;
}

export function buildFallbackOutreachMessage(
  input: OutreachMessageInput
): OutreachMessage {
  const name = firstName(input);
  const issues = findingPhrase(input);
  const fit = servicePhrase(input.serviceFit);

  return {
    emailVersion: `Subject: Quick author website scorecard for ${input.domain}

Hi ${name},

I came across your author website and put together a quick scorecard for it. A couple of areas stood out where the reader journey could be clearer, especially around ${issues}.

No pressure at all, but I thought the notes might be useful if you are planning updates to your site. I am happy to send over the scorecard if you would like to see it.

Best,
GrailHiiv`,
    shortDmVersion: `Hi ${name}, I came across your author website and noticed a few areas where the reader journey could be clearer, especially around ${issues}. I put together a quick website scorecard if you would like to see it.`,
    followUpVersion: `Hi ${name}, just following up in case the author website scorecard would be useful. The notes are focused on practical improvements around ${issues}, with a soft recommendation for ${fit}. Happy to share it if helpful.`,
  };
}

function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function buildOutreachMessagePrompt(input: OutreachMessageInput) {
  const promptData = {
    authorName: input.authorName?.trim() || null,
    websiteUrl: input.websiteUrl,
    domain: input.domain,
    authorType: input.authorType,
    websiteGoal: input.websiteGoal ?? null,
    overallScore: input.overallScore ?? null,
    serviceFit: input.serviceFit ?? null,
    findings: sortedFindings(input).map((finding) => ({
      title: truncate(finding.title, 120),
      finding: truncate(finding.finding, 260),
      recommendation: truncate(finding.recommendation, 260),
      priority: finding.priority,
      severity: finding.severity ?? null,
      category: finding.category ?? null,
    })),
  };

  return [
    "Return only JSON that matches the requested schema.",
    "Write three outreach drafts: emailVersion, shortDmVersion, and followUpVersion.",
    "Mention only one or two issues from the provided findings.",
    "If the author name is missing, use [Name].",
    "Keep the CTA soft, such as offering to send or share the scorecard.",
    "Do not insult the site or promise rankings, sales, traffic, or revenue.",
    safeJson(promptData),
  ].join("\n\n");
}

async function fetchOpenAIOutreachMessage(
  input: OutreachMessageInput,
  options: Required<
    Pick<GenerateOutreachMessageOptions, "apiKey" | "model" | "timeoutMs">
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
            content: OUTREACH_SYSTEM_INSTRUCTION,
          },
          {
            role: "user",
            content: buildOutreachMessagePrompt(input),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "admin_outreach_message",
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
      throw new Error("OpenAI did not return outreach JSON.");
    }

    return parseOutreachMessageJson(text);
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateOutreachMessage(
  input: OutreachMessageInput,
  options: GenerateOutreachMessageOptions = {}
): Promise<OutreachMessageResult> {
  const apiKey = options.apiKey?.trim();

  if (!apiKey) {
    return {
      source: "fallback",
      message: buildFallbackOutreachMessage(input),
    };
  }

  try {
    const message = await fetchOpenAIOutreachMessage(input, {
      apiKey,
      model: options.model?.trim() || DEFAULT_MODEL,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      fetchImplementation: options.fetchImplementation ?? fetch,
    });

    return {
      source: "ai",
      message,
    };
  } catch {
    return {
      source: "fallback",
      message: buildFallbackOutreachMessage(input),
    };
  }
}

export function serializeOutreachMessage(result: OutreachMessageResult) {
  return JSON.stringify({
    kind: "admin-outreach-message",
    version: 1,
    generatedAt: new Date().toISOString(),
    source: result.source,
    message: result.message,
  });
}

export function parseSerializedOutreachMessage(
  value: string | null
): SerializedOutreachMessage | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as {
      kind?: unknown;
      version?: unknown;
      generatedAt?: unknown;
      source?: unknown;
      message?: unknown;
    };

    if (parsed.kind !== "admin-outreach-message") {
      return null;
    }

    const message = outreachMessageSchema.safeParse(parsed.message);

    if (!message.success) {
      return null;
    }

    return {
      kind: "admin-outreach-message",
      version: typeof parsed.version === "number" ? parsed.version : 1,
      generatedAt:
        typeof parsed.generatedAt === "string" ? parsed.generatedAt : undefined,
      source: parsed.source === "ai" ? "ai" : "fallback",
      message: message.data,
    };
  } catch {
    return null;
  }
}
