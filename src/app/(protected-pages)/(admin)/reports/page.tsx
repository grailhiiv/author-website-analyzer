import { TbSearch } from 'react-icons/tb'

import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import { Prisma, ReportStatus } from '@/generated/prisma/client'
import {
    type AdminSearchParams,
    buildReportWhere,
    parseReportListFilters,
    scoreRangeOptions,
} from '@/lib/admin/filters'
import { reportStatusLabels } from '@/lib/admin/display'
import { prisma } from '@/lib/db/prisma'
import {
    AdminListActionTools,
    AdminListTableTools,
} from '../_components/AdminListTools'
import ReportsListTable, {
    type ReportListItem,
} from './_components/ReportsListTable'

const reportStatusOptions = [
    { value: 'all', label: 'Any status' },
    ...Object.values(ReportStatus).map((status) => ({
        value: status,
        label: reportStatusLabels[status],
    })),
]

function getReportOrderBy(
    sortKey: string,
    order: Prisma.SortOrder,
): Prisma.ReportOrderByWithRelationInput {
    if (sortKey === 'domain') return { domain: order }
    if (sortKey === 'status') return { status: order }
    if (sortKey === 'overallScore') return { overallScore: order }
    return { createdAt: order }
}

// SECURITY: Keep this route inside the protected admin group because it exposes report data.
export default async function AdminReportsPage({
    searchParams,
}: {
    searchParams: Promise<AdminSearchParams>
}) {
    const filters = parseReportListFilters(await searchParams)
    const where = buildReportWhere(filters)
    const [total, reports] = await Promise.all([
        prisma.report.count({ where }),
        prisma.report.findMany({
            where,
            orderBy: getReportOrderBy(filters.sortKey, filters.order),
            skip: (filters.pageIndex - 1) * filters.pageSize,
            take: filters.pageSize,
            select: {
                id: true,
                domain: true,
                normalizedUrl: true,
                status: true,
                overallScore: true,
                createdAt: true,
            },
        }),
    ])

    const reportList: ReportListItem[] = reports.map((report) => ({
        ...report,
        createdAt: report.createdAt.toISOString(),
    }))

    const csvData = reports.map((report) => ({
        Website: report.domain,
        URL: report.normalizedUrl,
        Status: reportStatusLabels[report.status],
        Score: report.overallScore,
        Created: report.createdAt.toISOString(),
    }))

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h3>Reports</h3>
                        <AdminListActionTools
                            csvData={csvData}
                            csvFilename="reports.csv"
                            primaryAction={{
                                href: '/',
                                icon: <TbSearch className="text-xl" />,
                                label: 'New scan',
                            }}
                        />
                    </div>
                    <AdminListTableTools
                        searchValue={filters.website}
                        filters={[
                            {
                                key: 'status',
                                label: 'Status',
                                value: filters.status,
                                options: reportStatusOptions,
                            },
                            {
                                key: 'scoreRange',
                                label: 'Score',
                                value: filters.scoreRange,
                                options: scoreRangeOptions,
                            },
                        ]}
                    />
                    <ReportsListTable
                        data={reportList}
                        total={total}
                        pageIndex={filters.pageIndex}
                        pageSize={filters.pageSize}
                    />
                </div>
            </AdaptiveCard>
        </Container>
    )
}
