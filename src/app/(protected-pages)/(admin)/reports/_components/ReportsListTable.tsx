'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import DataTable from '@/components/shared/DataTable'
import Notification from '@/components/ui/Notification'
import Tag from '@/components/ui/Tag'
import toast from '@/components/ui/toast'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import type { Row } from '@tanstack/react-table'
import { getAdminReportPath } from '@/lib/reports/domain'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { deleteReportsAction } from '../../_actions/deleteAdminRecords'
import { ViewAction } from '../../_components/AdminListTools'
import AdminListSelection from '../../_components/AdminListSelection'

type ReportListStatus = 'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED'

const reportStatusLabels: Record<ReportListStatus, string> = {
    QUEUED: 'Queued',
    RUNNING: 'Running',
    COMPLETE: 'Complete',
    FAILED: 'Failed',
}

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value))

export type ReportListItem = {
    id: string
    domain: string
    normalizedUrl: string
    status: ReportListStatus
    overallScore: number | null
    createdAt: string
}

type ReportsListTableProps = {
    data: ReportListItem[]
    pageIndex: number
    pageSize: number
    total: number
}

const statusColor: Record<ReportListStatus, string> = {
    QUEUED: 'bg-gray-200 dark:bg-gray-200 text-gray-900 dark:text-gray-900',
    RUNNING: 'bg-blue-200 dark:bg-blue-200 text-gray-900 dark:text-gray-900',
    COMPLETE:
        'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
    FAILED: 'bg-red-200 dark:bg-red-200 text-gray-900 dark:text-gray-900',
}

const ReportsListTable = ({
    data,
    pageIndex,
    pageSize,
    total,
}: ReportsListTableProps) => {
    const router = useRouter()
    const { onAppendQueryParams } = useAppendQueryParams()
    const [selectedReports, setSelectedReports] = useState<ReportListItem[]>([])

    useEffect(() => {
        const visibleIds = new Set(data.map((report) => report.id))
        setSelectedReports((selected) =>
            selected.filter((report) => visibleIds.has(report.id)),
        )
    }, [data])

    const columns: ColumnDef<ReportListItem>[] = useMemo(
        () => [
            {
                header: 'Website',
                accessorKey: 'domain',
                cell: ({ row }) => (
                    <div className="flex min-w-56 flex-col gap-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {row.original.domain}
                        </span>
                        <span className="max-w-80 truncate text-xs text-gray-500">
                            {row.original.normalizedUrl}
                        </span>
                    </div>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: ({ row }) => (
                    <Tag className={statusColor[row.original.status]}>
                        {reportStatusLabels[row.original.status]}
                    </Tag>
                ),
            },
            {
                header: 'Score',
                accessorKey: 'overallScore',
                cell: ({ row }) => (
                    <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                        {row.original.overallScore === null
                            ? 'Not scored'
                            : `${row.original.overallScore}/100`}
                    </span>
                ),
            },
            {
                header: 'Created',
                accessorKey: 'createdAt',
                cell: ({ row }) => formatDate(row.original.createdAt),
            },
            {
                header: '',
                id: 'action',
                enableSorting: false,
                cell: ({ row }) => (
                    <ViewAction
                        label="View"
                        onClick={() =>
                            router.push(getAdminReportPath(row.original.domain))
                        }
                    />
                ),
            },
        ],
        [router],
    )

    const handleSort = (sort: OnSortParam) => {
        onAppendQueryParams({
            order: sort.order || 'desc',
            sortKey: sort.key ? String(sort.key) : 'createdAt',
            pageIndex: '1',
        })
    }

    const handleRowSelect = (checked: boolean, report: ReportListItem) => {
        setSelectedReports((selected) =>
            checked
                ? selected.some((item) => item.id === report.id)
                    ? selected
                    : [...selected, report]
                : selected.filter((item) => item.id !== report.id),
        )
    }

    const handleSelectAll = (
        checked: boolean,
        rows: Row<ReportListItem>[],
    ) => {
        setSelectedReports(checked ? rows.map((row) => row.original) : [])
    }

    const handleDelete = async () => {
        try {
            const result = await deleteReportsAction(
                selectedReports.map((report) => report.id),
            )

            setSelectedReports([])
            toast.push(
                <Notification type="success">
                    {result.deletedCount === 1
                        ? 'Report deleted.'
                        : `${result.deletedCount} reports deleted.`}
                </Notification>,
                { placement: 'top-center' },
            )
            router.refresh()
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {error instanceof Error
                        ? error.message
                        : 'Unable to delete the selected reports.'}
                </Notification>,
                { placement: 'top-center' },
            )
            throw error
        }
    }

    return (
        <>
            <DataTable
                instanceId="reports-page-size"
                columns={columns}
                data={data}
                noData={data.length === 0}
                pagingData={{ total, pageIndex, pageSize }}
                selectable
                checkboxChecked={(report) =>
                    selectedReports.some((item) => item.id === report.id)
                }
                indeterminateCheckboxChecked={(rows) =>
                    rows.length > 0 &&
                    rows.every((row) =>
                        selectedReports.some(
                            (report) => report.id === row.original.id,
                        ),
                    )
                }
                onCheckBoxChange={handleRowSelect}
                onIndeterminateCheckBoxChange={handleSelectAll}
                onPaginationChange={(page) =>
                    onAppendQueryParams({ pageIndex: String(page) })
                }
                onSelectChange={(size) =>
                    onAppendQueryParams({
                        pageSize: String(size),
                        pageIndex: '1',
                    })
                }
                onSort={handleSort}
            />
            <AdminListSelection
                count={selectedReports.length}
                itemName="Report"
                confirmTitle={
                    selectedReports.length === 1
                        ? 'Remove report'
                        : 'Remove reports'
                }
                confirmDescription={
                    selectedReports.length === 1
                        ? "Are you sure you want to remove this report? This action can't be undone."
                        : "Are you sure you want to remove these reports? This action can't be undone."
                }
                onConfirm={handleDelete}
            />
        </>
    )
}

export default ReportsListTable
