import { BrainCircuitIcon, ListChecksIcon } from "lucide-react";

import { AdminSettingsCard } from "@/components/admin/admin-settings-card";
import { Badge } from "@/components/ui/badge";
import { ReportCategory } from "@/generated/prisma/client";
import { categoryLabels } from "@/lib/admin/display";

const scoringRules = [
  "Category scores are computed from saved page, SEO, accessibility, performance, and conversion signals.",
  "The overall score is calculated from category output, not from AI text.",
  "Findings include severity, priority, recommendation, and category for admin review.",
  "AI-generated narratives explain existing findings but do not change numeric scoring.",
];

const categoryOrder = [
  ReportCategory.BRAND_CLARITY,
  ReportCategory.BOOK_PROMOTION,
  ReportCategory.READER_CONVERSION,
  ReportCategory.SEO_DISCOVERABILITY,
  ReportCategory.MOBILE_ACCESSIBILITY,
  ReportCategory.PERFORMANCE_HEALTH,
  ReportCategory.TRUST_CREDIBILITY,
  ReportCategory.MAINTENANCE_RISK,
];

export default function AdminScoringSettingsPage() {
  return (
    <div className="space-y-4">
      <AdminSettingsCard
        icon={BrainCircuitIcon}
        title="Scoring boundary"
        description="The app follows the product rule: deterministic scoring first, AI explanation second."
        status="configured"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {scoringRules.map((rule) => (
            <div
              key={rule}
              className="rounded-lg border border-dashed bg-muted/25 p-3 text-sm leading-6 text-muted-foreground"
            >
              {rule}
            </div>
          ))}
        </div>
      </AdminSettingsCard>

      <AdminSettingsCard
        icon={ListChecksIcon}
        title="Scorecard categories"
        description="These are the analyzer categories used across reports, findings, and admin review."
        status="configured"
      >
        <div className="grid gap-2 md:grid-cols-2">
          {categoryOrder.map((category, index) => (
            <div
              key={category}
              className="flex items-center gap-3 rounded-lg border border-dashed bg-background p-3"
            >
              <Badge variant="outline">{String(index + 1).padStart(2, "0")}</Badge>
              <span className="text-sm font-medium">
                {categoryLabels[category]}
              </span>
            </div>
          ))}
        </div>
      </AdminSettingsCard>
    </div>
  );
}
