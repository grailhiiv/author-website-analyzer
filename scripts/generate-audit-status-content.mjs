import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const canonicalDirectory = path.join(
  projectRoot,
  "docs",
  "audit-status-content",
);
const registryPath = path.join(
  projectRoot,
  "src",
  "lib",
  "scoring",
  "check-registry.ts",
);
const outputPath = path.join(
  projectRoot,
  "src",
  "lib",
  "scoring",
  "check-status-content.generated.ts",
);
const recommendationsPath = path.join(canonicalDirectory, "recommendations.md");

const cliArguments = process.argv.slice(2);
const recommendationsFlagIndex = cliArguments.indexOf("--recommendations");
const suppliedRecommendationsPath =
  recommendationsFlagIndex >= 0
    ? cliArguments[recommendationsFlagIndex + 1]
    : undefined;
const legacyStatusPaths =
  recommendationsFlagIndex >= 0 ? [] : cliArguments.slice(0, 3);

if (recommendationsFlagIndex >= 0 && !suppliedRecommendationsPath) {
  throw new Error("--recommendations requires a Markdown file path.");
}

const sources = [
  {
    status: "passed",
    statusLabel: "Passed",
    canonicalName: "passed.md",
    suppliedPath: legacyStatusPaths[0],
  },
  {
    status: "needs_review",
    statusLabel: "Needs Review",
    canonicalName: "needs-review.md",
    suppliedPath: legacyStatusPaths[1],
  },
  {
    status: "failed",
    statusLabel: "Failed",
    canonicalName: "failed.md",
    suppliedPath: legacyStatusPaths[2],
  },
];

const categoryContent = {
  BRAND_CLARITY: { label: "Brand Clarity", points: 15 },
  BOOK_VISIBILITY: { label: "Book Visibility", points: 20 },
  READER_ENGAGEMENT: { label: "Email Growth", points: 15 },
  SEARCH_VISIBILITY: { label: "Search Visibility", points: 15 },
  MOBILE_PERFORMANCE: { label: "Mobile Experience", points: 10 },
  TECHNICAL_HEALTH: { label: "Technical Health", points: 10 },
  AUTHOR_TRUST: { label: "Author Trust", points: 10 },
  SITE_USABILITY: { label: "Site Usability", points: 5 },
};

fs.mkdirSync(canonicalDirectory, { recursive: true });

if (suppliedRecommendationsPath) {
  fs.copyFileSync(
    path.resolve(suppliedRecommendationsPath),
    recommendationsPath,
  );
}

for (const source of sources) {
  const canonicalPath = path.join(canonicalDirectory, source.canonicalName);

  if (source.suppliedPath) {
    fs.copyFileSync(path.resolve(source.suppliedPath), canonicalPath);
  }

  source.canonicalPath = canonicalPath;
}

function parseRegisteredChecks() {
  const source = fs.readFileSync(registryPath, "utf8");
  const matches = [
    ...source.matchAll(
      /\bid:\s*"([^"]+)"[\s\S]*?\btitle:\s*"([^"]+)"[\s\S]*?\bcategory:\s*ReportCategory\.([A-Z_]+)[\s\S]*?\bpoints:\s*(\d+)/g,
    ),
  ];
  const checks = [];
  const seen = new Set();

  for (const match of matches) {
    const [, id, title, category, points] = match;

    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    checks.push({ id, title, category, points: Number(points) });
  }

  if (checks.length !== 50) {
    throw new Error(
      `Expected 50 registered checks, but parsed ${checks.length} from ${registryPath}.`,
    );
  }

  return checks;
}

function normalizeHeading(heading) {
  return heading
    .replace(/^\d+\.\d+\s+/, "")
    .replace(/\s+(?:—|â€”|-)\s+\d+\s+points?\s*$/i, "")
    .trim();
}

