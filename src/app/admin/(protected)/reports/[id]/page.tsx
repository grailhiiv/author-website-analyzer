import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  ImageIcon,
  SaveIcon,
  WandSparklesIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GridSection } from "@/components/layout/grid-section";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
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
  severityBadgeVariant,
  statusBadgeVariant,
} from "@/lib/admin/display";
import { prisma } from "@/lib/db/prisma";

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
              <Link
                href="/admin/reports"
                className={buttonVariants({ variant: "outline" })}
              >
                <ArrowLeftIcon />
                Reports
              </Link>
              <Link
                href={`/report/${report.id}`}
                className={buttonVariants({ variant: "secondary" })}
              >
                Public report
                <ExternalLinkIcon />
              </Link>
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
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Website URL
                  </p>
                  <Link
                    href={report.normalizedUrl}
                    className="mt-1 inline-flex items-center gap-1 break-all text-sm font-medium text-primary hover:underline"
                    target="_blank"
                  >
                    {report.normalizedUrl}
                    <ExternalLinkIcon className="size-3.5" />
                  </Link>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </p>
                  <Badge
                    className="mt-1"
                    variant={statusBadgeVariant(report.status)}
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
                    <div key={category} className="rounded-lg border border-dashed bg-muted/20 p-4">
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
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
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
                            <Badge
                              variant={severityBadgeVariant(finding.severity)}
                            >
                              {findingSeverityLabels[finding.severity]}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            {categoryLabels[finding.category]}
                          </TableCell>
                          <TableCell className="max-w-xs whitespace-normal">
                            <p className="font-medium">{finding.title}</p>
                            <p className="mt-1 text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">
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
                <div className="rounded-lg border border-dashed bg-muted/20 p-4 sm:col-span-2 lg:col-span-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                            <Link
                              href={page.url}
                              className="break-all text-primary hover:underline"
                              target="_blank"
                            >
                              {page.url}
                            </Link>
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
                            <div className="space-y-1 text-xs text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">
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
                      name="leadStatus"
                      defaultValue={
                        report.salesNote?.leadStatus ?? SalesLeadStatus.NEW
                      }
                    >
                      <SelectTrigger id="leadStatus" className="w-full">
                        <SelectValue placeholder="Choose status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.values(SalesLeadStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {salesLeadStatusLabels[status]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="serviceFit">
                      Service fit
                    </label>
                    <Select name="serviceFit" defaultValue={serviceFit}>
                      <SelectTrigger id="serviceFit" className="w-full">
                        <SelectValue placeholder="Choose service fit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {serviceFitOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="priority">
                      Priority
                    </label>
                    <Select
                      name="priority"
                      defaultValue={String(report.salesNote?.priority ?? 3)}
                    >
                      <SelectTrigger id="priority" className="w-full">
                        <SelectValue placeholder="Choose priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {priorityOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={String(option.value)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
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
                    <SaveIcon />
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
                <p className="text-sm leading-6 text-muted-foreground">
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
                    <WandSparklesIcon />
                    Generate Outreach Message
                  </Button>
                </form>

                {savedOutreach ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {savedOutreach.source === "ai"
                          ? "AI draft"
                          : "Fallback template"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
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
                  <p className="text-sm leading-6 text-muted-foreground">
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
                    className="aspect-video w-full rounded-lg border border-dashed object-cover"
                  />
                ) : (
                  <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
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
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function OutreachDraft({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="whitespace-pre-wrap rounded-lg border border-dashed bg-muted/30 p-3 text-sm leading-6">
        {value}
      </div>
    </div>
  );
}
