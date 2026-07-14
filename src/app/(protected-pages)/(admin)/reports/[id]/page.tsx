import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  TbArrowLeft,
  TbDeviceDesktopFilled,
  TbDeviceMobileFilled,
  TbExternalLink,
  TbFileAnalytics,
  TbPhoto,
} from "react-icons/tb";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Progress from "@/components/ui/Progress";
import Table from "@/components/ui/Table";
import Tag from "@/components/ui/Tag";
import Timeline from "@/components/ui/Timeline";
import { ReportCategory, SalesLeadStatus } from "@/generated/prisma/client";
import {
  categoryLabels,
  findingSeverityLabels,
  formatDate,
  formatPriority,
  formatScore,
  priorityOptions,
  reportStatusLabels,
  salesLeadStatusLabels,
} from "@/lib/admin/display";
import { parseSerializedOutreachMessage } from "@/lib/ai/outreach-message.core";
import { parseSerializedReportNarrative } from "@/lib/ai/report-narrative.core";
import { prisma } from "@/lib/db/prisma";
import type {
  KeyLighthouseAudit,
  KeyLighthouseData,
  PageSpeedScores,
  PageSpeedStrategy,
} from "@/lib/pagespeed/service.core";
import {
  getAdminReportPath,
  getReportPath,
  normalizeReportDomain,
} from "@/lib/reports/domain";
import { parsePracticalActions } from "@/lib/reports/practical-actions";

import ReportAdminWorkspace from "./_components/report-admin-workspace";

const categoryOrder = [
  ReportCategory.BRAND_CLARITY,
  ReportCategory.BOOK_VISIBILITY,
  ReportCategory.READER_ENGAGEMENT,
  ReportCategory.SEARCH_VISIBILITY,
  ReportCategory.MOBILE_PERFORMANCE,
  ReportCategory.TECHNICAL_HEALTH,
  ReportCategory.AUTHOR_TRUST,
  ReportCategory.SITE_USABILITY,
];

const serviceFitOptions = [
  "Website redesign",
  "Website management",
  "SEO improvement",
  "Newsletter setup",
  "New author website",
  "Website optimization",
  "Not sure",
];

function scorePercent(score: number, maxScore: number) {
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

function countJsonArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getLighthouseData(
  value: unknown,
  strategy: PageSpeedStrategy,
): KeyLighthouseData | null {
  if (!isRecord(value)) return null;

  const data = value[strategy];

  if (
    !isRecord(data) ||
    data.strategy !== strategy ||
    !isRecord(data.categories) ||
    !isRecord(data.audits)
  ) {
    return null;
  }

  return data as KeyLighthouseData;
}

function hasPageSpeedScore(scores: PageSpeedScores) {
  return Object.values(scores).some((value) => value !== null);
}

function lighthouseScoreColor(score: number | null) {
  if (score === null) return "text-gray-400";
  if (score >= 90) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-error";
}

function hasLighthouseMetricNeedingAttention(
  scores: PageSpeedScores,
  audits: KeyLighthouseData["audits"],
) {
  const categoryNeedsAttention = Object.values(scores).some(
    (score) => score !== null && score < 50,
  );
  const labMetricNeedsAttention = Object.values(audits).some(
    (audit) =>
      audit?.score !== null && audit?.score !== undefined && audit.score < 50,
  );

  return categoryNeedsAttention || labMetricNeedsAttention;
}

function firstScreenshot<T extends { screenshotUrl: string | null }>(
  pages: T[],
) {
  return pages.find((page) => page.screenshotUrl)?.screenshotUrl ?? null;
}

function extractServiceFit(finalRecommendation: string | null | undefined) {
  if (!finalRecommendation) return null;
  return (
    serviceFitOptions.find((label) =>
      finalRecommendation.toLowerCase().includes(label.toLowerCase()),
    ) ?? null
  );
}

function buildOutreachAngle({
  serviceFit,
  finalRecommendation,
  topFindingTitle,
}: {
  serviceFit: string;
  finalRecommendation?: string | null;
  topFindingTitle?: string | null;
}) {
  if (finalRecommendation) return finalRecommendation;
  if (topFindingTitle) {
    return `Lead with "${topFindingTitle}" and frame GrailHiiv as practical ${serviceFit.toLowerCase()} help for the author's reader journey.`;
  }
  return "Use a low-pressure note focused on helping the author make the website clearer, more trustworthy, and easier for readers to use.";
}

function pageTypeLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTagClass(status: string) {
  if (status === "COMPLETE") return "border-0 bg-success-subtle text-success";
  if (status === "FAILED") return "border-0 bg-error-subtle text-error";
  if (status === "RUNNING") return "border-0 bg-primary-subtle text-primary";
  return "border-0 bg-gray-100 text-gray-600";
}

function severityTagClass(severity: string) {
  if (severity === "CRITICAL" || severity === "HIGH") {
    return "border-0 bg-error-subtle text-error";
  }
  if (severity === "MEDIUM") {
    return "border-0 bg-warning-subtle text-warning";
  }
  return "border-0 bg-gray-100 text-gray-600";
}

function severityRank(severity: string) {
  if (severity === "CRITICAL") return 0;
  if (severity === "HIGH") return 1;
  if (severity === "MEDIUM") return 2;
  return 3;
}

function httpStatusTagClass(status: number | null) {
  if (status !== null && status >= 200 && status < 400) {
    return "border-0 bg-success-subtle text-success";
  }
  if (status !== null && status >= 400) {
    return "border-0 bg-error-subtle text-error";
  }
  return "border-0 bg-gray-100 text-gray-600";
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <p className="mt-1.5 max-w-3xl text-sm font-normal leading-6 text-gray-500">
        {description}
      </p>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </div>
    </div>
  );
}

