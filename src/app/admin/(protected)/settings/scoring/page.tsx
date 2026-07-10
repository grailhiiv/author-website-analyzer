import { BrainCircuitIcon, ListChecksIcon } from "lucide-react";

import { AdminSettingsCard } from "@/components/admin/admin-settings-card";
import { Badge } from "@/components/catalyst/badge";
import {
  DETERMINISTIC_SCORING_CATEGORIES,
  DETERMINISTIC_SCORING_TOTAL,
} from "@/lib/scoring/engine";

const scoringRules = [
  "Category scores are computed from saved page, SEO, accessibility, performance, and conversion signals.",
  "Category points = round((earned applicable check points / available applicable check points) x category maximum).",
  "The overall score is the sum of all eight category point scores, with a maximum of 100.",
  "Findings include severity, priority, recommendation, and category for admin review.",
  "AI-generated narratives explain existing findings but do not change numeric scoring.",
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
              className="rounded-lg border border-zinc-950/10 bg-zinc-50 p-3 text-sm leading-6 text-zinc-500"
            >
              {rule}
            </div>
          ))}
        </div>
      </AdminSettingsCard>

      <AdminSettingsCard
        icon={ListChecksIcon}
        title="Scorecard categories"
        description={`These fixed category maxima add up to ${DETERMINISTIC_SCORING_TOTAL} points.`}
        status="configured"
      >
        <div className="grid gap-2 md:grid-cols-2">
          {DETERMINISTIC_SCORING_CATEGORIES.map((category, index) => (
            <div
              key={category.category}
              className="flex items-center gap-3 rounded-lg border border-zinc-950/10 bg-white p-3"
            >
              <Badge>{String(index + 1).padStart(2, "0")}</Badge>
              <span className="min-w-0 flex-1 text-sm font-medium">
                {category.label}
              </span>
              <Badge>{category.weight} pts</Badge>
            </div>
          ))}
        </div>
      </AdminSettingsCard>
    </div>
  );
}
