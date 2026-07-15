import {
  AlertCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  ExternalLinkIcon,
  ClockIcon,
  Loader2Icon,
  MonitorIcon,
  PaletteIcon,
  SmartphoneIcon,
} from "lucide-react";
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
import EcmeProgress from "@/components/ui/Progress";
import {
  FindingSeverity,
  ReportCategory,
  ReportStatus,
} from "@/generated/prisma/client";
import { parseSerializedReportNarrative } from "@/lib/ai/report-narrative.core";
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
import {
  getVisualDesignAnalysis,
  visualDesignManualReviewPrompts,
  visualDesignPillarLabels,
  type VisualDesignObservation,
  type VisualDesignPillar,
  type VisualViewportVariant,
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

function PracticalActions({
  actions,
  label = "Practical actions",
  limit,
}: {
  actions: unknown;
  label?: string;
  limit?: number;
}) {
  const items = parsePracticalActions(actions).slice(0, limit);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="text-sm font-medium">{label}</p>
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

function scoreInterpretation(score: number | null, weakestLabel?: string) {
  const nextFocus = weakestLabel
    ? ` Focus next on ${weakestLabel.toLowerCase()}.`
    : "";

  if (score === null) {
    return {
      label: "Not scored",
      description: "The report has not saved an overall score yet.",
    };
  }

  if (score >= 90) {
    return {
      label: "Strong",
      description: `Most author-site essentials are working well.${nextFocus}`,
    };
  }

  if (score >= 75) {
    return {
      label: "Strong foundation",
      description: `The website performs well overall, with a few clear improvements available.${nextFocus}`,
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
  const parts: string[] = [];

  if (overallScore !== null) {
    parts.push(`Your website scores ${overallScore}/100.`);
  }

  if (strongestLabel) {
    parts.push(`It performs best in ${strongestLabel.toLowerCase()}.`);
  }

  if (weakestLabel) {
    parts.push(`The clearest opportunity is ${weakestLabel.toLowerCase()}.`);
  }

  if (topFindingTitle) {
    parts.push(`Start by addressing ${topFindingTitle.toLowerCase()}.`);
  }

  return parts.join(" ");
}

function actionPlanTitle(checkId: string | null | undefined, fallback: string) {
  const titles: Record<string, string> = {
    "usability.primary_navigation": "Make navigation work on every screen",
    "mobile.pagespeed_performance": "Speed up the homepage on mobile",
    "engagement.reader_magnet": "Give readers a reason to subscribe",
    "engagement.subscriber_benefit":
      "Explain what newsletter subscribers will receive",
    "mobile.image_alt_text": "Add alt text to important images",
  };

  return (checkId ? titles[checkId] : undefined) ?? fallback;
}

function ctaForServiceFit(serviceFitLabel: ServiceFitLabel) {
  const descriptions: Record<ServiceFitLabel, string> = {
    "Website redesign":
      "Turn the findings into a clearer website structure, stronger visual hierarchy, and a more useful path for readers.",
    "Website management":
      "Get ongoing help prioritizing updates, maintaining the website, and improving it over time.",
    "SEO improvement":
      "Use the search findings to improve how readers discover the author and books through search.",
    "Newsletter setup":
      "Build a clearer signup path and give readers a stronger reason to join the author newsletter.",
    "New author website":
      "Use the report as a practical brief for an author website built around books, readers, and long-term growth.",
    "Website optimization":
      "Work through the highest-impact fixes first, then refine the website’s speed, clarity, and reader journey.",
  };

  return descriptions[serviceFitLabel];
}

function visualObservationTitle(title: string) {
  const normalizedTitle = title.toLowerCase();

  if (
    normalizedTitle.includes("main heading") ||
    normalizedTitle.includes("main-heading") ||
    normalizedTitle.includes("h1")
  ) {
    return "The main heading was not visible without scrolling";
  }

  if (
    normalizedTitle.includes("primary action") ||
    normalizedTitle.includes("primary-action")
  ) {
    return "Readers are not shown a clear next step before scrolling";
  }

  if (normalizedTitle.includes("navigation")) {
    return "Navigation was not detected";
  }

  if (
    normalizedTitle.includes("tap target") ||
    normalizedTitle.includes("tap-target")
  ) {
    return "Some links or controls may be difficult to tap";
  }

  return title;
}

function performanceSummary(
  mobilePerformance: number | null,
  desktopPerformance: number | null,
) {
  if (mobilePerformance === null && desktopPerformance === null) {
    return "Homepage speed data was not available for this scan.";
  }

  if (mobilePerformance !== null && desktopPerformance !== null) {
    if (desktopPerformance - mobilePerformance >= 15) {
      return `Mobile speed needs the most attention: ${mobilePerformance}/100 compared with ${desktopPerformance}/100 on desktop.`;
    }

    return `Homepage performance scored ${mobilePerformance}/100 on mobile and ${desktopPerformance}/100 on desktop.`;
  }

  return mobilePerformance !== null
    ? `Homepage performance scored ${mobilePerformance}/100 on mobile.`
    : `Homepage performance scored ${desktopPerformance}/100 on desktop.`;
}

const viewportLabels: Record<VisualViewportVariant, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

function consolidateVisualObservations(
  observations: VisualDesignObservation[],
) {
  const groups = new Map<string, VisualDesignObservation[]>();

  observations
    .filter((observation) => observation.status === "needs_review")
    .forEach((observation) => {
      const existing = groups.get(observation.id) ?? [];
      existing.push(observation);
      groups.set(observation.id, existing);
    });

  return [...groups.values()].map((group) => ({
    ...group[0],
    viewports: [...new Set(group.map((observation) => observation.viewport))],
  }));
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
  const priorityFindings = report.findings.slice(0, 3);
  const quickWins = selectQuickWins(report.findings);
  const previewFindings = report.findings.slice(0, 1);
  const previewQuickWins = quickWins.slice(0, 1);
  const serializedNarrative = parseSerializedReportNarrative(report.summary);
  const narrative = serializedNarrative?.narrative ?? null;
  const isFullReportUnlocked = Boolean(report.lead?.email);
  const pageState = getReportPageState({
    status: report.status,
    hasLeadEmail: isFullReportUnlocked,
  });
  const weakestLabel = weakestScore
    ? reportCategoryDisplay[weakestScore.category].title
    : undefined;
  const executiveSummary = deterministicSummary({
    overallScore: report.overallScore,
    strongestLabel: strongestScore
      ? reportCategoryDisplay[strongestScore.category].title
      : undefined,
    weakestLabel,
    topFindingTitle: priorityFindings[0]
      ? actionPlanTitle(priorityFindings[0].checkId, priorityFindings[0].title)
      : undefined,
  });
  const interpretation = scoreInterpretation(report.overallScore, weakestLabel);
  const reportDate = report.completedAt ?? report.createdAt;
  const visualDesignAnalysis = getVisualDesignAnalysis(report.crawlDiagnostics);
  const consolidatedVisualObservations = visualDesignAnalysis
    ? consolidateVisualObservations(visualDesignAnalysis.observations)
    : [];
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

  return (
    <GridSection>
      <div className="py-8 sm:py-10 lg:py-12">
        <PageHeader
          eyebrow={
            pageState.showFullReport ? undefined : `Report for ${report.domain}`
          }
          title={
            pageState.showFullReport
              ? `Website report for ${getDisplayDomain(report.domain)}`
              : "Author Website Scorecard"
          }
          description={
            pageState.showFullReport
              ? `Analyzed ${formatReportDate(reportDate)}`
              : report.normalizedUrl
          }
          actions={
            pageState.showFullReport ? (
              <a href={`${getReportPath(report.domain)}/pdf`}>
                <Button
                  asElement="div"
                  size="sm"
                  icon={<DownloadIcon aria-hidden="true" />}
                >
                  Download PDF report
                </Button>
              </a>
            ) : (
              <Badge variant={statusVariant(report.status)}>
                {statusLabels[report.status]}
              </Badge>
            )
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

        {!pageState.showFullReport ? (
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
                <CardDescription>
                  {formatReportDate(reportDate)}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : null}

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
          <div className="flex flex-col gap-6 lg:gap-8">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <Card bodyClass="flex flex-col gap-5 p-6 lg:p-8">
                <CardHeader>
                  <CardTitle className="text-lg tracking-tight">
                    Overall score
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {pageState.showFullReport ? (
                    <div className="flex justify-center py-2">
                      <EcmeProgress
                        variant="circle"
                        percent={report.overallScore ?? 0}
                        width={148}
                        strokeWidth={8}
                        customInfo={
                          <div className="text-center">
                            <div className="text-3xl font-bold tabular-nums text-slate-950">
                              {report.overallScore ?? "--"}
                            </div>
                            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Website score
                            </div>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-end gap-3">
                        <span className="text-5xl font-semibold">
                          {report.overallScore ?? "--"}
                        </span>
                        <span className="pb-1 text-lg text-muted-foreground">
                          /100
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                    <Badge variant="secondary">{interpretation.label}</Badge>
                    <p className="text-sm text-muted-foreground">
                      {interpretation.description}
                    </p>
                  </div>
                  {!pageState.showFullReport ? (
                    <Progress value={report.overallScore ?? 0} />
                  ) : null}
                  <p className="text-xs leading-5 text-muted-foreground">
                    Score based on the checks completed in this scan.
                  </p>
                </CardContent>
              </Card>

              <Card bodyClass="flex flex-col gap-5 p-6 lg:p-8">
                <CardHeader>
                  <CardTitle className="text-lg tracking-tight">
                    Your category scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {reportCategoryOrder.map((category) => {
                      const score = scoresByCategory.get(category);

                      return (
                        <CategoryScoreCard
                          key={category}
                          label={reportCategoryDisplay[category].title}
                          score={score?.score ?? null}
                          maxScore={score?.maxScore ?? null}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {!pageState.showFullReport ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top problem</CardTitle>
                    <CardDescription>
                      The highest-priority issue found in this scan.
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
                            <p className="text-sm font-medium">
                              {finding.title}
                            </p>
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
                    <CardTitle>Quick win</CardTitle>
                    <CardDescription>
                      One practical improvement you can make before unlocking
                      the full report.
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
            ) : null}

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
                    top problem, and one quick win. The full report adds every
                    finding, a prioritized action plan, performance results, and
                    design evidence.
                  </p>
                  <UnlockReportForm reportId={report.id} />
                </CardContent>
              </Card>
            ) : null}

            {pageState.showFullReport ? (
              <>
                <Card bodyClass="flex flex-col gap-5 p-6 lg:p-8">
                  <CardHeader>
                    <CardTitle className="text-xl tracking-tight">
                      What to focus on first
                    </CardTitle>
                    <CardDescription>
                      The clearest strengths and the best place to begin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                      {executiveSummary ||
                        "No summary has been saved for this report yet."}
                    </p>
                  </CardContent>
                </Card>

                <Card bodyClass="flex flex-col gap-5 p-6 lg:p-8">
                  <CardHeader>
                    <CardTitle className="text-xl tracking-tight">
                      Your action plan
                    </CardTitle>
                    <CardDescription>
                      Start with these three improvements, in priority order.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 lg:grid-cols-2">
                    {priorityFindings.length > 0 ? (
                      priorityFindings.map((finding, index) => (
                        <div
                          key={finding.id}
                          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-muted/20 p-5 lg:p-6"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-muted-foreground">
                              {index + 1}.
                            </span>
                            <Badge variant={severityVariant(finding.severity)}>
                              {severityLabels[finding.severity]}
                            </Badge>
                            <p className="text-base font-semibold leading-6">
                              {actionPlanTitle(finding.checkId, finding.title)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Why it matters
                            </p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {finding.finding}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Recommended fix
                            </p>
                            <p className="mt-1 text-sm leading-6">
                              {finding.recommendation}
                            </p>
                          </div>
                          <PracticalActions
                            actions={finding.practicalActions}
                            label="Checklist"
                            limit={3}
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

                <Card bodyClass="flex flex-col gap-5 p-6 lg:p-8">
                  <CardHeader>
                    <CardTitle className="text-xl tracking-tight">
                      Findings by category
                    </CardTitle>
                    <CardDescription>
                      Review every issue and recommendation, grouped by score
                      category.
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
                        const categoryScore = scoresByCategory.get(category);

                        return (
                          <AccordionItem key={category}>
                            <AccordionTrigger>
                              <span className="flex w-full items-center justify-between gap-4 pr-3">
                                <span>
                                  {reportCategoryDisplay[category].title}
                                </span>
                                <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                                  {categoryScore
                                    ? `${categoryScore.score}/${categoryScore.maxScore}`
                                    : "Not scored"}
                                </span>
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4">
                              {narrativeCritique ? (
                                <Alert>
                                  <CheckCircle2Icon data-icon="inline-start" />
                                  <AlertTitle>Category overview</AlertTitle>
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
                                      className="rounded-2xl border border-slate-200 bg-muted/20 p-5 lg:p-6"
                                    >
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                          variant={severityVariant(
                                            finding.severity,
                                          )}
                                        >
                                          {severityLabels[finding.severity]}
                                        </Badge>
                                        <p className="text-base font-semibold leading-6">
                                          {finding.title}
                                        </p>
                                      </div>
                                      <div className="mt-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                          What we found
                                        </p>
                                        <p className="mt-1 leading-6 text-muted-foreground">
                                          {finding.finding}
                                        </p>
                                      </div>
                                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                          Recommended next step
                                        </p>
                                        <p className="mt-1 leading-6">
                                          {finding.recommendation}
                                        </p>
                                        <PracticalActions
                                          actions={finding.practicalActions}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No priority issues were found in this
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

                <Card bodyClass="flex flex-col gap-5 p-6 lg:p-8">
                  <CardHeader>
                    <CardTitle className="text-xl tracking-tight">
                      Speed and accessibility
                    </CardTitle>
                    <CardDescription>
                      Homepage measurements from Google Lighthouse.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    {report.technicalAudit ? (
                      <div className="space-y-4">
                        <p className="text-sm leading-6 text-muted-foreground">
                          {performanceSummary(
                            report.technicalAudit.mobilePerformance,
                            report.technicalAudit.desktopPerformance,
                          )}
                        </p>
                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 p-5 lg:p-6">
                            <div className="mb-4 flex items-center gap-2">
                              <SmartphoneIcon
                                className="size-4"
                                aria-hidden="true"
                              />
                              <h3 className="text-base font-semibold">
                                Mobile
                              </h3>
                            </div>
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
                                  "Technical best practices",
                                  report.technicalAudit.mobileBestPractices,
                                ],
                              ]}
                            />
                          </div>
                          <div className="rounded-2xl border border-slate-200 p-5 lg:p-6">
                            <div className="mb-4 flex items-center gap-2">
                              <MonitorIcon
                                className="size-4"
                                aria-hidden="true"
                              />
                              <h3 className="text-base font-semibold">
                                Desktop
                              </h3>
                            </div>
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
                                  "Technical best practices",
                                  report.technicalAudit.desktopBestPractices,
                                ],
                              ]}
                            />
                          </div>
                        </div>
                      </div>
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
                  </CardContent>
                </Card>

                {visualDesignAnalysis ? (
                  <Card bodyClass="flex flex-col gap-5 p-6 lg:p-8">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-3">
                        <PaletteIcon className="size-5 text-muted-foreground" />
                        <CardTitle className="text-xl tracking-tight">
                          Design and reader experience
                        </CardTitle>
                      </div>
                      <CardDescription>
                        These layout issues may make it harder for readers to
                        navigate, understand the page, or take the next step.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {visualDesignPillars.map((pillar) => {
                        const observations =
                          consolidatedVisualObservations.filter(
                            (observation) => observation.pillar === pillar,
                          );

                        return (
                          <section key={pillar} className="space-y-3">
                            <h3 className="text-base font-semibold">
                              {visualDesignPillarLabels[pillar]}
                            </h3>
                            {observations.length > 0 ? (
                              <div className="grid gap-3 lg:grid-cols-2">
                                {observations.map((observation) => (
                                  <div
                                    key={observation.id}
                                    className="rounded-2xl border border-slate-200 bg-muted/20 p-5 lg:p-6"
                                  >
                                    <p className="text-base font-semibold leading-6">
                                      {visualObservationTitle(
                                        observation.title,
                                      )}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {observation.viewports.map((viewport) => (
                                        <Badge key={viewport} variant="outline">
                                          {viewportLabels[viewport]}
                                        </Badge>
                                      ))}
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                      {observation.summary}
                                    </p>
                                    {observation.recommendation ? (
                                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                          Recommended next step
                                        </p>
                                        <p className="mt-1 text-sm leading-6">
                                          {observation.recommendation}
                                        </p>
                                      </div>
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
                    </CardContent>
                  </Card>
                ) : null}

                <Card bodyClass="flex flex-col gap-5 p-6 lg:p-8">
                  <CardHeader>
                    <CardTitle className="text-xl tracking-tight">
                      About this scan
                    </CardTitle>
                    <CardDescription>
                      Coverage, scoring, and review details for this report.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <Accordion>
                      <AccordionItem>
                        <AccordionTrigger>How scores work</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <p className="text-sm leading-6 text-muted-foreground">
                            Numeric scores come from measurable website checks.
                            AI may help explain saved results, but it does not
                            determine the scores.
                          </p>
                          {visualDesignAnalysis ? (
                            <p className="text-sm leading-6 text-muted-foreground">
                              Primary navigation affects Site Usability. Mobile
                              viewport fit and text contrast affect Mobile
                              Performance. Other visual observations are
                              advisory and do not change the score.
                            </p>
                          ) : null}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem>
                        <AccordionTrigger>View scan details</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-5">
                          <div className="grid gap-3 md:grid-cols-3">
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
                          </div>
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
                                    <span>
                                      Status {page.statusCode ?? "unknown"}
                                    </span>
                                    <span>{page.wordCount ?? 0} words</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No scanned pages were saved for this report.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                      {visualDesignAnalysis ? (
                        <AccordionItem>
                          <AccordionTrigger>
                            Optional human review
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                              {visualDesignManualReviewPrompts.map((item) => (
                                <li key={item.pillar}>{item.prompt}</li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ) : null}
                    </Accordion>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex flex-col items-start gap-2">
                      <CardTitle className="text-xl tracking-tight">
                        Want help turning this report into a plan?
                      </CardTitle>
                      <Badge variant="secondary">
                        Best fit: {serviceFitLabel}
                      </Badge>
                    </div>
                    <CardDescription>
                      Review the priorities with GrailHiiv and decide what to do
                      first.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      {ctaForServiceFit(serviceFitLabel)}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <form action="/">
                      <Button type="submit" size="lg">
                        Book a website review
                      </Button>
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
  score,
  maxScore,
}: {
  label: string;
  score: number | null;
  maxScore: number | null;
}) {
  const percentage =
    score !== null && maxScore !== null ? scorePercent(score, maxScore) : null;

  return (
    <div className="rounded-2xl border border-slate-200 p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-semibold leading-6">{label}</p>
        <span className="text-sm font-semibold tabular-nums text-slate-950">
          {score === null || maxScore === null
            ? "Not scored"
            : `${score}/${maxScore}`}
        </span>
      </div>
      <div className="mt-3">
        <Progress value={percentage ?? 0} />
      </div>
    </div>
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
    <div className="grid gap-3 sm:grid-cols-2">
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
