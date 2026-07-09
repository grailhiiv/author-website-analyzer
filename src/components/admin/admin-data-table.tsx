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
} from "@/components/ui/table";
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
          <Table className={cn(minWidth, "text-[0.8rem]")}>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {columns.map((column) => (
                  <TableHead
                    key={column.label}
                    className={cn(
                      "h-9 border-b border-dashed px-3 text-xs font-medium text-muted-foreground",
                      column.className
                    )}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="[&_td]:px-3 [&_td]:py-3">
              {children}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4">{emptyState}</div>
        )}
      </AdminPanelContent>
    </AdminPanel>
  );
}
