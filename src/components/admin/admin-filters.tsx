import { SearchIcon } from "lucide-react";

import {
  AdminPanel,
  AdminPanelContent,
  AdminPanelHeader,
} from "@/components/admin/admin-panel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
            <Badge variant="secondary">{activeFilters.length} active</Badge>
          ) : (
            <Badge variant="outline">All records</Badge>
          )
        }
      />
      <AdminPanelContent className="space-y-4 pt-4">
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
            <Select name="status" defaultValue={filters.status}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={allFilterValue}>Any status</SelectItem>
                  {Object.values(ReportStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {reportStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="authorType">
              Author type
            </label>
            <Select name="authorType" defaultValue={filters.authorType}>
              <SelectTrigger id="authorType" className="w-full">
                <SelectValue placeholder="Any author type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={allFilterValue}>
                    Any author type
                  </SelectItem>
                  {authorTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="scoreRange">
              Score range
            </label>
            <Select name="scoreRange" defaultValue={filters.scoreRange}>
              <SelectTrigger id="scoreRange" className="w-full">
                <SelectValue placeholder="Any score" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {scoreRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="websiteGoal">
              Website goal
            </label>
            <Select name="websiteGoal" defaultValue={filters.websiteGoal}>
              <SelectTrigger id="websiteGoal" className="w-full">
                <SelectValue placeholder="Any goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={allFilterValue}>Any goal</SelectItem>
                  {websiteGoals.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end lg:col-span-6">
            <Button type="submit" className="w-full sm:w-auto">
              <SearchIcon data-icon="inline-start" />
              Apply filters
            </Button>
            <a
              className={buttonVariants({
                variant: "outline",
                className: "w-full sm:w-auto",
              })}
              href={resetHref}
            >
              Reset
            </a>
          </div>
        </form>
        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-dashed pt-4">
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="outline">
                {filter}
              </Badge>
            ))}
          </div>
        ) : null}
      </AdminPanelContent>
    </AdminPanel>
  );
}
