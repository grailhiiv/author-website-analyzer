import Link from "next/link";
import {
  ArrowRightIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  MailIcon,
  StarIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import {
  AdminPanel,
  AdminPanelContent,
  AdminPanelHeader,
} from "@/components/admin/admin-panel";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { GridSection } from "@/components/layout/grid-section";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ReportStatus } from "@/generated/prisma/client";
import {
  formatDate,
  formatScore,
  reportStatusLabels,
  statusBadgeVariant,
} from "@/lib/admin/display";
import { prisma } from "@/lib/db/prisma";

// SECURITY: Keep this route inside the protected admin group because it exposes report and lead data.
export default async function AdminPage() {
  const [
    totalReports,
    completedReports,
    failedReports,
    leadsCaptured,
    scoreAggregate,
    recentReports,
    recentLeads,
  ] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: ReportStatus.COMPLETE } }),
    prisma.report.count({ where: { status: ReportStatus.FAILED } }),
    prisma.lead.count(),
    prisma.report.aggregate({
      where: { overallScore: { not: null } },
      _avg: { overallScore: true },
    }),
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.lead.findMany({
      include: { report: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const averageScore = scoreAggregate._avg.overallScore;

  return (
    <GridSection>
      <div className="px-0 py-8 sm:px-4 lg:px-6">
        <PageHeader
          eyebrow="Admin"
          title="Dashboard"
          description="Internal tools for reviewing submitted reports and author leads."
          actions={<Badge variant="outline">Protected admin view</Badge>}
        />

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <AdminStatCard
              title="Total reports"
              value={totalReports}
              description="All submitted author website reports."
              icon={<ClipboardListIcon data-icon="inline-start" />}
            />
            <AdminStatCard
              title="Completed reports"
              value={completedReports}
              description="Reports with a completed scorecard."
              icon={<ClipboardCheckIcon data-icon="inline-start" />}
            />
            <AdminStatCard
              title="Failed reports"
              value={failedReports}
              description="Reports that could not be analyzed."
              icon={<TriangleAlertIcon data-icon="inline-start" />}
            />
            <AdminStatCard
              title="Leads captured"
              value={leadsCaptured}
              description="Authors who shared contact details."
              icon={<MailIcon data-icon="inline-start" />}
            />
            <AdminStatCard
              title="Average score"
              value={averageScore === null ? "Not scored" : Math.round(averageScore)}
              description="Average across scored reports."
              icon={<StarIcon data-icon="inline-start" />}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AdminDataTable
              columns={[
                { label: "Website" },
                { label: "Status" },
                { label: "Score" },
                { label: "Created" },
                { label: "" },
              ]}
              rowCount={recentReports.length}
              title="Recent reports"
              description="The latest submitted scorecards and scan statuses."
              minWidth="min-w-[720px]"
              actions={
                <Link
                  href="/admin/reports"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  All reports
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              }
              emptyState={
                <AdminEmptyState
                  icon={ClipboardListIcon}
                  title="No reports yet"
                  description="Submitted author websites will appear here as soon as the first analysis starts."
                />
              }
            >
              {recentReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="max-w-[260px] whitespace-normal">
                    <div className="flex flex-col gap-1">
                      <span className="break-words font-medium">
                        {report.domain}
                      </span>
                      <span className="break-all text-xs text-muted-foreground">
                        {report.normalizedUrl}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(report.status)}>
                      {reportStatusLabels[report.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {formatScore(report.overallScore)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(report.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/reports/${report.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </AdminDataTable>

            <AdminDataTable
              columns={[
                { label: "Author" },
                { label: "Email" },
                { label: "Website" },
                { label: "Captured" },
                { label: "" },
              ]}
              rowCount={recentLeads.length}
              title="Recent leads"
              description="New author contacts from report unlocks and submissions."
              minWidth="min-w-[760px]"
              actions={
                <Link
                  href="/admin/leads"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  All leads
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              }
              emptyState={
                <AdminEmptyState
                  icon={MailIcon}
                  title="No leads yet"
                  description="Lead records will appear here when an author shares their email with a report request."
                />
              }
            >
              {recentLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    {lead.name || "Not provided"}
                  </TableCell>
                  <TableCell className="max-w-[220px] whitespace-normal">
                    <a
                      href={`mailto:${lead.email}`}
                      className="break-all text-primary underline-offset-4 hover:underline"
                    >
                      {lead.email}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[220px] break-all whitespace-normal text-muted-foreground">
                    {lead.websiteUrl}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/reports/${lead.report.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Report
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </AdminDataTable>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminPanel>
              <AdminPanelHeader
                eyebrow="Operations"
                title="Reports"
                description="Review submitted author website scorecards and scan status."
              />
              <AdminPanelContent className="flex items-center justify-between gap-4 pt-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Newest scans, statuses, deterministic scores, and report drilldowns.
                </p>
                <Link
                  href="/admin/reports"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  View reports
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </AdminPanelContent>
            </AdminPanel>
            <AdminPanel>
              <AdminPanelHeader
                eyebrow="Pipeline"
                title="Leads"
                description="Track author contacts captured from report requests."
              />
              <AdminPanelContent className="flex items-center justify-between gap-4 pt-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Contact details, author goals, linked reports, and follow-up context.
                </p>
                <Link
                  href="/admin/leads"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  View leads
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </AdminPanelContent>
            </AdminPanel>
          </div>
        </div>
      </div>
    </GridSection>
  );
}
