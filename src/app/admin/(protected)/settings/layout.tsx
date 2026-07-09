import { BrainCircuitIcon } from "lucide-react";

import { AdminNavLink } from "@/components/admin/admin-nav-link";
import {
  AdminPanel,
  AdminPanelContent,
  AdminPanelHeader,
} from "@/components/admin/admin-panel";
import { GridSection } from "@/components/layout/grid-section";
import { PageHeader } from "@/components/layout/page-header";

const settingsNavItems = [
  {
    href: "/admin/settings",
    label: "Overview",
    description: "Workspace behavior",
    icon: "settings",
  },
  {
    href: "/admin/settings/scoring",
    label: "Scoring",
    description: "Scorecard rules",
    icon: "scoring",
  },
  {
    href: "/admin/settings/integrations",
    label: "Integrations",
    description: "APIs and services",
    icon: "integrations",
  },
] as const;

export default function AdminSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GridSection>
      <div className="px-0 py-8 sm:px-4 lg:px-6">
        <PageHeader
          eyebrow="Admin"
          title="Settings"
          description="Backend configuration, scoring boundaries, and integrations for the Author Website Analyzer."
        />

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <AdminPanel className="h-fit">
            <AdminPanelHeader
              eyebrow="Workspace"
              title="Settings sections"
              description="Manage analyzer-specific backend behavior."
            />
            <AdminPanelContent className="space-y-1 pt-3">
              {settingsNavItems.map((item) => (
                <AdminNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  description={item.description}
                  icon={item.icon}
                />
              ))}
            </AdminPanelContent>
          </AdminPanel>

          <section className="min-w-0 space-y-6">
            <div className="rounded-lg border border-dashed bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                  <BrainCircuitIcon
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">
                    Deterministic scores, AI explanations
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Numeric scores stay rule-based. AI is limited to explaining
                    saved findings in plain author-friendly language.
                  </p>
                </div>
              </div>
            </div>
            {children}
          </section>
        </div>
      </div>
    </GridSection>
  );
}
