import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminEmptyStateProps = {
  action?: ReactNode;
  className?: string;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
};

export function AdminEmptyState({
  action,
  className,
  description,
  icon: Icon,
  title,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/25 px-6 py-10 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-10 items-center justify-center rounded-lg border bg-background">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="max-w-md">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
