import {
  AlertCircleIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ImageIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  MonitorIcon,
  PaletteIcon,
  SmartphoneIcon,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

import { GridSection } from "@/components/layout/grid-section";
import { PageHeader } from "@/components/layout/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/report/report-accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/report/report-ui";
import { Badge, Button } from "@/components/report/report-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/report/report-ui";
import { Progress, Skeleton } from "@/components/report/report-ui";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/report/report-ui";
import {
  FindingSeverity,
  ReportCategory,
  ReportStatus,
} from "@/generated/prisma/client";
import {
  getExecutiveSummaryFromReportSummary,
  parseSerializedReportNarrative,
} from "@/lib/ai/report-narrative.core";
import {
  getAnalysisStageLabel,
  normalizeAnalysisProgress,
} from "@/lib/analysis/progress.core";
import { prisma } from "@/lib/db/prisma";
import {
  getDisplayDomain,
  getReportPath,
  normalizeReportDomain,
} from "@/lib/reports/domain";
import {
  reportCategoryDisplay,
  reportCategoryOrder,
} from "@/lib/reports/category-display";
import { getReportPageState } from "@/lib/reports/report-page-state";
import { parsePracticalActions } from "@/lib/reports/practical-actions";
import { isScoredVisualObservation } from "@/lib/scoring/check-registry";
import {
  getVisualDesignAnalysis,
  visualDesignManualReviewPrompts,
  visualDesignPillarLabels,
  type VisualDesignPillar,
} from "@/lib/screenshots/visual-design";
import type { ReportNarrative } from "@/lib/ai/report-narrative.core";
import type { ServiceFitLabel } from "@/lib/scoring/engine";

import { ReportStatusPoller } from "./report-status-poller";
import { UnlockReportForm } from "./unlock-report-form";

const statusLabels: Record<ReportStatus, string> = {
  QUEUED: "Queued",
  RUNNING: "Running",
  COMPLETE: "Complete",
  FAILED: "Failed",
};

const severityLabels: Record<FindingSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const visualDesignPillars: VisualDesignPillar[] = [
  "information_architecture",
  "ui_ux",
  "conversion_design",
];

function PracticalActions({ actions }: { actions: unknown }) {
  const items = parsePracticalActions(actions);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="text-sm font-medium">Practical actions</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
        {items.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </div>
  );
}

function statusVariant(status: ReportStatus) {
  if (status === ReportStatus.COMPLETE) {
    return "secondary" as const;
  }

  if (status === ReportStatus.FAILED) {
    return "destructive" as const;
  }

  return "outline" as const;
}

function severityVariant(severity: FindingSeverity) {
  if (
    severity === FindingSeverity.CRITICAL ||
    severity === FindingSeverity.HIGH
  ) {
    return "destructive" as const;
  }

  if (severity === FindingSeverity.MEDIUM) {
    return "secondary" as const;
  }

  return "outline" as const;
}

function scorePercent(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return 0;
  }

  return Math.round((score / maxScore) * 100);
}

function getLighthouseSource(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = (value as { source?: unknown }).source;

  return typeof source === "string" ? source : null;
}

function scoreInterpretation(score: number | null) {
  if (score === null) {
    return {
      label: "Not scored",
      description: "The report has not saved an overall score yet.",
    };
  }

  if (score >= 90) {
    return {
      label: "Strong",
      description:
        "The website is already doing many important author-site jobs well.",
    };
  }

  if (score >= 75) {
    return {
      label: "Good foundation",
      description:
        "The website has useful pieces in place, with a few clear improvements to make next.",
    };
  }

  if (score >= 60) {
    return {
      label: "Needs improvement",
      description:
        "The website can work harder for book discovery, reader trust, and next steps.",
    };
  }

  if (score >= 40) {
    return {
      label: "Weak",
      description: "Several important author website signals need attention.",
    };
  }

  return {
    label: "Needs major attention",
    description:
      "The website needs focused improvements before it can strongly support readers and books.",
  };
}

function formatReportDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function severityWeight(severity: FindingSeverity) {
  if (severity === FindingSeverity.CRITICAL) {
    return 4;
  }

  if (severity === FindingSeverity.HIGH) {
    return 3;
  }

  if (severity === FindingSeverity.MEDIUM) {
    return 2;
  }

  return 1;
}

function selectQuickWins<
  T extends {
    priority: number;
    severity: FindingSeverity;
    title: string;
    recommendation: string;
  },
>(findings: T[]) {
  return [...findings]
    .filter((finding) => finding.recommendation)
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        severityWeight(b.severity) - severityWeight(a.severity) ||
        a.title.localeCompare(b.title),
    )
    .slice(0, 5);
}

function countJsonArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function firstScreenshot<
  T extends {
    screenshotUrl: string | null;
  },
>(pages: T[]) {
  return pages.find((page) => page.screenshotUrl)?.screenshotUrl ?? null;
}

function extractServiceFitFromNarrative(
  narrative: ReportNarrative | null,
): ServiceFitLabel | null {
  if (!narrative) {
    return null;
  }

  const labels: ServiceFitLabel[] = [
    "Website redesign",
    "Website management",
    "SEO improvement",
    "Newsletter setup",
    "New author website",
    "Website optimization",
  ];

  return (
    labels.find((label) =>
      narrative.finalRecommendation.toLowerCase().includes(label.toLowerCase()),
    ) ?? null
  );
}

function deriveServiceFitLabel(
  scoresByCategory: Map<ReportCategory, { score: number; maxScore: number }>,
): ServiceFitLabel {
  const scoreFor = (category: ReportCategory) => {
    const score = scoresByCategory.get(category);

    return score ? scorePercent(score.score, score.maxScore) : 0;
  };
  const brand = scoreFor(ReportCategory.BRAND_CLARITY);
  const book = scoreFor(ReportCategory.BOOK_VISIBILITY);
  const newsletter = scoreFor(ReportCategory.READER_ENGAGEMENT);
  const seo = scoreFor(ReportCategory.SEARCH_VISIBILITY);
  const technical = scoreFor(ReportCategory.TECHNICAL_HEALTH);
  const lowCategoryCount = [...scoresByCategory.values()].filter(
    (score) => scorePercent(score.score, score.maxScore) < 60,
  ).length;

  if (lowCategoryCount >= 5) {
    return "New author website";
  }

  if (book < 60 && brand < 60) {
    return "Website redesign";
  }

  if (technical < 60) {
    return "Website management";
  }

  if (seo < 60 && brand >= 70) {
    return "SEO improvement";
  }

  if (newsletter < 60) {
    return "Newsletter setup";
  }

  return "Website optimization";
}

function ctaForServiceFit(serviceFitLabel: ServiceFitLabel) {
  const ctas: Record<ServiceFitLabel, string> = {
    "Website redesign":
      "Your site has the foundation, but the reader journey could be much clearer. GrailHiiv can help redesign it into a professional author website built around your books.",
    "Website management":
      "Your site may benefit from ongoing care, updates, monitoring, and backups. GrailHiiv can help keep your author website maintained.",
    "Newsletter setup":
      "Your site could do more to turn visitors into readers. GrailHiiv can help add a clear newsletter signup path.",
    "SEO improvement":
      "Your site has author-site pieces to build on, and GrailHiiv can help improve the basics that make books, pages, and author information easier to discover.",
    "New author website":
      "Your site may need a clearer foundation. GrailHiiv can help plan and build a professional author website around your books, bio, reader links, and ongoing updates.",
    "Website optimization":
      "Your site has useful pieces in place. GrailHiiv can help polish the reader journey, improve clarity, and keep the website easier to manage.",
  };

  return ctas[serviceFitLabel];
}

function findNarrativeCategoryCritique(
  narrative: ReportNarrative | null,
  labels: readonly string[],
) {
  return narrative?.categoryCritiques.find((critique) =>
    labels.some(
      (label) => critique.category.toLowerCase() === label.toLowerCase(),
    ),
  );
}

