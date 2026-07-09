import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "rounded-lg border border-dashed shadow-none ring-0",
        className
      )}
    >
      {children}
    </Card>
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
    <CardHeader className="border-b border-dashed">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </CardHeader>
  );
}

export function AdminPanelContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <CardContent className={cn("pt-0", className)}>{children}</CardContent>;
}
