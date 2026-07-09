import type { ReactNode } from "react";

import {
  AdminPanel,
  AdminPanelContent,
  AdminPanelHeader,
} from "@/components/admin/admin-panel";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/catalyst/table";
import { cn } from "@/lib/utils";

type AdminDataTableColumn = {
  className?: string;
  label: string;
};

type AdminDataTableProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  columns: AdminDataTableColumn[];
  description: string;
  emptyState?: ReactNode;
  eyebrow?: string;
  minWidth?: string;
  rowCount: number;
  title: string;
};

export function AdminDataTable({
  actions,
  children,
  className,
  columns,
  description,
  emptyState,
  eyebrow,
  minWidth = "min-w-[920px]",
  rowCount,
  title,
}: AdminDataTableProps) {
  return (
    <AdminPanel className={className}>
      <AdminPanelHeader
        action={actions}
        eyebrow={eyebrow ?? `${rowCount} records`}
        title={title}
        description={description}
      />
      <AdminPanelContent className="p-0">
        {rowCount > 0 ? (
          <Table dense grid className={minWidth}>
            <TableHead>
              <TableRow className="bg-zinc-50">
                {columns.map((column) => (
                  <TableHeader
                    key={column.label}
                    className={cn(
                      "text-xs/6 font-semibold text-zinc-500",
                      column.className
                    )}
                  >
                    {column.label}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>{children}</TableBody>
          </Table>
        ) : (
          <div className="p-4">{emptyState}</div>
        )}
      </AdminPanelContent>
    </AdminPanel>
  );
}
