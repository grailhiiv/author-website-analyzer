import type { ComponentType, ReactNode } from "react";

import {
  AdminPanel,
  AdminPanelContent,
  AdminPanelHeader,
} from "@/components/admin/admin-panel";
import { Badge } from "@/components/catalyst/badge";

type AdminSettingsCardProps = {
  children: ReactNode;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  status?: "configured" | "review" | "manual";
  title: string;
};

const statusLabels = {
  configured: "Configured",
  manual: "Manual",
  review: "Review",
} as const;

export function AdminSettingsCard({
  children,
  description,
  icon: Icon,
  status = "manual",
  title,
}: AdminSettingsCardProps) {
  return (
    <AdminPanel>
      <AdminPanelHeader
        title={title}
        description={description}
        action={
          <Badge color={status === "configured" ? "green" : "zinc"}>
            {statusLabels[status]}
          </Badge>
        }
      />
      <AdminPanelContent className="space-y-4 pt-4">
        <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-950/10 bg-zinc-50">
          <Icon className="size-4 text-zinc-500" aria-hidden />
        </div>
        {children}
      </AdminPanelContent>
    </AdminPanel>
  );
}
