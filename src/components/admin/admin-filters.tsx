import { SearchIcon } from "lucide-react";

import {
  AdminPanel,
  AdminPanelContent,
  AdminPanelHeader,
} from "@/components/admin/admin-panel";
import { Badge, Button, Input, Select } from "@/components/admin/admin-ui";
import { ReportStatus } from "@/generated/prisma/client";
import { authorTypes, websiteGoals } from "@/lib/analyzer/options";
import {
  type AdminFilters,
  allFilterValue,
  scoreRangeOptions,
} from "@/lib/admin/filters";
import {
  formatAuthorType,
  formatWebsiteGoal,
  reportStatusLabels,
} from "@/lib/admin/display";

type AdminFiltersProps = {
  filters: AdminFilters;
  resetHref: string;
};

function getActiveFilters(filters: AdminFilters) {
  const activeFilters: string[] = [];

  if (filters.website) {
    activeFilters.push(`Website: ${filters.website}`);
  }

  if (filters.status !== "all") {
    activeFilters.push(`Status: ${reportStatusLabels[filters.status]}`);
  }

  if (filters.authorType !== "all") {
    activeFilters.push(`Author: ${formatAuthorType(filters.authorType)}`);
  }

  if (filters.scoreRange !== "all") {
    activeFilters.push(`Score: ${filters.scoreRange}`);
  }

  if (filters.websiteGoal !== "all") {
    activeFilters.push(`Goal: ${formatWebsiteGoal(filters.websiteGoal)}`);
  }

  return activeFilters;
}

export function AdminFiltersCard({ filters, resetHref }: AdminFiltersProps) {
  const activeFilters = getActiveFilters(filters);

  return (
    <AdminPanel>
      <AdminPanelHeader
        eyebrow="Dataset controls"
        title="Search and filter"
        description="Narrow the admin view by status, author type, score, goal, or website."
        action={
          activeFilters.length > 0 ? (
            <Badge color="blue">{activeFilters.length} active</Badge>
          ) : (
            <Badge>All records</Badge>
          )
        }
      />
      <AdminPanelContent className="space-y-4 p-5">
        <form className="grid gap-3 lg:grid-cols-6" method="get">
          <div className="flex flex-col gap-2 lg:col-span-2">
            <label className="text-sm font-medium" htmlFor="website">
              Website
            </label>
            <Input
              id="website"
              name="website"
              placeholder="example.com"
              defaultValue={filters.website}
              autoCapitalize="none"
              autoComplete="url"
              inputMode="url"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="status">
              Status
            </label>
            <Select id="status" name="status" defaultValue={filters.status}>
                  <option value={allFilterValue}>Any status</option>
                  {Object.values(ReportStatus).map((status) => (
                    <option key={status} value={status}>
                      {reportStatusLabels[status]}
                    </option>
                  ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="authorType">
              Author type
            </label>
            <Select id="authorType" name="authorType" defaultValue={filters.authorType}>
                  <option value={allFilterValue}>
                    Any author type
                  </option>
                  {authorTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="scoreRange">
              Score range
            </label>
            <Select id="scoreRange" name="scoreRange" defaultValue={filters.scoreRange}>
                  {scoreRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="websiteGoal">
              Website goal
            </label>
            <Select id="websiteGoal" name="websiteGoal" defaultValue={filters.websiteGoal}>
                  <option value={allFilterValue}>Any goal</option>
                  {websiteGoals.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end lg:col-span-6">
            <Button type="submit" color="dark/zinc" className="w-full sm:w-auto">
              <SearchIcon data-slot="icon" />
              Apply filters
            </Button>
            <Button outline href={resetHref} className="w-full sm:w-auto">
              Reset
            </Button>
          </div>
        </form>
        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
            {activeFilters.map((filter) => (
              <Badge key={filter}>
                {filter}
              </Badge>
            ))}
          </div>
        ) : null}
      </AdminPanelContent>
    </AdminPanel>
  );
}