function LighthouseCategoryMetric({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const colorClass = lighthouseScoreColor(value);

  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <Progress
        className="!w-fit"
        variant="circle"
        percent={value ?? 0}
        width={76}
        strokeWidth={6}
        customColorClass={colorClass}
        customInfo={
          <span
            className={`text-base font-semibold tabular-nums ${colorClass}`}
          >
            {value ?? "N/A"}
          </span>
        }
      />
      <span className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
    </div>
  );
}

function LighthouseLabMetric({
  label,
  audit,
}: {
  label: string;
  audit: KeyLighthouseAudit | null;
}) {
  const colorClass = lighthouseScoreColor(audit?.score ?? null);
  const displayValue = audit?.displayValue?.trim() || "N/A";
  const isPassing =
    audit?.score !== null && audit?.score !== undefined && audit.score >= 90;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-200 py-4 dark:border-gray-700">
      <div className="flex min-w-0 items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
        {audit?.score === null || audit?.score === undefined ? (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600"
          />
        ) : isPassing ? (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-success"
          />
        ) : (
          <span
            aria-hidden="true"
            className={`w-2.5 shrink-0 text-center text-[11px] leading-none ${colorClass}`}
          >
            ▲
          </span>
        )}
        <span>{label}</span>
      </div>
      <div
        className={`shrink-0 text-xl font-medium tabular-nums ${colorClass}`}
      >
        {displayValue}
      </div>
    </div>
  );
}

