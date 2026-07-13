import Link from 'next/link'
import type {
    ButtonHTMLAttributes,
    ComponentProps,
    HTMLAttributes,
    InputHTMLAttributes,
    SelectHTMLAttributes,
    TdHTMLAttributes,
    ThHTMLAttributes,
} from 'react'

import EcmeTable from '@/components/ui/Table'
import { cn } from '@/lib/utils'

export function Badge({
    children,
    className,
    color,
    ...props
}: HTMLAttributes<HTMLSpanElement> & { color?: string }) {
    const tone =
        color === 'blue'
            ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300'
            : color === 'green'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300'
              : color === 'red'
                ? 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300'
                : 'bg-gray-100 text-gray-700 ring-gray-600/10 dark:bg-gray-700 dark:text-gray-200'

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                tone,
                className,
            )}
            {...props}
        >
            {children}
        </span>
    )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: string
    outline?: boolean
    plain?: boolean
    color?: string
}

export function Button({
    children,
    className,
    href,
    outline,
    plain,
    color: _color,
    ...props
}: ButtonProps) {
    const classes = cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
        plain
            ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            : outline
              ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
              : 'bg-primary text-white hover:opacity-90',
        className,
    )

    if (href) {
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        )
    }

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                className,
            )}
            {...props}
        />
    )
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            className={cn(
                'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                className,
            )}
            {...props}
        />
    )
}

export function Table({
    className,
    dense,
    grid,
    ...props
}: ComponentProps<typeof EcmeTable> & { dense?: boolean; grid?: boolean }) {
    return (
        <EcmeTable
            compact={dense}
            cellBorder={grid}
            className={cn('w-full border-collapse text-left text-sm', className)}
            {...props}
        />
    )
}

export function TableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
    return <thead {...props} />
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody {...props} />
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn('border-b border-gray-200 dark:border-gray-700', className)} {...props} />
}

export function TableHeader({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn('px-4 py-3 font-semibold text-gray-600 dark:text-gray-300', className)} {...props} />
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn('px-4 py-3 align-top text-gray-700 dark:text-gray-200', className)} {...props} />
}
