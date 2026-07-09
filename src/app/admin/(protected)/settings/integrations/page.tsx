import {
  BotIcon,
  CloudIcon,
  DatabaseIcon,
  GaugeIcon,
  MonitorCheckIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { AdminSettingsCard } from "@/components/admin/admin-settings-card";
import { Badge } from "@/components/ui/badge";

const integrations = [
  {
    env: "DATABASE_URL",
    icon: DatabaseIcon,
    title: "PostgreSQL and Prisma",
    description: "Stores reports, leads, scan evidence, score records, findings, and auth tables.",
    tags: ["PostgreSQL", "Prisma"],
  },
  {
    env: "AUTH_SECRET",
    icon: ShieldCheckIcon,
    title: "Better Auth",
    description: "Protects admin routes and signs authenticated sessions.",
    tags: ["Better Auth", "Admin session"],
  },
  {
    env: "OPENAI_API_KEY",
    icon: BotIcon,
    title: "OpenAI report copy",
    description: "Generates author-friendly explanations and outreach drafts from saved findings.",
    tags: ["AI SDK/OpenAI", "Narrative only"],
  },
  {
    env: "PAGESPEED_API_KEY",
    icon: GaugeIcon,
    title: "PageSpeed Insights",
    description: "Adds performance, accessibility, SEO, and best-practice evidence to the technical audit.",
    tags: ["Lighthouse", "PageSpeed"],
  },
  {
    env: null,
    icon: MonitorCheckIcon,
    title: "Playwright",
    description: "Captures screenshots and inspects pages during crawler runs.",
    tags: ["Screenshots", "Page inspection"],
  },
  {
    env: "APP_URL",
    icon: CloudIcon,
    title: "Vercel deployment",
    description: "Uses the public application URL for production-safe links and report access.",
    tags: ["Vercel", "APP_URL"],
  },
];

function configured(env: string | null) {
  if (!env) {
    return true;
  }

  return Boolean(process.env[env]?.trim());
}

export default function AdminIntegrationsSettingsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {integrations.map((integration) => {
        const isConfigured = configured(integration.env);

        return (
          <AdminSettingsCard
            key={integration.title}
            icon={integration.icon}
            title={integration.title}
            description={integration.description}
            status={isConfigured ? "configured" : "review"}
          >
            <div className="flex flex-wrap gap-2">
              {integration.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
              {integration.env ? (
                <Badge variant={isConfigured ? "secondary" : "outline"}>
                  {integration.env}
                </Badge>
              ) : null}
            </div>
          </AdminSettingsCard>
        );
      })}
    </div>
  );
}
