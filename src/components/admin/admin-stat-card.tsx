import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className={cn("rounded-lg border-dashed shadow-none", className)}>
      <CardHeader className="space-y-3 border-b border-dashed pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-8 items-center justify-center rounded-md border bg-muted/40 text-foreground">
            {icon}
          </div>
          {footer ? (
            <div className="text-xs text-muted-foreground">{footer}</div>
          ) : null}
        </div>
        <div>
          <CardTitle className="text-sm">{title}</CardTitle>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="font-mono text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