function parseStatusContent(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const markdown = fs.readFileSync(filePath, "utf8");
  const sections = markdown.split(/^### /m).slice(1);

  return sections.map((section) => {
    const [heading, ...bodyLines] = section.split(/\r?\n/);
    const body = bodyLines.join("\n");
    const title = normalizeHeading(heading);
    const details = body.match(/^\*\*Details:\*\*\s*(.+)$/m)?.[1]?.trim();
    const recommendation = body
      .match(/^\*\*Recommendation:\*\*\s*(.+)$/m)?.[1]
      ?.trim();

    if (!title || !details || !recommendation) {
      throw new Error(
        `Could not parse complete status content for "${heading}" in ${filePath}.`,
      );
    }

    return { title, details, recommendation };
  });
}

function paragraphForStatus(body, statusLabel) {
  const escapedStatus = statusLabel.replace(" ", "\\s+");
  const match = body.match(
    new RegExp(
      `\\*\\*${escapedStatus}\\*\\*\\s*\\r?\\n+([\\s\\S]*?)(?=\\r?\\n+\\*\\*(?:Passed|Failed|Needs\\s+Review)\\*\\*|\\r?\\n+---|$)`,
    ),
  );

  return match?.[1]?.replace(/\s+/g, " ").trim() ?? null;
}

function parseCombinedRecommendations(filePath) {
  const markdown = fs.readFileSync(filePath, "utf8");
  const sections = markdown.split(/^### /m).slice(1);

  return sections.map((section) => {
    const [heading, ...bodyLines] = section.split(/\r?\n/);
    const body = bodyLines.join("\n");
    const title = normalizeHeading(heading);
    const recommendations = Object.fromEntries(
      sources.map((source) => [
        source.status,
        paragraphForStatus(body, source.statusLabel),
      ]),
    );

    for (const source of sources) {
      const recommendation = recommendations[source.status];

      if (!recommendation) {
        throw new Error(
          `Missing ${source.statusLabel} recommendation for "${heading}" in ${filePath}.`,
        );
      }

      const wordCount = recommendation.split(/\s+/).filter(Boolean).length;

      if (wordCount < 35 || wordCount > 60) {
        throw new Error(
          `${source.statusLabel} recommendation for "${title}" contains ${wordCount} words; expected 35–60.`,
        );
      }
    }

    return { title, recommendations };
  });
}

function fallbackDetails(title, status) {
  const lowerTitle = title.toLowerCase();

  if (status === "passed") {
    return `The inspected evidence met the configured requirement for ${lowerTitle}.`;
  }

  if (status === "failed") {
    return `The inspected evidence did not meet the configured requirement for ${lowerTitle}.`;
  }

  return `The available evidence was incomplete or inconclusive, so ${lowerTitle} requires review.`;
}

function renderStatusMarkdown(source, checks, recommendations, priorDetails) {
  const lines = [
    `# ${source.statusLabel} Status Content — Author Website Analyzer`,
    "",
    "These are fallback Details statements and the canonical technical recommendations for each deterministic check. During a completed scan, Details are generated from the actual inspected evidence, page, observation, and threshold.",
    "",
  ];
  let currentCategory = null;
  let categoryIndex = 0;

  checks.forEach((check, index) => {
    if (check.category !== currentCategory) {
      currentCategory = check.category;
      categoryIndex += 1;
      const category = categoryContent[currentCategory];
      lines.push(
        `## ${categoryIndex}. ${category.label} — ${category.points} points`,
        "",
      );
    }

    const prior = priorDetails.get(check.title);
    lines.push(
      `### ${check.title} — ${check.points} ${check.points === 1 ? "point" : "points"}`,
      "",
      `**Status:** ${source.statusLabel}`,
      "",
      `**Details:** ${prior ?? fallbackDetails(check.title, source.status)}`,
      "",
      `**Recommendation:** ${recommendations[index].recommendations[source.status]}`,
      "",
    );
  });

  return `${lines.join("\n").trim()}\n`;
}

const checks = parseRegisteredChecks();

if (fs.existsSync(recommendationsPath)) {
  const combinedRecommendations =
    parseCombinedRecommendations(recommendationsPath);

  if (combinedRecommendations.length !== checks.length) {
    throw new Error(
      `Combined recommendations contain ${combinedRecommendations.length} checks; expected ${checks.length}.`,
    );
  }

  checks.forEach((check, index) => {
    if (combinedRecommendations[index].title !== check.title) {
      throw new Error(
        `Combined recommendation ${index + 1} is "${combinedRecommendations[index].title}", but the registry expects "${check.title}".`,
      );
    }
  });

  for (const source of sources) {
    const priorDetails = new Map(
      parseStatusContent(source.canonicalPath).map((entry) => [
        entry.title,
        entry.details,
      ]),
    );
    fs.writeFileSync(
      source.canonicalPath,
      renderStatusMarkdown(
        source,
        checks,
        combinedRecommendations,
        priorDetails,
      ),
      "utf8",
    );
  }
}

for (const source of sources) {
  if (!fs.existsSync(source.canonicalPath)) {
    throw new Error(
      `Missing ${source.status} content. Supply all three Markdown paths or add ${recommendationsPath}.`,
    );
  }
}

const contentByStatus = Object.fromEntries(
  sources.map((source) => [
    source.status,
    parseStatusContent(source.canonicalPath),
  ]),
);

for (const source of sources) {
  const content = contentByStatus[source.status];

  if (content.length !== checks.length) {
    throw new Error(
      `${source.status} contains ${content.length} checks; expected ${checks.length}.`,
    );
  }

  checks.forEach((check, index) => {
    if (content[index].title !== check.title) {
      throw new Error(
        `${source.status} check ${index + 1} is "${content[index].title}", but the registry expects "${check.title}".`,
      );
    }
  });
}

const lines = [
  "// This file is generated by scripts/generate-audit-status-content.mjs.",
  "// Edit the canonical Markdown files in docs/audit-status-content and regenerate.",
  "",
  'import type { ScoringCheckId } from "@/lib/scoring/check-registry";',
  "",
  'export type AuditCheckStatus = "passed" | "needs_review" | "failed";',
  "",
  "export type AuditCheckStatusContent = {",
  "  details: string;",
  "  recommendation: string;",
  "};",
  "",
  "export const CHECK_STATUS_CONTENT = {",
];

checks.forEach((check, index) => {
  lines.push(`  ${JSON.stringify(check.id)}: {`);

  for (const source of sources) {
    const content = contentByStatus[source.status][index];
    lines.push(`    ${source.status}: {`);
    lines.push(`      details: ${JSON.stringify(content.details)},`);
    lines.push(
      `      recommendation: ${JSON.stringify(content.recommendation)},`,
    );
    lines.push("    },");
  }

  lines.push("  },");
});

lines.push(
  "} as const satisfies Record<",
  "  ScoringCheckId,",
  "  Record<AuditCheckStatus, AuditCheckStatusContent>",
  ">;",
  "",
  "export function getCheckStatusContent(",
  "  checkId: ScoringCheckId,",
  "  status: AuditCheckStatus,",
  "): AuditCheckStatusContent {",
  "  return CHECK_STATUS_CONTENT[checkId][status];",
  "}",
);

const prettierConfig = (await prettier.resolveConfig(outputPath)) ?? {};
const generatedTypeScript = await prettier.format(`${lines.join("\n")}\n`, {
  ...prettierConfig,
  filepath: outputPath,
});

fs.writeFileSync(outputPath, generatedTypeScript, "utf8");

console.log(
  `Generated ${path.relative(projectRoot, outputPath)} from ${checks.length} checks across three statuses.`,
);
