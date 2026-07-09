import {
  FileTextIcon,
  LockKeyholeIcon,
  MailCheckIcon,
  WorkflowIcon,
} from "lucide-react";

import { AdminSettingsCard } from "@/components/admin/admin-settings-card";
import { Badge } from "@/components/ui/badge";

function envStatus(name: string) {
  return process.env[name]?.trim() ? "configured" : "review";
}

export default function AdminSettingsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <AdminSettingsCard
        icon={WorkflowIcon}
        title="Analysis workflow"
        description="The app creates a report record, runs inspection jobs, stores deterministic scores, and exposes a public report."
        status="configured"
      >
        <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
          <li>Website URL normalization and security checks run before scanning.</li>
          <li>Playwright and crawler services collect page evidence.</li>
          <li>Score calculations are saved before AI narrative generation.</li>
        </ul>
      </AdminSettingsCard>

      <AdminSettingsCard
        icon={LockKeyholeIcon}
        title="Admin access"
        description="Protected routes use Better Auth sessions and an allowed admin email."
        status={envStatus("ADMIN_EMAIL")}
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Better Auth</Badge>
          <Badge variant={envStatus("ADMIN_EMAIL") === "configured" ? "secondary" : "outline"}>
            ADMIN_EMAIL
          </Badge>
          <Badge variant={envStatus("AUTH_SECRET") === "configured" ? "secondary" : "outline"}>
            AUTH_SECRET
          </Badge>
        </div>
      </AdminSettingsCard>

      <AdminSettingsCard
        icon={MailCheckIcon}
        title="Lead capture"
        description="Author contact details are connected to the report and kept available for backend follow-up."
        status="configured"
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Leads store name, email, website URL, author type, website goal, and
          consent status. Sales notes stay admin-only on each report detail page.
        </p>
      </AdminSettingsCard>

      <AdminSettingsCard
        icon={FileTextIcon}
        title="Public report access"
        description="Reports can be viewed publicly by report ID while internal notes remain behind admin authentication."
        status="configured"
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Public pages show the author-facing scorecard. The admin detail page
          adds lead data, technical evidence, scanned pages, and outreach drafts.
        </p>
      </AdminSettingsCard>
    </div>
  );
}
