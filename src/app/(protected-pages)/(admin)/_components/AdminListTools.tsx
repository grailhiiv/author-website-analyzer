'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { TbCloudDownload, TbEye, TbFilter, TbSearch } from 'react-icons/tb'
import type { ReactNode } from 'react'

import DebouceInput from '@/components/shared/DebouceInput'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { FormItem } from '@/components/ui/Form'
import Select from '@/components/ui/Select'
import Tooltip from '@/components/ui/Tooltip'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'

const CSVLink = dynamic(() => import('react-csv').then((mod) => mod.CSVLink), {
    ssr: false,
})

type FilterOption = {
    label: string
    value: string
}

export type ListFilter = {
    key: string
    label: string
    options: FilterOption[]
    value: string
}

type AdminListActionToolsProps = {
    csvData: Record<string, string | number | boolean | null>[]
    csvFilename: string
    primaryAction?: {
        href: string
        icon: ReactNode
        label: string
    }
}

export const AdminListActionTools = ({
    csvData,
    csvFilename,
    primaryAction,
}: AdminListActionToolsProps) => {
    const router = useRouter()

    return (
        <div className="flex flex-col gap-3 sm:flex-row">
            <CSVLink className="w-full" filename={csvFilename} data={csvData}>
                <Button
                    className="w-full"
                    icon={<TbCloudDownload className="text-xl" />}
                >
                    Download
                </Button>
            </CSVLink>
            {primaryAction ? (
                <Button
                    variant="solid"
                    icon={primaryAction.icon}
                    onClick={() => router.push(primaryAction.href)}
                >
                    {primaryAction.label}
                </Button>
            ) : null}
        </div>
    )
}

type AdminListTableToolsProps = {
    filters: ListFilter[]
    searchValue: string
}

export const AdminListTableTools = ({
    filters,
    searchValue,
}: AdminListTableToolsProps) => {
    const [dialogIsOpen, setDialogIsOpen] = useState(false)
    const [filterValues, setFilterValues] = useState<Record<string, string>>(
        () => Object.fromEntries(filters.map((filter) => [filter.key, filter.value])),
    )
    const { onAppendQueryParams } = useAppendQueryParams()

    useEffect(() => {
        if (dialogIsOpen) {
            setFilterValues(
                Object.fromEntries(
                    filters.map((filter) => [filter.key, filter.value]),
                ),
            )
        }
    }, [dialogIsOpen, filters])

    const applyFilters = () => {
        onAppendQueryParams({ ...filterValues, pageIndex: '1' })
        setDialogIsOpen(false)
    }

    return (
        <>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <DebouceInput
                    key={searchValue}
                    className="w-full"
                    defaultValue={searchValue}
                    placeholder="Quick search..."
                    suffix={<TbSearch className="text-lg" />}
                    onChange={(event) =>
                        onAppendQueryParams({
                            website: event.target.value,
                            pageIndex: '1',
                        })
                    }
                />
                <Button
                    className="md:shrink-0"
                    icon={<TbFilter />}
                    onClick={() => setDialogIsOpen(true)}
                >
                    Filter
                </Button>
            </div>
            <Dialog
                isOpen={dialogIsOpen}
                onClose={() => setDialogIsOpen(false)}
                onRequestClose={() => setDialogIsOpen(false)}
            >
                <h4 className="mb-4">Filter</h4>
                <div className="flex flex-col gap-4">
                    {filters.map((filter) => (
                        <FormItem key={filter.key} label={filter.label}>
                            <Select<FilterOption>
                                instanceId={`admin-${filter.key}-filter`}
                                isSearchable={false}
                                options={filter.options}
                                value={filter.options.find(
                                    (option) =>
                                        option.value === filterValues[filter.key],
                                )}
                                onChange={(option) =>
                                    setFilterValues((current) => ({
                                        ...current,
                                        [filter.key]: option?.value ?? 'all',
                                    }))
                                }
                            />
                        </FormItem>
                    ))}
                </div>
                <div className="mt-6 flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        onClick={() =>
                            setFilterValues(
                                Object.fromEntries(
                                    filters.map((filter) => [
                                        filter.key,
                                        filter.options[0]?.value ?? 'all',
                                    ]),
                                ),
                            )
                        }
                    >
                        Reset
                    </Button>
                    <Button type="button" variant="solid" onClick={applyFilters}>
                        Apply
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export const ViewAction = ({
    label,
    onClick,
}: {
    label: string
    onClick: () => void
}) => (
    <Tooltip title={label}>
        <button
            type="button"
            aria-label={label}
            className="cursor-pointer select-none text-xl font-semibold transition-colors hover:text-primary"
            onClick={onClick}
        >
            <TbEye aria-hidden="true" />
        </button>
    </Tooltip>
)
