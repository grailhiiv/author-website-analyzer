import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="flex max-w-3xl flex-col gap-2">
        {eyebrow ? (
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="break-words text-base leading-7 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
