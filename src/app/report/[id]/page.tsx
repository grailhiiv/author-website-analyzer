import {
  AlertCircleIcon,
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
import { ReportAuditSections } from "@/components/report/report-audit-sections";
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
  ReportStatus,
} from "@/generated/prisma/client";
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
import { buildReportAuditSections } from "@/lib/reports/report-check-view-model";
import {
  getVisualDesignAnalysis,
  visualDesignPillarLabels,
  type VisualDesignObservation,
  type VisualDesignPillar,
  type VisualViewportVariant,
} from "@/lib/screenshots/visual-design";

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
      checkResults: {
        orderBy: { createdAt: "asc" },
      },
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
  const weakestScore = [...orderedScores].sort(
    (a, b) =>
      scorePercent(a.score, a.maxScore) - scorePercent(b.score, b.maxScore) ||
      a.category.localeCompare(b.category),
  )[0];
  const quickWins = selectQuickWins(report.findings);
  const previewFindings = report.findings.slice(0, 1);
  const previewQuickWins = quickWins.slice(0, 1);
  const auditSections = buildReportAuditSections({
    checkResults: report.checkResults,
    findings: report.findings,
    scores: report.scores,
    siteUrl: report.normalizedUrl,
  });
  const isFullReportUnlocked = Boolean(report.lead?.email);
  const pageState = getReportPageState({
    status: report.status,
    hasLeadEmail: isFullReportUnlocked,
  });
  const weakestLabel = weakestScore
    ? reportCategoryDisplay[weakestScore.category].title
    : undefined;
  const interpretation = scoreInterpretation(report.overallScore, weakestLabel);
  const reportDate = report.completedAt ?? report.createdAt;
  const visualDesignAnalysis = getVisualDesignAnalysis(report.crawlDiagnostics);
  const consolidatedVisualObservations = visualDesignAnalysis
    ? consolidateVisualObservations(visualDesignAnalysis.observations)
    : [];
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
              <ReportAuditSections sections={auditSections} />
            ) : null}

            {pageState.showEmailGate ? (
              <Card id="report-unlock">
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
                <ReportAuditSections
                  sections={auditSections}
                  showExpandedGuidance
                />

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