function LighthouseDevicePanel({
  label,
  scores,
  audits,
}: {
  label: "Mobile" | "Desktop";
  scores: PageSpeedScores;
  audits: KeyLighthouseData["audits"];
}) {
  const needsAttention = hasLighthouseMetricNeedingAttention(scores, audits);
  const DeviceIcon =
    label === "Mobile" ? TbDeviceMobileFilled : TbDeviceDesktopFilled;

  return (
    <Card
      className={`flex h-full flex-col overflow-hidden ${
        needsAttention ? "border-error" : ""
      }`}
      bodyClass="flex flex-1 flex-col"
      header={{
        content: (
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                needsAttention
                  ? "bg-error-subtle text-error"
                  : "bg-primary-subtle text-primary"
              }`}
            >
              <DeviceIcon aria-hidden="true" className="text-xl" />
            </span>
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {label}
            </h4>
          </div>
        ),
      }}
      footer={
        needsAttention
          ? {
              bordered: false,
              className: "p-3",
              content: (
                <Alert type="danger" showIcon>
                  {label} performance needs attention. Visitors may experience
                  slow loading, especially while the main page content appears.
                </Alert>
              ),
            }
          : undefined
      }
    >
      <div>
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {label} scores
        </h4>
        <p className="mt-1 text-sm text-gray-500">
          Each category is scored from 0 to 100. Higher scores are better.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <LighthouseCategoryMetric
          label="Performance"
          value={scores.performance}
        />
        <LighthouseCategoryMetric
          label="Accessibility"
          value={scores.accessibility}
        />
        <LighthouseCategoryMetric
          label="Best Practices"
          value={scores.bestPractices}
        />
        <LighthouseCategoryMetric label="SEO" value={scores.seo} />
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Loading experience
        </h4>
        <p className="mt-1 text-sm text-gray-500">
          How quickly the homepage appears, responds, and remains visually
          stable during testing.
        </p>
        <div className="mt-4">
          <LighthouseLabMetric
            label="First Contentful Paint"
            audit={audits["first-contentful-paint"] ?? null}
          />
          <LighthouseLabMetric
            label="Largest Contentful Paint"
            audit={audits["largest-contentful-paint"] ?? null}
          />
          <LighthouseLabMetric
            label="Total Blocking Time"
            audit={audits["total-blocking-time"] ?? null}
          />
          <LighthouseLabMetric
            label="Cumulative Layout Shift"
            audit={audits["cumulative-layout-shift"] ?? null}
          />
          <LighthouseLabMetric
            label="Speed Index"
            audit={audits["speed-index"] ?? null}
          />
        </div>
      </div>
    </Card>
  );
}

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const legacyReport = await prisma.report.findUnique({
    where: { id },
    select: { domain: true },
  });

  if (legacyReport) {
    redirect(getAdminReportPath(legacyReport.domain));
  }

  const domain = normalizeReportDomain(id);

  if (!domain) notFound();

  const report = await prisma.report.findFirst({
    where: { domain },
    orderBy: { createdAt: "desc" },
    include: {
      lead: true,
      salesNote: true,
      scores: true,
      findings: { orderBy: [{ priority: "asc" }, { createdAt: "asc" }] },
      technicalAudit: true,
      pagesScanned: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!report) notFound();

  // This route stays protected because it exposes lead data and internal sales notes.
  const narrative =
    parseSerializedReportNarrative(report.summary)?.narrative ?? null;
  const serviceFit =
    report.salesNote?.serviceFit?.trim() ||
    extractServiceFit(narrative?.finalRecommendation) ||
    "Not sure";
  const findingsBySeverity = [...report.findings].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  );
  const topFinding = findingsBySeverity[0] ?? null;
  const outreachAngle = buildOutreachAngle({
    serviceFit,
    finalRecommendation: narrative?.finalRecommendation,
    topFindingTitle: topFinding?.title,
  });
  const savedOutreach = parseSerializedOutreachMessage(
    report.salesNote?.outreachMessage ?? null,
  );
  const screenshotUrl = firstScreenshot(report.pagesScanned);
  const scoresByCategory = new Map(
    report.scores.map((score) => [score.category, score]),
  );
  const mobileLighthouse = getLighthouseData(
    report.technicalAudit?.lighthouseJson,
    "mobile",
  );
  const desktopLighthouse = getLighthouseData(
    report.technicalAudit?.lighthouseJson,
    "desktop",
  );
  const mobileScores: PageSpeedScores = {
    performance: report.technicalAudit?.mobilePerformance ?? null,
    accessibility: report.technicalAudit?.mobileAccessibility ?? null,
    bestPractices: report.technicalAudit?.mobileBestPractices ?? null,
    seo: report.technicalAudit?.mobileSeo ?? null,
  };
  const desktopScores: PageSpeedScores = {
    performance: report.technicalAudit?.desktopPerformance ?? null,
    accessibility: report.technicalAudit?.desktopAccessibility ?? null,
    bestPractices: report.technicalAudit?.desktopBestPractices ?? null,
    seo: report.technicalAudit?.desktopSeo ?? null,
  };
  const mobileLighthouseScores = mobileLighthouse?.categories ?? mobileScores;
  const desktopLighthouseScores =
    desktopLighthouse?.categories ?? desktopScores;
  const mobileLighthouseAudits = mobileLighthouse?.audits ?? {};
  const desktopLighthouseAudits = desktopLighthouse?.audits ?? {};
  const overallPercent = report.overallScore ?? 0;
  const technicalMetricsUnavailable =
    !hasPageSpeedScore(mobileLighthouseScores) &&
    !hasPageSpeedScore(desktopLighthouseScores) &&
    [mobileLighthouseAudits, desktopLighthouseAudits].every((audits) =>
      [
        "first-contentful-paint",
        "largest-contentful-paint",
        "total-blocking-time",
        "cumulative-layout-shift",
        "speed-index",
      ].every((auditId) => !audits[auditId]?.displayValue),
    );

  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/reports" className="mt-1">
            <Button asElement="div" size="sm" icon={<TbArrowLeft />} />
          </Link>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {report.domain}
              </h2>
              <Tag className={statusTagClass(report.status)}>
                {reportStatusLabels[report.status]}
              </Tag>
            </div>
            <p className="max-w-2xl leading-6 text-gray-500">
              Review the website audit, view the author-facing report, and
              manage lead follow-up.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-12 xl:pl-0">
          <a href={report.normalizedUrl} target="_blank" rel="noreferrer">
            <Button asElement="div" icon={<TbExternalLink />}>
              Open website
            </Button>
          </a>
          <Link href={getReportPath(report.domain)}>
            <Button asElement="div" variant="solid" icon={<TbFileAnalytics />}>
              View author report
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card bodyClass="p-0 overflow-hidden">
          <div className="grid gap-6 p-6 sm:grid-cols-[148px_minmax(0,1fr)] sm:items-center lg:p-8">
            <Progress
              variant="circle"
              percent={overallPercent}
              width={148}
              strokeWidth={8}
              customInfo={
                <div className="text-center">
                  <div className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                    {formatScore(report.overallScore)}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Website score
                  </div>
                </div>
              }
            />
            <div className="min-w-0 flex-1">
              <div className="mb-5">
                <div className="mb-2 text-sm font-semibold text-primary">
                  Author Website Scorecard
                </div>
                <h3 className="break-words">{report.normalizedUrl}</h3>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <MetaItem
                  label="Report created"
                  value={formatDate(report.createdAt)}
                />
                <MetaItem label="Recommended service" value={serviceFit} />
                <MetaItem
                  label="Follow-up priority"
                  value={formatPriority(report.salesNote?.priority)}
                />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            {screenshotUrl ? (
              <Image
                src={screenshotUrl}
                alt={`Screenshot of ${report.domain}`}
                width={800}
                height={520}
                unoptimized
                className="h-auto w-full rounded-xl object-contain object-top"
              />
            ) : (
              <div className="flex min-h-48 h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-center text-gray-500 dark:border-gray-600">
                <TbPhoto className="mb-2 text-3xl" />
                <span className="text-sm">No screenshot captured</span>
              </div>
            )}
          </div>
        </Card>

        <Card
          header={{
            content: (
              <SectionTitle
                title="Lead & follow-up"
                description="Review lead details, qualify the opportunity, and prepare personalized outreach."
              />
            ),
          }}
        >
          <ReportAdminWorkspace
            reportId={report.id}
            lead={
              report.lead
                ? {
                    fullName: report.lead.fullName,
                    email: report.lead.email,
                    consent: report.lead.consent ? "Yes" : "No",
                    captured: formatDate(report.lead.createdAt),
                  }
                : null
            }
            leadStatus={report.salesNote?.leadStatus ?? SalesLeadStatus.NEW}
            leadStatusOptions={Object.values(SalesLeadStatus).map((status) => ({
              label: salesLeadStatusLabels[status],
              value: status,
            }))}
            serviceFit={serviceFit}
            serviceFitOptions={serviceFitOptions.map((option) => ({
              label: option,
              value: option,
            }))}
            priority={String(report.salesNote?.priority ?? 3)}
            priorityOptions={priorityOptions.map((option) => ({
              label: option.label,
              value: String(option.value),
            }))}
            manualNote={report.salesNote?.manualNote ?? ""}
            outreachAngle={outreachAngle}
            outreach={
              savedOutreach
                ? {
                    sourceLabel:
                      savedOutreach.source === "ai"
                        ? "AI draft"
                        : "Rule-based draft",
                    generatedAt: savedOutreach.generatedAt
                      ? formatDate(new Date(savedOutreach.generatedAt))
                      : "recently",
                    message: savedOutreach.message,
                  }
                : null
            }
          />
        </Card>
      </div>

      <div>
        <main className="min-w-0 flex-1 space-y-5 lg:space-y-6">
          <Card
            id="scores"
            header={{
              content: (
                <SectionTitle
                  title="Score breakdown"
                  description="See how the website performed across all eight author website categories."
                />
              ),
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {categoryOrder.map((category) => {
                const score = scoresByCategory.get(category);
                const percent = score
                  ? scorePercent(score.score, score.maxScore)
                  : 0;
                return (
                  <div
                    key={category}
                    className="rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-700"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {categoryLabels[category]}
                      </span>
                      <span className="shrink-0 font-bold tabular-nums">
                        {score ? `${score.score}/${score.maxScore}` : "N/A"}
                      </span>
                    </div>
                    <Progress percent={percent} showInfo={false} size="sm" />
                    {score?.summary ? (
                      <p className="mt-3 text-sm leading-6 text-gray-500">
                        {score.summary}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            id="findings"
            header={{
              content: (
                <SectionTitle
                  title="Improvements by severity"
                  description="Start with the most severe issues. Each finding includes a recommended fix and practical next steps."
                />
              ),
              extra: (
                <Tag className="border-0 bg-primary-subtle text-primary">
                  {findingsBySeverity.length} findings
                </Tag>
              ),
            }}
          >
            {findingsBySeverity.length ? (
              <Timeline>
                {findingsBySeverity.map((finding) => {
                  const actions = parsePracticalActions(
                    finding.practicalActions,
                  );
                  return (
                    <Timeline.Item
                      key={finding.id}
                      media={
                        <div
                          className={`flex h-9 min-w-20 items-center justify-center rounded-full px-3 text-xs font-bold uppercase tracking-wide ${severityTagClass(finding.severity)}`}
                        >
                          {findingSeverityLabels[finding.severity]}
                        </div>
                      }
                    >
                      <div className="pb-8 pl-3">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <h5 className="mr-auto text-base font-semibold">
                            {finding.title}
                          </h5>
                          <Tag className="border-0 bg-gray-100 text-gray-600">
                            {categoryLabels[finding.category]}
                          </Tag>
                        </div>
                        <p className="leading-7 text-gray-600 dark:text-gray-300">
                          {finding.finding}
                        </p>
                        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-700/40">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                            Recommended fix
                          </div>
                          <p className="text-sm leading-6 text-gray-700 dark:text-gray-200">
                            {finding.recommendation}
                          </p>
                          {actions.length ? (
                            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                              {actions.map((action) => (
                                <li key={action} className="flex gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            ) : (
              <p className="py-4 text-sm text-gray-500">
                No findings have been saved for this report yet.
              </p>
            )}
          </Card>

          <Card
            id="technical"
            header={{
              content: (
                <SectionTitle
                  title="Website performance"
                  description="Google Lighthouse scores and loading measurements for the homepage on mobile and desktop."
                />
              ),
            }}
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <LighthouseDevicePanel
                label="Mobile"
                scores={mobileLighthouseScores}
                audits={mobileLighthouseAudits}
              />
              <LighthouseDevicePanel
                label="Desktop"
                scores={desktopLighthouseScores}
                audits={desktopLighthouseAudits}
              />
            </div>
            {technicalMetricsUnavailable ? (
              <Alert className="mt-5 leading-6" type="info" showIcon>
                PageSpeed data could not be retrieved during this analysis. The
                report remains available with its deterministic website
                findings.
              </Alert>
            ) : null}
          </Card>

          <Card
            id="pages"
            bodyClass="p-0"
            header={{
              content: (
                <SectionTitle
                  title="Pages inspected"
                  description="Pages reviewed during the analysis, including response status and captured content signals."
                />
              ),
              extra: (
                <Tag className="border-0 bg-primary-subtle text-primary">
                  {report.pagesScanned.length} pages
                </Tag>
              ),
            }}
          >
            {report.pagesScanned.length ? (
              <div>
                <Table>
                  <Table.THead>
                    <Table.Tr>
                      <Table.Th className="py-4">Page URL</Table.Th>
                      <Table.Th className="py-4">Page type</Table.Th>
                      <Table.Th className="py-4">HTTP status</Table.Th>
                      <Table.Th className="py-4">Title and heading</Table.Th>
                      <Table.Th className="py-4">Content signals</Table.Th>
                    </Table.Tr>
                  </Table.THead>
                  <Table.TBody>
                    {report.pagesScanned.map((page) => (
                      <Table.Tr key={page.id}>
                        <Table.Td className="min-w-60 py-5">
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all font-semibold text-primary hover:underline"
                          >
                            {page.url}
                          </a>
                        </Table.Td>
                        <Table.Td className="py-5">
                          {pageTypeLabel(page.pageType)}
                        </Table.Td>
                        <Table.Td className="py-5">
                          <Tag className={httpStatusTagClass(page.statusCode)}>
                            {page.statusCode ?? "N/A"}
                          </Tag>
                        </Table.Td>
                        <Table.Td className="min-w-64 py-5">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {page.title ?? "No title saved"}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            H1: {page.h1 ?? "Not found"}
                          </div>
                        </Table.Td>
                        <Table.Td className="whitespace-nowrap py-5 text-sm text-gray-500">
                          {page.wordCount ?? 0} words &middot;{" "}
                          {countJsonArray(page.linksJson)} links
                          <br />
                          {countJsonArray(page.imagesJson)} images &middot;{" "}
                          {countJsonArray(page.formsJson)} forms
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.TBody>
                </Table>
                <div className="border-t border-gray-200 px-6 py-4 text-sm text-gray-500 dark:border-gray-700">
                  Showing all pages captured in this scan
                </div>
              </div>
            ) : (
              <p className="p-6 text-sm text-gray-500">
                No pages have been scanned for this report yet.
              </p>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
