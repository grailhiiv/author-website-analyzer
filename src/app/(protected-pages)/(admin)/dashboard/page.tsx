import Link from "next/link";
import { TbArrowDownToArc, TbCopyCheck, TbProgressBolt } from "react-icons/tb";
import type { ReactNode } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { ReportStatus, type SalesLeadStatus } from "@/generated/prisma/client";
import {
  formatDate,
  formatScore,
  reportStatusLabels,
  salesLeadStatusLabels,
} from "@/lib/admin/display";
import { prisma } from "@/lib/db/prisma";
import { getAdminReportPath } from "@/lib/reports/domain";
import classNames from "@/utils/classNames";

type StatisticCardProps = {
  className: string;
  icon: ReactNode;
  title: string;
  value: number;
};

function StatisticCard({ className, icon, title, value }: StatisticCardProps) {
  return (
    <div
      className={classNames(
        "flex flex-col justify-center rounded-2xl p-4",
        className,
      )}
    >
      <div className="relative flex items-center justify-between">
        <div>
          <div className="mb-4 font-bold text-gray-900">{title}</div>
          <h1 className="mb-1 text-gray-900">{value}</h1>
        </div>
        <div className="flex max-h-12 min-h-12 min-w-12 max-w-12 items-center justify-center rounded-full bg-gray-900 text-2xl text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ViewAllButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <Button asElement="div" size="sm">
        {label}
      </Button>
    </Link>
  );
}

function ReportStatusLabel({ status }: { status: ReportStatus }) {
  const styles = {
    [ReportStatus.QUEUED]: {
      dotClass: "bg-gray-400",
      textClass: "text-gray-500",
    },
    [ReportStatus.RUNNING]: {
      dotClass: "bg-blue-500",
      textClass: "text-blue-500",
    },
    [ReportStatus.COMPLETE]: {
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-500",
    },
    [ReportStatus.FAILED]: {
      dotClass: "bg-red-500",
      textClass: "text-red-500",
    },
  } satisfies Record<ReportStatus, { dotClass: string; textClass: string }>;
  const style = styles[status];

  return (
    <div className="flex items-center">
      <Badge className={style.dotClass} />
      <span
        className={`ml-2 font-semibold capitalize rtl:mr-2 ${style.textClass}`}
      >
        {reportStatusLabels[status]}
      </span>
    </div>
  );
}

function LeadStatusLabel({ status }: { status: SalesLeadStatus }) {
  const styles: Record<
    SalesLeadStatus,
    { dotClass: string; textClass: string }
  > = {
    NEW: { dotClass: "bg-blue-500", textClass: "text-blue-500" },
    CONTACTED: { dotClass: "bg-amber-500", textClass: "text-amber-500" },
    QUALIFIED: { dotClass: "bg-purple-500", textClass: "text-purple-500" },
    CONVERTED: {
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-500",
    },
    CLOSED: { dotClass: "bg-gray-400", textClass: "text-gray-500" },
  };

  return (
    <div className="flex items-center">
      <Badge className={styles[status].dotClass} />
      <span
        className={`ml-2 font-semibold capitalize rtl:mr-2 ${styles[status].textClass}`}
      >
        {salesLeadStatusLabels[status]}
      </span>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [reportCount, completeCount, leadCount, recentReports, recentLeads] =
    await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: ReportStatus.COMPLETE } }),
      prisma.lead.count(),
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 7,
      }),
      prisma.lead.findMany({
        include: { report: { include: { salesNote: true } } },
        orderBy: { createdAt: "desc" },
        take: 7,
      }),
    ]);

  return (
    <div className="flex w-full flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between">
          <h4>Overview</h4>
          <ViewAllButton href="/reports" label="All reports" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl md:grid-cols-3">
          <StatisticCard
            title="All reports"
            className="bg-sky-100 dark:bg-opacity-75"
            value={reportCount}
            icon={<TbProgressBolt />}
          />
          <StatisticCard
            title="Completed"
            className="bg-emerald-100 dark:bg-opacity-75"
            value={completeCount}
            icon={<TbCopyCheck />}
          />
          <StatisticCard
            title="Report leads"
            className="bg-purple-100 dark:bg-opacity-75"
            value={leadCount}
            icon={<TbArrowDownToArc />}
          />
        </div>
      </Card>

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <h4>Recent Reports</h4>
          <ViewAllButton href="/reports" label="View Reports" />
        </div>
        {recentReports.length ? (
          <Table>
            <Table.THead>
              <Table.Tr>
                <Table.Th>Website</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Score</Table.Th>
              </Table.Tr>
            </Table.THead>
            <Table.TBody>
              {recentReports.map((report) => (
                <Table.Tr key={report.id}>
                  <Table.Td>
                    <Link
                      className="cursor-pointer select-none font-semibold hover:text-primary"
                      href={getAdminReportPath(report.domain)}
                    >
                      {report.domain}
                    </Link>
                  </Table.Td>
                  <Table.Td>
                    <ReportStatusLabel status={report.status} />
                  </Table.Td>
                  <Table.Td>{formatDate(report.createdAt)}</Table.Td>
                  <Table.Td className="heading-text font-bold">
                    {formatScore(report.overallScore)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.TBody>
          </Table>
        ) : (
          <p className="py-6 text-sm text-gray-500">No website reports yet.</p>
        )}
      </Card>

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <h4>Recent Leads</h4>
          <ViewAllButton href="/leads" label="View Leads" />
        </div>
        {recentLeads.length ? (
          <Table>
            <Table.THead>
              <Table.Tr>
                <Table.Th>Author</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Website</Table.Th>
                <Table.Th>Email</Table.Th>
              </Table.Tr>
            </Table.THead>
            <Table.TBody>
              {recentLeads.map((lead) => {
                const leadStatus = lead.report.salesNote?.leadStatus ?? "NEW";

                return (
                  <Table.Tr key={lead.id}>
                    <Table.Td>{lead.fullName}</Table.Td>
                    <Table.Td>
                      <LeadStatusLabel status={leadStatus} />
                    </Table.Td>
                    <Table.Td>{formatDate(lead.createdAt)}</Table.Td>
                    <Table.Td>
                      <Link
                        className="hover:text-primary"
                        href={getAdminReportPath(lead.report.domain)}
                      >
                        {lead.report.domain}
                      </Link>
                    </Table.Td>
                    <Table.Td>
                      <a
                        className="hover:text-primary"
                        href={`mailto:${lead.email}`}
                      >
                        {lead.email}
                      </a>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.TBody>
          </Table>
        ) : (
          <p className="py-6 text-sm text-gray-500">
            No authors have unlocked a full report yet.
          </p>
        )}
      </Card>
    </div>
  );
}
