import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AdminPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/10",
        className
      )}
    >
      {children}
    </section>
  );
}

export function AdminPanelHeader({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <header className="border-b border-zinc-950/10 bg-white px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="mb-1 text-xs/6 font-medium text-zinc-500">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-base/7 font-semibold text-zinc-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm/6 text-zinc-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function AdminPanelContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("pt-0", className)}>{children}</div>;
}
