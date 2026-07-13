import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  TbArrowLeft,
  TbExternalLink,
  TbFileAnalytics,
  TbPhoto,
} from "react-icons/tb";

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

function getLighthouseSource(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = (value as { source?: unknown }).source;
  return typeof source === "string" ? source : null;
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

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h4>{title}</h4>
      <p className="mt-1 text-sm font-normal text-gray-500">{description}</p>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </div>
    </div>
  );
}

function AuditMetric({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-700/40">
      <div className="mb-3 flex items-end justify-between gap-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {label}
        </span>
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {value === null ? "N/A" : value}
        </span>
      </div>
      <Progress percent={value ?? 0} showInfo={false} size="sm" />
    </div>
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
  const topFinding = report.findings[0] ?? null;
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
  const lighthouseSource = getLighthouseSource(
    report.technicalAudit?.lighthouseJson,
  );
  const overallPercent = report.overallScore ?? 0;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/reports" className="mt-1">
            <Button asElement="div" size="sm" icon={<TbArrowLeft />} />
          </Link>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2>{report.domain}</h2>
              <Tag className={statusTagClass(report.status)}>
                {reportStatusLabels[report.status]}
              </Tag>
            </div>
            <p className="text-gray-500">
              Full author website audit and internal follow-up workspace.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-12 xl:pl-0">
          <a href={report.normalizedUrl} target="_blank" rel="noreferrer">
            <Button asElement="div" icon={<TbExternalLink />}>
              Visit website
            </Button>
          </a>
          <Link href={getReportPath(report.domain)}>
            <Button asElement="div" variant="solid" icon={<TbFileAnalytics />}>
              Public report
            </Button>
          </Link>
        </div>
      </div>

      <Card bodyClass="p-0 overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-6 p-6 lg:grid-cols-[148px_minmax(0,1fr)] lg:items-center lg:p-8">
            <Progress
              variant="circle"
              percent={overallPercent}
              width={148}
              strokeWidth={8}
              customInfo={
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatScore(report.overallScore)}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Overall
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
                  label="Created"
                  value={formatDate(report.createdAt)}
                />
                <MetaItem label="Service fit" value={serviceFit} />
                <MetaItem
                  label="Sales priority"
                  value={formatPriority(report.salesNote?.priority)}
                />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 lg:border-l lg:border-t-0">
            {screenshotUrl ? (
              <Image
                src={screenshotUrl}
                alt={`Screenshot of ${report.domain}`}
                width={800}
                height={520}
                unoptimized
                className="h-full max-h-56 min-h-48 w-full rounded-xl object-cover object-top"
              />
            ) : (
              <div className="flex min-h-48 h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-center text-gray-500 dark:border-gray-600">
                <TbPhoto className="mb-2 text-3xl" />
                <span className="text-sm">No screenshot captured</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row">
        <main className="min-w-0 flex-1 space-y-4">
          <Card
            id="scores"
            header={{
              content: (
                <SectionTitle
                  title="Category scores"
                  description="Deterministic score breakdown across the eight author website categories."
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
                    className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {categoryLabels[category]}
                      </span>
                      <span className="shrink-0 font-bold">
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
                  title="Prioritized findings"
                  description="Issues are ordered by action priority, with recommendations and practical next steps together."
                />
              ),
              extra: (
                <Tag className="border-0 bg-primary-subtle text-primary">
                  {report.findings.length} findings
                </Tag>
              ),
            }}
          >
            {report.findings.length ? (
              <Timeline>
                {report.findings.map((finding) => {
                  const actions = parsePracticalActions(
                    finding.practicalActions,
                  );
                  return (
                    <Timeline.Item
                      key={finding.id}
                      media={
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                          {finding.priority}
                        </div>
                      }
                    >
                      <div className="pb-7 pl-2">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <h5 className="mr-auto">{finding.title}</h5>
                          <Tag className="border-0 bg-gray-100 text-gray-600">
                            {categoryLabels[finding.category]}
                          </Tag>
                          <Tag className={severityTagClass(finding.severity)}>
                            {findingSeverityLabels[finding.severity]}
                          </Tag>
                        </div>
                        <p className="leading-7 text-gray-600 dark:text-gray-300">
                          {finding.finding}
                        </p>
                        <div className="mt-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-700/40">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Recommendation
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
                  title="Technical audit"
                  description="Saved PageSpeed and Lighthouse homepage measurements."
                />
              ),
              extra: lighthouseSource ? (
                <Tag className="border-0 bg-gray-100 text-gray-600">
                  {lighthouseSource}
                </Tag>
              ) : null,
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AuditMetric
                label="Mobile performance"
                value={report.technicalAudit?.mobilePerformance ?? null}
              />
              <AuditMetric
                label="Desktop performance"
                value={report.technicalAudit?.desktopPerformance ?? null}
              />
              <AuditMetric
                label="Mobile accessibility"
                value={report.technicalAudit?.mobileAccessibility ?? null}
              />
              <AuditMetric
                label="Desktop accessibility"
                value={report.technicalAudit?.desktopAccessibility ?? null}
              />
            </div>
          </Card>

          <Card
            id="pages"
            bodyClass="p-0"
            header={{
              content: (
                <SectionTitle
                  title="Pages scanned"
                  description="Crawl records captured during the website analysis."
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
              <div className="overflow-x-auto">
                <Table>
                  <Table.THead>
                    <Table.Tr>
                      <Table.Th>Page</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Page details</Table.Th>
                      <Table.Th>Content</Table.Th>
                    </Table.Tr>
                  </Table.THead>
                  <Table.TBody>
                    {report.pagesScanned.map((page) => (
                      <Table.Tr key={page.id}>
                        <Table.Td className="min-w-60">
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all font-semibold text-primary hover:underline"
                          >
                            {page.url}
                          </a>
                        </Table.Td>
                        <Table.Td>{pageTypeLabel(page.pageType)}</Table.Td>
                        <Table.Td>{page.statusCode ?? "N/A"}</Table.Td>
                        <Table.Td className="min-w-64">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {page.title ?? "No title saved"}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            H1: {page.h1 ?? "Not found"}
                          </div>
                        </Table.Td>
                        <Table.Td className="whitespace-nowrap text-sm text-gray-500">
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
              </div>
            ) : (
              <p className="p-6 text-sm text-gray-500">
                No pages have been scanned for this report yet.
              </p>
            )}
          </Card>
        </main>

        <aside className="w-full shrink-0 lg:w-[340px] xl:w-[400px]">
          <Card
            header={{
              content: (
                <SectionTitle
                  title="Admin workspace"
                  description="Lead context, internal notes, and outreach tools."
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
              leadStatusOptions={Object.values(SalesLeadStatus).map(
                (status) => ({
                  label: salesLeadStatusLabels[status],
                  value: status,
                }),
              )}
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
        </aside>
      </div>
    </div>
  );
}