function deterministicSummary({
  overallScore,
  strongestLabel,
  weakestLabel,
  topFindingTitle,
}: {
  overallScore: number | null;
  strongestLabel?: string;
  weakestLabel?: string;
  topFindingTitle?: string;
}) {
  const parts = [
    `This report uses saved scan data to evaluate how well the website supports the author's books, reader trust, newsletter growth, and technical health.`,
  ];

  if (overallScore !== null) {
    parts.push(`The current score is ${overallScore}/100.`);
  }

  if (strongestLabel) {
    parts.push(`The strongest area is ${strongestLabel.toLowerCase()}.`);
  }

  if (weakestLabel) {
    parts.push(
      `The clearest area to improve is ${weakestLabel.toLowerCase()}.`,
    );
  }

  if (topFindingTitle) {
    parts.push(`Start with: ${topFindingTitle}.`);
  }

  return parts.join(" ");
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const domain = normalizeReportDomain(id);

  if (!domain) {
    notFound();
  }

  const report = await prisma.report.findFirst({
    where: { domain },
    orderBy: { createdAt: "desc" },
    include: {
      findings: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
      pagesScanned: {
        orderBy: { createdAt: "asc" },
      },
      scores: true,
      technicalAudit: true,
      lead: true,
      analysisJob: {
        select: {
          progress: true,
          stage: true,
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  const scoresByCategory = new Map(
    report.scores.map((score) => [score.category, score]),
  );
  const orderedScores = reportCategoryOrder.reduce<typeof report.scores>(
    (scores, category) => {
      const score = scoresByCategory.get(category);

      if (score) {
        scores.push(score);
      }

      return scores;
    },
    [],
  );
  const workingScores = orderedScores
    .filter((score) => score.score >= Math.round(score.maxScore * 0.8))
    .slice(0, 4);
  const strongestScore = [...orderedScores].sort(
    (a, b) =>
      scorePercent(b.score, b.maxScore) - scorePercent(a.score, a.maxScore) ||
      a.category.localeCompare(b.category),
  )[0];
  const weakestScore = [...orderedScores].sort(
    (a, b) =>
      scorePercent(a.score, a.maxScore) - scorePercent(b.score, b.maxScore) ||
      a.category.localeCompare(b.category),
  )[0];
  const priorityFindings = report.findings.slice(0, 5);
  const quickWins = selectQuickWins(report.findings);
  const previewFindings = report.findings.slice(0, 3);
  const previewQuickWins = quickWins.slice(0, 3);
  const serializedNarrative = parseSerializedReportNarrative(report.summary);
  const narrative = serializedNarrative?.narrative ?? null;
  const isFullReportUnlocked = Boolean(report.lead?.email);
  const pageState = getReportPageState({
    status: report.status,
    hasLeadEmail: isFullReportUnlocked,
  });
  const executiveSummary =
    narrative?.executiveSummary ??
    getExecutiveSummaryFromReportSummary(report.summary) ??
    deterministicSummary({
      overallScore: report.overallScore,
      strongestLabel: strongestScore
        ? reportCategoryDisplay[strongestScore.category].title
        : undefined,
      weakestLabel: weakestScore
        ? reportCategoryDisplay[weakestScore.category].title
        : undefined,
      topFindingTitle: priorityFindings[0]?.title,
    });
  const interpretation = scoreInterpretation(report.overallScore);
  const reportDate = report.completedAt ?? report.createdAt;
  const screenshotUrl = firstScreenshot(report.pagesScanned);
  const visualDesignAnalysis = getVisualDesignAnalysis(report.crawlDiagnostics);
  const visualDesignReviewCount =
    visualDesignAnalysis?.observations.filter(
      (observation) => observation.status === "needs_review",
    ).length ?? 0;
  const serviceFitLabel =
    extractServiceFitFromNarrative(narrative) ??
    deriveServiceFitLabel(scoresByCategory);
  const successfulPages = report.pagesScanned.filter(
    (page) =>
      page.statusCode && page.statusCode >= 200 && page.statusCode < 400,
  );
  const totalWordCount = report.pagesScanned.reduce(
    (total, page) => total + (page.wordCount ?? 0),
    0,
  );
  const internalLinkCount = report.pagesScanned.reduce(
    (total, page) => total + countJsonArray(page.linksJson),
    0,
  );
  const imageCount = report.pagesScanned.reduce(
    (total, page) => total + countJsonArray(page.imagesJson),
    0,
  );
  const formCount = report.pagesScanned.reduce(
    (total, page) => total + countJsonArray(page.formsJson),
    0,
  );

  return (
    <GridSection>
      <div className="py-10 sm:px-4 lg:px-6">
        <PageHeader
          eyebrow={`Report for ${report.domain}`}
          title="Author Website Scorecard"
          description={report.normalizedUrl}
          actions={
            <Badge variant={statusVariant(report.status)}>
              {statusLabels[report.status]}
            </Badge>
          }
        />

        {pageState.showAnalyzingState ? (
          <ReportStatusPoller
            progress={report.analysisJob?.progress ?? 0}
            reportId={report.id}
            stage={report.analysisJob?.stage ?? "QUEUED"}
            status={report.status}
          />
        ) : null}

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Website</CardTitle>
              <CardDescription>
                <a
                  href={report.normalizedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  {getDisplayDomain(report.domain)}
                  <ExternalLinkIcon className="size-3" aria-hidden="true" />
                </a>
              </CardDescription>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Report date</CardTitle>
              <CardDescription>{formatReportDate(reportDate)}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {pageState.showAnalyzingState ? (
          <AnalyzingReport
            progress={report.analysisJob?.progress ?? 0}
            stage={report.analysisJob?.stage ?? "QUEUED"}
            url={report.normalizedUrl}
            status={report.status}
          />
        ) : null}

        {pageState.showFailedState ? (
          <FailedReport errorMessage={report.errorMessage} />
        ) : null}

        {pageState.showCompleteState ? (
          <div className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Overall score</CardTitle>
                  <CardDescription className="break-all">
                    {report.url}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div>
                    <div className="flex flex-wrap items-end gap-3">
                      <span className="text-5xl font-semibold">
                        {report.overallScore ?? "--"}
                      </span>
                      <span className="pb-1 text-lg text-muted-foreground">
                        /100
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{interpretation.label}</Badge>
                      <p className="text-sm text-muted-foreground">
                        {interpretation.description}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Scores are calculated from saved scan data, not invented
                      by AI.
                    </p>
                  </div>
                  <Progress value={report.overallScore ?? 0} />
                  <Alert>
                    <CheckCircle2Icon data-icon="inline-start" />
                    <AlertTitle>Author-focused scoring</AlertTitle>
                    <AlertDescription>
                      This scorecard looks at how well the website supports
                      books, readers, trust, and author growth.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Website modules</CardTitle>
                  <CardDescription>
                    The report reviews these author website areas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {reportCategoryOrder.map((category) => (
                      <CategoryScoreCard
                        key={category}
                        label={reportCategoryDisplay[category].title}
                        description={
                          reportCategoryDisplay[category].description
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top 3 issues</CardTitle>
                  <CardDescription>
                    A preview of the highest-priority items found in this scan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {previewFindings.length > 0 ? (
                    previewFindings.map((finding) => (
                      <div key={finding.id} className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={severityVariant(finding.severity)}>
                            {severityLabels[finding.severity]}
                          </Badge>
                          <p className="text-sm font-medium">{finding.title}</p>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {finding.finding}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No priority issues have been saved for this report yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top 3 quick wins</CardTitle>
                  <CardDescription>
                    Practical improvements you can review before unlocking the
                    full report.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {previewQuickWins.length > 0 ? (
                    previewQuickWins.map((finding) => (
                      <div
                        key={finding.id}
                        className="rounded-lg border border-slate-200 bg-muted/20 p-4"
                      >
                        <p className="text-sm font-medium">{finding.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {finding.recommendation}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No quick wins have been saved for this report yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {pageState.showEmailGate ? (
              <Card>
                <CardHeader>
                  <CardTitle>Want the full author website critique?</CardTitle>
                  <CardDescription>
                    Enter your email and we will unlock the complete report with
                    detailed recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    The preview above gives you the score, category breakdown,
                    top issues, and quick wins first. The full report opens the
                    detailed findings, technical snapshot, suggested SEO copy,
                    and GrailHiiv recommendation.
                  </p>
                  <UnlockReportForm reportId={report.id} />
                </CardContent>
              </Card>
            ) : null}

            {pageState.showFullReport ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <CardTitle>Executive summary</CardTitle>
                        <Badge variant="outline">
                          {serializedNarrative?.source === "ai"
                            ? "AI-assisted wording"
                            : "Deterministic summary"}
                        </Badge>
                      </div>
                      <a
                        href={`${getReportPath(report.domain)}/pdf`}
                        className="button h-8 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:border-primary hover:text-primary"
                      >
                        <DownloadIcon data-icon="inline-start" />
                        Download PDF Report
                      </a>
                    </div>
                    <CardDescription>
                      A plain-language overview of the author website.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      {executiveSummary ??
                        "No executive summary has been saved for this report yet."}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>What is working</CardTitle>
                      <CardDescription>
                        The strongest areas supported by the saved score data.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      {narrative?.whatIsWorking.length ? (
                        narrative.whatIsWorking.slice(0, 4).map((item) => (
                          <div key={item} className="flex gap-3">
                            <CheckCircle2Icon data-icon="inline-start" />
                            <p className="text-sm leading-6 text-muted-foreground">
                              {item}
                            </p>
                          </div>
                        ))
                      ) : workingScores.length > 0 ? (
                        workingScores.map((score) => (
                          <div key={score.id} className="flex gap-3">
                            <CheckCircle2Icon data-icon="inline-start" />
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-medium">
                                {reportCategoryDisplay[score.category].title}
                              </p>
                              <p className="text-sm leading-6 text-muted-foreground">
                                {score.summary}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No strong categories have been recorded yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top priority fixes</CardTitle>
                      <CardDescription>
                        Findings are shown in the priority order saved with the
                        report.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      {priorityFindings.length > 0 ? (
                        priorityFindings.map((finding) => (
                          <div key={finding.id} className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={severityVariant(finding.severity)}
                              >
                                {severityLabels[finding.severity]}
                              </Badge>
                              <p className="text-sm font-medium">
                                {finding.title}
                              </p>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">
                              {finding.finding}
                            </p>
                            <p className="text-sm leading-6">
                              {finding.recommendation}
                            </p>
                            <PracticalActions
                              actions={finding.practicalActions}
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No priority findings have been saved for this report
                          yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick wins</CardTitle>
                      <CardDescription>
                        Practical next steps taken from saved recommendations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      {quickWins.length > 0 ? (
                        quickWins.map((finding) => (
                          <div
                            key={finding.id}
                            className="rounded-lg border p-4"
                          >
                            <p className="text-sm font-medium">
                              {finding.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {finding.recommendation}
                            </p>
                          </div>
                        ))
                      ) : narrative?.topRecommendations.length ? (
                        narrative.topRecommendations.slice(0, 5).map((item) => (
                          <div
                            key={item}
                            className="rounded-lg border border-slate-200 bg-muted/20 p-4"
                          >
                            <p className="text-sm leading-6 text-muted-foreground">
                              {item}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No quick wins have been saved for this report yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Detailed module findings</CardTitle>
                    <CardDescription>
                      Each module includes its purpose and related findings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion>
                      {reportCategoryOrder.map((category) => {
                        const categoryFindings = report.findings.filter(
                          (finding) => finding.category === category,
                        );
                        const narrativeCritique = findNarrativeCategoryCritique(
                          narrative,
                          [reportCategoryDisplay[category].title],
                        );

                        return (
                          <AccordionItem key={category}>
                            <AccordionTrigger>
                              <span className="pr-3">
                                {reportCategoryDisplay[category].title}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4">
                              <p className="text-sm leading-6 text-muted-foreground">
                                {reportCategoryDisplay[category].description}
                              </p>

                              {narrativeCritique ? (
                                <Alert>
                                  <CheckCircle2Icon data-icon="inline-start" />
                                  <AlertTitle>Category critique</AlertTitle>
                                  <AlertDescription>
                                    {narrativeCritique.critique}
                                  </AlertDescription>
                                </Alert>
                              ) : null}

                              {categoryFindings.length > 0 ? (
                                <div className="grid gap-3">
                                  {categoryFindings.map((finding) => (
                                    <div
                                      key={finding.id}
                                      className="rounded-lg border border-slate-200 bg-muted/20 p-4"
                                    >
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                          variant={severityVariant(
                                            finding.severity,
                                          )}
                                        >
                                          {severityLabels[finding.severity]}
                                        </Badge>
                                        <p className="font-medium">
                                          {finding.title}
                                        </p>
                                      </div>
                                      <p className="mt-3 leading-6 text-muted-foreground">
                                        {finding.finding}
                                      </p>
                                      <p className="mt-3 leading-6">
                                        {finding.recommendation}
                                      </p>
                                      <PracticalActions
                                        actions={finding.practicalActions}
                                      />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No priority finding has been recorded for this
                                  category.
                                </p>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Suggested improvements</CardTitle>
                    <CardDescription>
                      AI-assisted wording from saved scan findings, when
                      available.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {narrative ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-muted/20 p-4">
                          <p className="text-sm font-medium">
                            Homepage improvement
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {narrative.suggestedHomepageImprovement}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-muted/20 p-4">
                          <p className="text-sm font-medium">CTA improvement</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {narrative.suggestedCTAImprovement}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-muted/20 p-4">
                          <p className="text-sm font-medium">
                            Suggested SEO title
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {narrative.suggestedSeoTitle}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-muted/20 p-4">
                          <p className="text-sm font-medium">
                            Suggested meta description
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {narrative.suggestedMetaDescription}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No saved AI critique is available for this report yet.
                        The detailed findings and deterministic score data are
                        still shown below.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Technical snapshot</CardTitle>
                    <CardDescription>
                      PageSpeed data when available, plus basic crawl details
                      saved with the report.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    {report.technicalAudit ? (
                      <Tabs defaultValue="mobile">
                        <TabsList>
                          <TabsTrigger value="mobile" className="gap-2">
                            <SmartphoneIcon
                              className="size-4"
                              aria-hidden="true"
                            />
                            Mobile
                          </TabsTrigger>
                          <TabsTrigger value="desktop" className="gap-2">
                            <MonitorIcon
                              className="size-4"
                              aria-hidden="true"
                            />
                            Desktop
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="mobile" className="pt-4">
                          <TechnicalMetricGrid
                            metrics={[
                              [
                                "Performance",
                                report.technicalAudit.mobilePerformance,
                              ],
                              [
                                "Accessibility",
                                report.technicalAudit.mobileAccessibility,
                              ],
                              ["SEO", report.technicalAudit.mobileSeo],
                              [
                                "Best practices",
                                report.technicalAudit.mobileBestPractices,
                              ],
                            ]}
                          />
                        </TabsContent>
                        <TabsContent value="desktop" className="pt-4">
                          <TechnicalMetricGrid
                            metrics={[
                              [
                                "Performance",
                                report.technicalAudit.desktopPerformance,
                              ],
                              [
                                "Accessibility",
                                report.technicalAudit.desktopAccessibility,
                              ],
                              ["SEO", report.technicalAudit.desktopSeo],
                              [
                                "Best practices",
                                report.technicalAudit.desktopBestPractices,
                              ],
                            ]}
                          />
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <Alert>
                        <AlertCircleIcon data-icon="inline-start" />
                        <AlertTitle>PageSpeed data not available</AlertTitle>
                        <AlertDescription>
                          The report can still use crawl data and saved
                          findings, but no PageSpeed scores were stored for this
                          run.
                        </AlertDescription>
                      </Alert>
                    )}

                    {report.technicalAudit &&
                    getLighthouseSource(
                      report.technicalAudit.lighthouseJson,
                    ) ? (
                      <p className="text-xs text-muted-foreground">
                        Lighthouse source:{" "}
                        {getLighthouseSource(
                          report.technicalAudit.lighthouseJson,
                        )}
                      </p>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <SnapshotMetric
                        label="Pages scanned"
                        value={report.pagesScanned.length}
                      />
                      <SnapshotMetric
                        label="Successful pages"
                        value={successfulPages.length}
                      />
                      <SnapshotMetric
                        label="Words found"
                        value={totalWordCount}
                      />
                      <SnapshotMetric
                        label="Links, images, forms"
                        value={`${internalLinkCount} / ${imageCount} / ${formCount}`}
                      />
                    </div>

                    {report.pagesScanned.length > 0 ? (
                      <div className="grid gap-3">
                        {report.pagesScanned.map((page) => (
                          <div
                            key={page.id}
                            className="grid gap-2 rounded-lg border border-slate-200 bg-muted/20 p-4 md:grid-cols-[1fr_auto]"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                  {page.pageType ?? "Unknown"}
                                </Badge>
                                <p className="text-sm font-medium">
                                  {page.title ?? page.url}
                                </p>
                              </div>
                              <p className="mt-2 break-all text-sm text-muted-foreground">
                                {page.url}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground md:justify-end">
                              <span>Status {page.statusCode ?? "unknown"}</span>
                              <span>{page.wordCount ?? 0} words</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No scanned pages have been saved for this report yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Website preview</CardTitle>
                    <CardDescription>
                      Homepage screenshot saved during analysis, when capture
                      was available.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {screenshotUrl ? (
                      <Image
                        src={screenshotUrl}
                        alt={`Screenshot preview for ${report.domain}`}
                        width={1200}
                        height={675}
                        className="aspect-video w-full rounded-lg border border-slate-200 object-cover object-top"
                      />
                    ) : (
                      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-muted/30 text-center">
                        <ImageIcon className="size-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">No screenshot saved</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            The report still uses saved scan data and findings.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {visualDesignAnalysis ? (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-3">
                        <PaletteIcon className="size-5 text-muted-foreground" />
                        <CardTitle>Design & reader experience</CardTitle>
                        <Badge variant="outline">Rendered evidence</Badge>
                        <Badge variant="secondary">3 checks scored</Badge>
                      </div>
                      <CardDescription>
                        Primary navigation contributes to Site Usability. Mobile
                        viewport fit and text contrast contribute to Mobile
                        Performance. The remaining observations are advisory.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={
                            visualDesignReviewCount > 0
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {visualDesignReviewCount} automated item
                          {visualDesignReviewCount === 1 ? "" : "s"} to review
                        </Badge>
                        <Badge variant="outline">
                          {visualDesignAnalysis.viewports.length} viewport
                          {visualDesignAnalysis.viewports.length === 1
                            ? ""
                            : "s"}{" "}
                          inspected
                        </Badge>
                        {visualDesignAnalysis.status === "partial" ? (
                          <Badge variant="outline">Partial evidence</Badge>
                        ) : null}
                      </div>

                      {visualDesignPillars.map((pillar) => {
                        const observations =
                          visualDesignAnalysis.observations.filter(
                            (observation) =>
                              observation.pillar === pillar &&
                              observation.status !== "passed",
                          );

                        return (
                          <section key={pillar} className="space-y-3">
                            <h3 className="text-sm font-semibold">
                              {visualDesignPillarLabels[pillar]}
                            </h3>
                            {observations.length > 0 ? (
                              <div className="grid gap-3 lg:grid-cols-2">
                                {observations.map((observation) => (
                                  <div
                                    key={
                                      observation.viewport +
                                      "-" +
                                      observation.id
                                    }
                                    className="rounded-lg border border-slate-200 bg-muted/20 p-4"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge
                                        variant={
                                          observation.status === "needs_review"
                                            ? "secondary"
                                            : "outline"
                                        }
                                      >
                                        {observation.status === "needs_review"
                                          ? "Review"
                                          : "Not measured"}
                                      </Badge>
                                      <Badge variant="outline">
                                        {isScoredVisualObservation(observation)
                                          ? "Score check"
                                          : "Advisory"}
                                      </Badge>
                                      <p className="text-sm font-medium">
                                        {observation.title}
                                      </p>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                      {observation.summary}
                                    </p>
                                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                      Evidence: {observation.evidence}
                                    </p>
                                    {observation.recommendation ? (
                                      <p className="mt-3 text-sm leading-6">
                                        <span className="font-medium">
                                          Recommendation:{" "}
                                        </span>
                                        {observation.recommendation}
                                      </p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No measurable issue was flagged for this pillar.
                              </p>
                            )}
                          </section>
                        );
                      })}

                      <div className="border-t border-slate-200 pt-5">
                        <h3 className="text-sm font-semibold">
                          Quick manual checklist
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          These judgments still need a person because a snapshot
                          cannot reliably determine design intent or the full
                          multi-page journey.
                        </p>
                        <ul className="mt-3 space-y-3">
                          {visualDesignManualReviewPrompts.map((item) => (
                            <li
                              key={item.pillar}
                              className="rounded-lg border border-slate-200 p-4"
                            >
                              <p className="text-sm font-medium">
                                {visualDesignPillarLabels[item.pillar]}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {item.prompt}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-3">
                      <CardTitle>GrailHiiv recommendation</CardTitle>
                      <Badge variant="secondary">{serviceFitLabel}</Badge>
                    </div>
                    <CardDescription>
                      A low-pressure next step if you want help improving the
                      website.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      {ctaForServiceFit(serviceFitLabel)}
                    </p>
                    {narrative?.finalRecommendation ? (
                      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                        {narrative.finalRecommendation}
                      </p>
                    ) : null}
                  </CardContent>
                  <CardFooter>
                    <form action="/">
                      <Button type="submit">Get Website Help</Button>
                    </form>
                  </CardFooter>
                </Card>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </GridSection>
  );
}

function CategoryScoreCard({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function SnapshotMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{value}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function TechnicalMetricGrid({
  metrics,
}: {
  metrics: Array<[label: string, value: number | null]>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(([label, value]) => (
        <Card key={label} size="sm">
          <CardHeader>
            <CardTitle>{label}</CardTitle>
            <CardDescription>{value ?? "Not available"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={value ?? 0} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AnalyzingReport({
  progress,
  stage,
  url,
  status,
}: {
  progress: number;
  stage: string;
  url: string;
  status: ReportStatus;
}) {
  const normalizedProgress = normalizeAnalysisProgress(progress);
  const stageLabel = getAnalysisStageLabel(stage);

  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      <Alert>
        {status === ReportStatus.RUNNING ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : (
          <ClockIcon data-icon="inline-start" />
        )}
        <AlertTitle>We&apos;re analyzing your author website.</AlertTitle>
        <AlertDescription>
          {stageLabel}. {normalizedProgress}% complete.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Analysis in progress</CardTitle>
          <CardDescription className="break-all">{url}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-foreground">{stageLabel}</span>
              <span className="tabular-nums text-muted-foreground">
                {normalizedProgress}%
              </span>
            </div>
            <Progress value={normalizedProgress} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-muted/20 p-4"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FailedReport({ errorMessage }: { errorMessage: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Website could not be analyzed</CardTitle>
        <CardDescription>
          The website could not be analyzed. You can try another website or
          check the URL and submit again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircleIcon data-icon="inline-start" />
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>
            {errorMessage ??
              "The scan did not complete. Please try another website."}
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <form action="/">
          <Button type="submit" variant="outline">
            Try another website
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
