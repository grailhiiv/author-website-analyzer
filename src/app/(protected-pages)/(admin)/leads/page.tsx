import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import { Prisma, SalesLeadStatus } from '@/generated/prisma/client'
import {
    type AdminSearchParams,
    buildLeadWhere,
    parseLeadListFilters,
} from '@/lib/admin/filters'
import { salesLeadStatusLabels } from '@/lib/admin/display'
import { prisma } from '@/lib/db/prisma'
import {
    AdminListActionTools,
    AdminListTableTools,
} from '../_components/AdminListTools'
import LeadsListTable, {
    type LeadListItem,
} from './_components/LeadsListTable'

const leadStatusOptions = [
    { value: 'all', label: 'Any status' },
    ...Object.values(SalesLeadStatus).map((status) => ({
        value: status,
        label: salesLeadStatusLabels[status],
    })),
]

const consentOptions = [
    { value: 'all', label: 'Any consent' },
    { value: 'yes', label: 'Consent given' },
    { value: 'no', label: 'Consent not given' },
]

function getLeadOrderBy(
    sortKey: string,
    order: Prisma.SortOrder,
): Prisma.LeadOrderByWithRelationInput {
    if (sortKey === 'fullName') return { fullName: order }
    if (sortKey === 'email') return { email: order }
    if (sortKey === 'websiteUrl') return { websiteUrl: order }
    if (sortKey === 'consent') return { consent: order }
    return { createdAt: order }
}

// SECURITY: Keep this route inside the protected admin group because it exposes lead data.
export default async function AdminLeadsPage({
    searchParams,
}: {
    searchParams: Promise<AdminSearchParams>
}) {
    const filters = parseLeadListFilters(await searchParams)
    const where = buildLeadWhere(filters)
    const [total, leads] = await Promise.all([
        prisma.lead.count({ where }),
        prisma.lead.findMany({
            where,
            orderBy: getLeadOrderBy(filters.sortKey, filters.order),
            skip: (filters.pageIndex - 1) * filters.pageSize,
            take: filters.pageSize,
            select: {
                id: true,
                fullName: true,
                email: true,
                websiteUrl: true,
                consent: true,
                createdAt: true,
                report: {
                    select: {
                        domain: true,
                        salesNote: { select: { leadStatus: true } },
                    },
                },
            },
        }),
    ])

    const leadList: LeadListItem[] = leads.map((lead) => ({
        id: lead.id,
        reportDomain: lead.report.domain,
        fullName: lead.fullName,
        email: lead.email,
        websiteUrl: lead.websiteUrl,
        consent: lead.consent,
        leadStatus: lead.report.salesNote?.leadStatus ?? SalesLeadStatus.NEW,
        createdAt: lead.createdAt.toISOString(),
    }))

    const csvData = leadList.map((lead) => ({
        Name: lead.fullName,
        Email: lead.email,
        Website: lead.websiteUrl,
        Consent: lead.consent ? 'Yes' : 'No',
        Status: salesLeadStatusLabels[lead.leadStatus],
        Created: lead.createdAt,
    }))

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h3>Leads</h3>
                        <AdminListActionTools
                            csvData={csvData}
                            csvFilename="leads.csv"
                        />
                    </div>
                    <AdminListTableTools
                        searchValue={filters.website}
                        filters={[
                            {
                                key: 'leadStatus',
                                label: 'Lead status',
                                value: filters.leadStatus,
                                options: leadStatusOptions,
                            },
                            {
                                key: 'consent',
                                label: 'Consent',
                                value: filters.consent,
                                options: consentOptions,
                            },
                        ]}
                    />
                    <LeadsListTable
                        data={leadList}
                        total={total}
                        pageIndex={filters.pageIndex}
                        pageSize={filters.pageSize}
                    />
                </div>
            </AdaptiveCard>
        </Container>
    )
}
