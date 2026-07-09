import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  ImageIcon,
  SaveIcon,
  WandSparklesIcon,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Select } from "@/components/catalyst/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead as TableHeader,
  TableHeader as TableHead,
  TableRow,
} from "@/components/catalyst/table";
import { GridSection } from "@/components/layout/grid-section";
import { PageHeader } from "@/components/layout/page-header";
import {
  ReportCategory,
  SalesLeadStatus,
} from "@/generated/prisma/client";
import { parseSerializedOutreachMessage } from "@/lib/ai/outreach-message.core";
import { parseSerializedReportNarrative } from "@/lib/ai/report-narrative.core";
import {
  categoryLabels,
  findingSeverityLabels,
  formatAuthorType,
  formatDate,
  formatPriority,
  formatScore,
  formatWebsiteGoal,
  priorityOptions,
  reportStatusLabels,
  salesLeadStatusLabels,
  severityBadgeColor,
  statusBadgeColor,
} from "@/lib/admin/display";
import { prisma } from "@/lib/db/prisma";
import { cn } from "@/lib/utils";

import {
  generateOutreachMessageAction,
  updateSalesNotesAction,
} from "./actions";

const categoryOrder = [
  ReportCategory.BRAND_CLARITY,
  ReportCategory.BOOK_PROMOTION,
  ReportCategory.READER_CONVERSION,
  ReportCategory.SEO_DISCOVERABILITY,
  ReportCategory.MOBILE_ACCESSIBILITY,
  ReportCategory.PERFORMANCE_HEALTH,
  ReportCategory.TRUST_CREDIBILITY,
  ReportCategory.MAINTENANCE_RISK,
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

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-zinc-950/10 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </section>
  );
}

function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-zinc-950/10 p-5", className)}>
      {children}
    </div>
  );
}

function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base/7 font-semibold text-zinc-950">{children}</h2>;
}

function CardDescription({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm/6 text-zinc-500">{children}</p>;
}

function Progress({
  className,
  value = 0,
}: {
  className?: string;
  value?: number;
}) {
  const width = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-zinc-950/10", className)}>
      <div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
    </div>
  );
}

function Textarea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        "block w-full rounded-lg border border-zinc-950/10 bg-white px-3 py-2 text-sm/6 text-zinc-950 shadow-sm outline-hidden placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        className
      )}
    />
  );
}

function scorePercent(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return 0;
  }

  return Math.round((score / maxScore) * 100);
}

function countJsonArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function getLighthouseSource(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = (value as { source?: unknown }).source;

  return typeof source === "string" ? source : null;
}

function firstScreenshot<T extends { screenshotUrl: string | null }>(
  pages: T[]
) {
  return pages.find((page) => page.screenshotUrl)?.screenshotUrl ?? null;
}

