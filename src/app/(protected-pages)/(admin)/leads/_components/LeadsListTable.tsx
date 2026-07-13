'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import DataTable from '@/components/shared/DataTable'
import Notification from '@/components/ui/Notification'
import Tag from '@/components/ui/Tag'
import toast from '@/components/ui/toast'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import type { Row } from '@tanstack/react-table'
import { getAdminReportPath } from '@/lib/reports/domain'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { deleteLeadsAction } from '../../_actions/deleteAdminRecords'
import { ViewAction } from '../../_components/AdminListTools'
import AdminListSelection from '../../_components/AdminListSelection'

type LeadListStatus =
    | 'NEW'
    | 'CONTACTED'
    | 'QUALIFIED'
    | 'CONVERTED'
    | 'CLOSED'

const salesLeadStatusLabels: Record<LeadListStatus, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    CONVERTED: 'Converted',
    CLOSED: 'Closed',
}

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value))

export type LeadListItem = {
    id: string
    reportDomain: string
    fullName: string
    email: string
    websiteUrl: string
    consent: boolean
    leadStatus: LeadListStatus
    createdAt: string
}

type LeadsListTableProps = {
    data: LeadListItem[]
    pageIndex: number
    pageSize: number
    total: number
}

const leadStatusColor: Record<LeadListStatus, string> = {
    NEW: 'bg-blue-200 dark:bg-blue-200 text-gray-900 dark:text-gray-900',
    CONTACTED: 'bg-amber-200 dark:bg-amber-200 text-gray-900 dark:text-gray-900',
    QUALIFIED:
        'bg-purple-200 dark:bg-purple-200 text-gray-900 dark:text-gray-900',
    CONVERTED:
        'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
    CLOSED: 'bg-gray-200 dark:bg-gray-200 text-gray-900 dark:text-gray-900',
}

const LeadsListTable = ({
    data,
    pageIndex,
    pageSize,
    total,
}: LeadsListTableProps) => {
    const router = useRouter()
    const { onAppendQueryParams } = useAppendQueryParams()
    const [selectedLeads, setSelectedLeads] = useState<LeadListItem[]>([])

    useEffect(() => {
        const visibleIds = new Set(data.map((lead) => lead.id))
        setSelectedLeads((selected) =>
            selected.filter((lead) => visibleIds.has(lead.id)),
        )
    }, [data])

    const columns: ColumnDef<LeadListItem>[] = useMemo(
        () => [
            {
                header: 'Name',
                accessorKey: 'fullName',
                cell: ({ row }) => (
                    <Link
                        className="font-semibold text-gray-900 hover:text-primary dark:text-gray-100"
                        href={getAdminReportPath(row.original.reportDomain)}
                    >
                        {row.original.fullName}
                    </Link>
                ),
            },
            {
                header: 'Email',
                accessorKey: 'email',
                cell: ({ row }) => (
                    <span>{row.original.email}</span>
                ),
            },
            {
                header: 'Website',
                accessorKey: 'websiteUrl',
                cell: ({ row }) => (
                    <span className="block max-w-64 truncate">
                        {row.original.websiteUrl}
                    </span>
                ),
            },
            {
                header: 'Consent',
                accessorKey: 'consent',
                cell: ({ row }) => (
                    <Tag
                        className={
                            row.original.consent
                                ? 'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900'
                                : 'bg-gray-200 dark:bg-gray-200 text-gray-900 dark:text-gray-900'
                        }
                    >
                        {row.original.consent ? 'Yes' : 'No'}
                    </Tag>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'leadStatus',
                enableSorting: false,
                cell: ({ row }) => (
                    <Tag className={leadStatusColor[row.original.leadStatus]}>
                        {salesLeadStatusLabels[row.original.leadStatus]}
                    </Tag>
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
                            router.push(
                                getAdminReportPath(row.original.reportDomain),
                            )
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

    const handleRowSelect = (checked: boolean, lead: LeadListItem) => {
        setSelectedLeads((selected) =>
            checked
                ? selected.some((item) => item.id === lead.id)
                    ? selected
                    : [...selected, lead]
                : selected.filter((item) => item.id !== lead.id),
        )
    }

    const handleSelectAll = (checked: boolean, rows: Row<LeadListItem>[]) => {
        setSelectedLeads(checked ? rows.map((row) => row.original) : [])
    }

    const handleDelete = async () => {
        try {
            const result = await deleteLeadsAction(
                selectedLeads.map((lead) => lead.id),
            )

            setSelectedLeads([])
            toast.push(
                <Notification type="success">
                    {result.deletedCount === 1
                        ? 'Lead deleted.'
                        : `${result.deletedCount} leads deleted.`}
                </Notification>,
                { placement: 'top-center' },
            )
            router.refresh()
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {error instanceof Error
                        ? error.message
                        : 'Unable to delete the selected leads.'}
                </Notification>,
                { placement: 'top-center' },
            )
            throw error
        }
    }

    return (
        <>
            <DataTable
                instanceId="leads-page-size"
                columns={columns}
                data={data}
                noData={data.length === 0}
                pagingData={{ total, pageIndex, pageSize }}
                selectable
                checkboxChecked={(lead) =>
                    selectedLeads.some((item) => item.id === lead.id)
                }
                indeterminateCheckboxChecked={(rows) =>
                    rows.length > 0 &&
                    rows.every((row) =>
                        selectedLeads.some(
                            (lead) => lead.id === row.original.id,
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
                count={selectedLeads.length}
                itemName="Lead"
                confirmTitle={
                    selectedLeads.length === 1
                        ? 'Remove lead'
                        : 'Remove leads'
                }
                confirmDescription={
                    selectedLeads.length === 1
                        ? "Are you sure you want to remove this lead? This action can't be undone."
                        : "Are you sure you want to remove these leads? This action can't be undone."
                }
                onConfirm={handleDelete}
            />
        </>
    )
}

export default LeadsListTable
