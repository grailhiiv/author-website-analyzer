import { MailIcon } from "lucide-react";

import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFiltersCard } from "@/components/admin/admin-filters";
import { Button, TableCell, TableRow } from "@/components/admin/admin-ui";
import { GridSection } from "@/components/layout/grid-section";
import { PageHeader } from "@/components/layout/page-header";
import {
  type AdminSearchParams,
  buildLeadWhere,
  parseAdminFilters,
} from "@/lib/admin/filters";
import { adminLeadTableColumns } from "@/lib/admin/table-config";
import {
  formatAuthorType,
  formatDate,
  formatWebsiteGoal,
} from "@/lib/admin/display";
import { prisma } from "@/lib/db/prisma";

// SECURITY: Keep this route inside the protected admin group because it exposes lead data.
export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const filters = parseAdminFilters(await searchParams);
  const leads = await prisma.lead.findMany({
    where: buildLeadWhere(filters),
    include: { report: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <GridSection>
      <div className="px-0 py-8 sm:px-4 lg:px-6">
        <PageHeader
          eyebrow="Admin"
          title="Leads"
          description="Review author contact submissions connected to report requests."
        />

        <div className="flex flex-col gap-6">
          <AdminFiltersCard filters={filters} resetHref="/leads" />

          <AdminDataTable
            columns={adminLeadTableColumns.map((label) => ({ label }))}
            rowCount={leads.length}
            eyebrow={`Latest ${leads.length} of 100`}
            title="Lead pipeline"
            description="Author contacts captured during report unlock and follow-up workflows."
            emptyState={
              <AdminEmptyState
                icon={MailIcon}
                title="No leads match these filters"
                description="Clear the filters or submit an author website with an email address to populate the pipeline."
              />
            }
          >
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">
                  {lead.name || "Not provided"}
                </TableCell>
                <TableCell className="max-w-[260px] whitespace-normal">
                  <a
                    className="break-all text-blue-600 underline-offset-4 hover:underline"
                    href={`mailto:${lead.email}`}
                  >
                    {lead.email}
                  </a>
                </TableCell>
                <TableCell className="max-w-[320px] break-all whitespace-normal text-zinc-500">
                  {lead.websiteUrl}
                </TableCell>
                <TableCell className="text-zinc-500">
                  {formatAuthorType(lead.authorType)}
                </TableCell>
                <TableCell className="text-zinc-500">
                  {formatWebsiteGoal(lead.websiteGoal)}
                </TableCell>
                <TableCell className="text-zinc-500">
                  {formatDate(lead.createdAt)}
                </TableCell>
                <TableCell>
                  <Button outline href={`/reports/${lead.report.id}`}>
                    View report
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </AdminDataTable>
        </div>
      </div>
    </GridSection>
  );
}