function extractServiceFit(finalRecommendation: string | null | undefined) {
  if (!finalRecommendation) {
    return null;
  }

  return (
    serviceFitOptions.find((label) =>
      finalRecommendation.toLowerCase().includes(label.toLowerCase())
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
  if (finalRecommendation) {
    return finalRecommendation;
  }

  if (topFindingTitle) {
    return `Lead with "${topFindingTitle}" and frame GrailHiiv as practical ${serviceFit.toLowerCase()} help for the author's reader journey.`;
  }

  return "Use a low-pressure note focused on helping the author make the website clearer, more trustworthy, and easier for readers to use.";
}

function metricLabel(value: number | null) {
  return value === null ? "Not available" : `${value}/100`;
}

function pageTypeLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      lead: true,
      salesNote: true,
      scores: true,
      findings: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
      technicalAudit: true,
      pagesScanned: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!report) {
    notFound();
  }

  // SECURITY: This page must stay inside the protected admin route group because it exposes lead details and internal sales notes.
  const serializedNarrative = parseSerializedReportNarrative(report.summary);
  const narrative = serializedNarrative?.narrative ?? null;
  const narrativeServiceFit = extractServiceFit(narrative?.finalRecommendation);
  const serviceFit =
    report.salesNote?.serviceFit?.trim() || narrativeServiceFit || "Not sure";
  const topFinding = report.findings[0] ?? null;
  const outreachAngle = buildOutreachAngle({
    serviceFit,
    finalRecommendation: narrative?.finalRecommendation,
    topFindingTitle: topFinding?.title,
  });
  const savedOutreach = parseSerializedOutreachMessage(
    report.salesNote?.outreachMessage ?? null
  );
  const screenshotUrl = firstScreenshot(report.pagesScanned);
  const scoresByCategory = new Map(
    report.scores.map((score) => [score.category, score])
  );
  const lighthouseSource = getLighthouseSource(
    report.technicalAudit?.lighthouseJson
  );

  return (
    <GridSection>
      <div className="py-10 sm:px-4 lg:px-6">
        <PageHeader
          eyebrow="Admin report detail"
          title={report.domain}
          description="Review the full author website audit, lead details, internal sales notes, and suggested outreach angle."
          actions={
            <>
              <Button outline href="/admin/reports">
                <ArrowLeftIcon data-slot="icon" />
                Reports
              </Button>
              <Button color="light" href={`/report/${report.id}`}>
                Public report
                <ExternalLinkIcon data-slot="icon" />
              </Button>
            </>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Overview</CardTitle>
                <CardDescription>
                  Core submission and score details for this author website.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Website URL
                  </p>
                  <a
                    href={report.normalizedUrl}
                    className="mt-1 inline-flex items-center gap-1 break-all text-sm font-medium text-blue-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {report.normalizedUrl}
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Status
                  </p>
                  <Badge
                    className="mt-1"
                    color={statusBadgeColor(report.status)}
                  >
                    {reportStatusLabels[report.status]}
                  </Badge>
                </div>
                <DetailItem
                  label="Author type"
                  value={formatAuthorType(report.authorType)}
                />
                <DetailItem
                  label="Website goal"
                  value={formatWebsiteGoal(report.websiteGoal)}
                />
                <DetailItem
                  label="Overall score"
                  value={formatScore(report.overallScore)}
                />
                <DetailItem
                  label="Created"
                  value={formatDate(report.createdAt)}
                />
                <DetailItem label="Service fit label" value={serviceFit} />
                <DetailItem label="Sales priority" value={formatPriority(report.salesNote?.priority)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Scores</CardTitle>
                <CardDescription>
                  Deterministic score breakdown saved with the report.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {categoryOrder.map((category) => {
                  const score = scoresByCategory.get(category);

                  return (
                    <div key={category} className="rounded-lg border border-zinc-950/10 bg-zinc-50 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">
                          {categoryLabels[category]}
                        </p>
                        <span className="text-sm font-semibold">
                          {score ? `${score.score}/${score.maxScore}` : "N/A"}
                        </span>
                      </div>
                      <Progress
                        value={score ? scorePercent(score.score, score.maxScore) : 0}
                      />
                      {score?.summary ? (
                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                          {score.summary}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Full Findings</CardTitle>
                <CardDescription>
                  Every saved issue and recommendation from the deterministic
                  scoring engine.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.findings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Priority</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Finding</TableHead>
                        <TableHead>Recommendation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.findings.map((finding) => (
                        <TableRow key={finding.id}>
                          <TableCell>{finding.priority}</TableCell>
                          <TableCell>
                            <Badge color={severityBadgeColor(finding.severity)}>
                              {findingSeverityLabels[finding.severity]}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            {categoryLabels[finding.category]}
                          </TableCell>
                          <TableCell className="max-w-xs whitespace-normal">
                            <p className="font-medium">{finding.title}</p>
                            <p className="mt-1 text-zinc-500">
                              {finding.finding}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-xs whitespace-normal">
                            {finding.recommendation}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-zinc-500">
                    No findings have been saved for this report yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Audit</CardTitle>
                <CardDescription>
                  PageSpeed and Lighthouse values saved for the homepage.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Mobile performance" value={metricLabel(report.technicalAudit?.mobilePerformance ?? null)} />
                <Metric label="Desktop performance" value={metricLabel(report.technicalAudit?.desktopPerformance ?? null)} />
                <Metric label="Mobile accessibility" value={metricLabel(report.technicalAudit?.mobileAccessibility ?? null)} />
                <Metric label="Desktop accessibility" value={metricLabel(report.technicalAudit?.desktopAccessibility ?? null)} />
                <Metric label="Mobile SEO" value={metricLabel(report.technicalAudit?.mobileSeo ?? null)} />
                <Metric label="Desktop SEO" value={metricLabel(report.technicalAudit?.desktopSeo ?? null)} />
                <Metric label="Mobile best practices" value={metricLabel(report.technicalAudit?.mobileBestPractices ?? null)} />
                <Metric label="Desktop best practices" value={metricLabel(report.technicalAudit?.desktopBestPractices ?? null)} />
                <div className="rounded-lg border border-zinc-950/10 bg-zinc-50 p-4 sm:col-span-2 lg:col-span-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Lighthouse source
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {lighthouseSource ?? "Not available"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pages Scanned</CardTitle>
                <CardDescription>
                  Crawl records saved during analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.pagesScanned.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>H1</TableHead>
                        <TableHead>Content</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.pagesScanned.map((page) => (
                        <TableRow key={page.id}>
                          <TableCell className="max-w-xs whitespace-normal">
                            <a
                              href={page.url}
                              className="break-all text-blue-600 hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {page.url}
                            </a>
                          </TableCell>
                          <TableCell>{pageTypeLabel(page.pageType)}</TableCell>
                          <TableCell>{page.statusCode ?? "N/A"}</TableCell>
                          <TableCell className="max-w-xs whitespace-normal">
                            {page.title ?? "No title saved"}
                          </TableCell>
                          <TableCell className="max-w-xs whitespace-normal">
                            {page.h1 ?? "No H1 saved"}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs text-zinc-500">
                              <p>{page.wordCount ?? 0} words</p>
                              <p>{countJsonArray(page.linksJson)} links</p>
                              <p>{countJsonArray(page.imagesJson)} images</p>
                              <p>{countJsonArray(page.formsJson)} forms</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-zinc-500">
                    No pages have been scanned for this report yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Information</CardTitle>
                <CardDescription>
                  Contact details attached to this report.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.lead ? (
                  <>
                    <DetailItem label="Name" value={report.lead.name || "Not provided"} />
                    <DetailItem label="Email" value={report.lead.email} />
                    <DetailItem
                      label="Consent"
                      value={report.lead.consent ? "Yes" : "No"}
                    />
                    <DetailItem
                      label="Captured"
                      value={formatDate(report.lead.createdAt)}
                    />
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">
                    No lead email has been captured for this report.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Notes</CardTitle>
                <CardDescription>
                  Internal-only status, fit, priority, and follow-up notes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateSalesNotesAction} className="space-y-4">
                  <input type="hidden" name="reportId" value={report.id} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="leadStatus">
                      Lead status
                    </label>
                    <Select
                      id="leadStatus"
                      name="leadStatus"
                      defaultValue={
                        report.salesNote?.leadStatus ?? SalesLeadStatus.NEW
                      }
                    >
                      {Object.values(SalesLeadStatus).map((status) => (
                        <option key={status} value={status}>
                          {salesLeadStatusLabels[status]}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="serviceFit">
                      Service fit
                    </label>
                    <Select id="serviceFit" name="serviceFit" defaultValue={serviceFit}>
                      {serviceFitOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="priority">
                      Priority
                    </label>
                    <Select
                      id="priority"
                      name="priority"
                      defaultValue={String(report.salesNote?.priority ?? 3)}
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="manualNote">
                      Manual note
                    </label>
                    <Textarea
                      id="manualNote"
                      name="manualNote"
                      defaultValue={report.salesNote?.manualNote ?? ""}
                      placeholder="Add internal context, follow-up notes, or outreach details."
                      rows={6}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <SaveIcon data-slot="icon" />
                    Save sales notes
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suggested Outreach Angle</CardTitle>
                <CardDescription>
                  A practical starting point for the sales conversation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-zinc-500">
                  {outreachAngle}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outreach Message</CardTitle>
                <CardDescription>
                  Admin-only email, DM, and follow-up draft based on saved
                  report findings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={generateOutreachMessageAction}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <Button type="submit" className="w-full">
                    <WandSparklesIcon data-slot="icon" />
                    Generate Outreach Message
                  </Button>
                </form>

                {savedOutreach ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color="blue">
                        {savedOutreach.source === "ai"
                          ? "AI draft"
                          : "Rule-based draft"}
                      </Badge>
                      <span className="text-xs text-zinc-500">
                        Generated{" "}
                        {savedOutreach.generatedAt
                          ? formatDate(new Date(savedOutreach.generatedAt))
                          : "recently"}
                      </span>
                    </div>
                    <OutreachDraft
                      label="Email version"
                      value={savedOutreach.message.emailVersion}
                    />
                    <OutreachDraft
                      label="Short DM version"
                      value={savedOutreach.message.shortDmVersion}
                    />
                    <OutreachDraft
                      label="Follow-up version"
                      value={savedOutreach.message.followUpVersion}
                    />
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-zinc-500">
                    Generate a low-pressure outreach draft that mentions only
                    one or two of the strongest report findings.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Screenshot Preview</CardTitle>
                <CardDescription>
                  First captured website screenshot, when available.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {screenshotUrl ? (
                  <Image
                    src={screenshotUrl}
                    alt={`Screenshot preview for ${report.domain}`}
                    width={800}
                    height={600}
                    unoptimized
                    className="aspect-video w-full rounded-lg border border-zinc-950/10 object-cover"
                  />
                ) : (
                  <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-zinc-950/10 text-center text-sm text-zinc-500">
                    <ImageIcon className="mb-2 size-6" />
                    No screenshot captured yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </GridSection>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-950/10 bg-zinc-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function OutreachDraft({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <div className="whitespace-pre-wrap rounded-lg border border-zinc-950/10 bg-zinc-50 p-3 text-sm leading-6">
        {value}
      </div>
    </div>
  );
}
