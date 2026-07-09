import Link from "next/link";
import { ClipboardListIcon, SearchIcon } from "lucide-react";

import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFiltersCard } from "@/components/admin/admin-filters";
import { GridSection } from "@/components/layout/grid-section";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  type AdminSearchParams,
  buildReportWhere,
  parseAdminFilters,
} from "@/lib/admin/filters";
import { adminReportTableColumns } from "@/lib/admin/table-config";
import {
  formatAuthorType,
  formatDate,
  formatScore,
  formatWebsiteGoal,
  reportStatusLabels,
  statusBadgeVariant,
} from "@/lib/admin/display";
import { prisma } from "@/lib/db/prisma";

// SECURITY: Keep this route inside the protected admin group because it exposes report data.
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const filters = parseAdminFilters(await searchParams);
  const reports = await prisma.report.findMany({
    where: buildReportWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <GridSection>
      <div className="px-0 py-8 sm:px-4 lg:px-6">
        <PageHeader
          eyebrow="Admin"
          title="Reports"
          description="Review author website reports, scores, and current scan status."
        />

        <div className="flex flex-col gap-6">
          <AdminFiltersCard filters={filters} resetHref="/admin/reports" />

          <AdminDataTable
            columns={adminReportTableColumns.map((label) => ({ label }))}
            rowCount={reports.length}
            eyebrow={`Latest ${reports.length} of 100`}
            title="Report queue"
            description="Newest scans, deterministic score totals, and drilldowns for each author website."
            actions={
              <Link
                href="/analyze"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <SearchIcon data-icon="inline-start" />
                New scan
              </Link>
            }
            emptyState={
              <AdminEmptyState
                icon={ClipboardListIcon}
                title="No reports match these filters"
                description="Clear the filters or submit an author website so the analyzer can create a new scorecard."
                action={
                  <Link
                    href="/analyze"
                    className={buttonVariants({ variant: "default", size: "sm" })}
                  >
                    Start a scan
                  </Link>
                }
              />
            }
          >
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="max-w-[320px] whitespace-normal">
                  <div className="flex flex-col gap-1">
                    <span className="break-words font-medium">
                      {report.domain}
                    </span>
                    <span className="break-all text-xs text-muted-foreground">
                      {report.normalizedUrl}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatAuthorType(report.authorType)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatWebsiteGoal(report.websiteGoal)}
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
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href={`/admin/reports/${report.id}`}
                  >
                    View report
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </AdminDataTable>
        </div>
      </div>
    </GridSection>
  );
}
