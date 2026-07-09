import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  className?: string;
  description: string;
  footer?: ReactNode;
  icon: ReactNode;
  title: string;
  value: number | string;
};

export function AdminStatCard({
  className,
  description,
  footer,
  icon,
  title,
  value,
}: AdminStatCardProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/10",
        className
      )}
    >
      <header className="space-y-3 border-b border-zinc-950/10 p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-sm">
            {icon}
          </div>
          {footer ? <div className="text-xs text-zinc-500">{footer}</div> : null}
        </div>
        <div>
          <h2 className="text-sm/6 font-semibold text-zinc-950">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {description}
          </p>
        </div>
      </header>
      <div className="p-5 pt-4">
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-zinc-950">
          {value}
        </p>
      </div>
    </section>
  );
}
