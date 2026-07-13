'use client'

import { useState } from 'react'
import { TbChecks } from 'react-icons/tb'

import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import Button from '@/components/ui/Button'

type AdminListSelectionProps = {
    count: number
    itemName: string
    confirmTitle: string
    confirmDescription: string
    onConfirm: () => Promise<void>
}

const AdminListSelection = ({
    count,
    itemName,
    confirmTitle,
    confirmDescription,
    onConfirm,
}: AdminListSelectionProps) => {
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const pluralItemName = count === 1 ? itemName : `${itemName}s`

    const handleCancel = () => {
        if (!deleting) {
            setConfirmationOpen(false)
        }
    }

    const handleConfirm = async () => {
        setDeleting(true)

        try {
            await onConfirm()
            setConfirmationOpen(false)
        } catch {
            // The table displays the action error and keeps the dialog open so
            // the administrator can retry or cancel.
        } finally {
            setDeleting(false)
        }
    }

    return (
        <>
            {count > 0 && (
                <StickyFooter
                    className="flex items-center justify-between bg-white py-4 dark:bg-gray-800"
                    stickyClass="-mx-4 border-t border-gray-200 px-4 sm:-mx-8 sm:px-8 dark:border-gray-700"
                    defaultClass="mt-4 w-full rounded-xl border border-gray-200 px-4 sm:px-8 dark:border-gray-600"
                >
                    <div className="flex w-full items-center justify-between">
                        <span className="flex items-center gap-2">
                            <span className="text-lg text-primary">
                                <TbChecks />
                            </span>
                            <span className="flex items-center gap-1 font-semibold">
                                <span className="heading-text">
                                    {count} {pluralItemName}
                                </span>
                                <span>selected</span>
                            </span>
                        </span>

                        <Button
                            size="sm"
                            type="button"
                            customColorClass={() =>
                                'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error'
                            }
                            onClick={() => setConfirmationOpen(true)}
                        >
                            Delete
                        </Button>
                    </div>
                </StickyFooter>
            )}

            <ConfirmDialog
                isOpen={confirmationOpen}
                type="danger"
                title={confirmTitle}
                confirmButtonProps={{ loading: deleting }}
                cancelButtonProps={{ disabled: deleting }}
                onClose={handleCancel}
                onRequestClose={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
            >
                <p>{confirmDescription}</p>
            </ConfirmDialog>
        </>
    )
}

export default AdminListSelection
