import {
  FindingSeverity,
  ReportCategory,
  ReportStatus,
  SalesLeadStatus,
} from "@/generated/prisma/client";
import { authorTypes, websiteGoals } from "@/lib/analyzer/options";

export const reportStatusLabels: Record<ReportStatus, string> = {
  QUEUED: "Queued",
  RUNNING: "Running",
  COMPLETE: "Complete",
  FAILED: "Failed",
};

export const categoryLabels: Record<ReportCategory, string> = {
  BRAND_CLARITY: "Brand Clarity",
  BOOK_VISIBILITY: "Book Visibility",
  READER_ENGAGEMENT: "Reader Engagement",
  SEARCH_VISIBILITY: "Search Visibility",
  MOBILE_PERFORMANCE: "Mobile Performance",
  TECHNICAL_HEALTH: "Technical Health",
  AUTHOR_TRUST: "Author Trust",
  SITE_USABILITY: "Site Usability",
};

export const findingSeverityLabels: Record<FindingSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const salesLeadStatusLabels: Record<SalesLeadStatus, string> = {
  NEW: "New",
  REVIEWED: "Reviewed",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  NOT_A_FIT: "Not a Fit",
  CONVERTED: "Converted",
};

export const priorityOptions = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Normal" },
  { value: 4, label: "High" },
  { value: 5, label: "Urgent" },
] as const;

const authorTypeLabels = new Map<string, string>(
  authorTypes.map((option) => [option.value, option.label])
);

const websiteGoalLabels = new Map<string, string>(
  websiteGoals.map((option) => [option.value, option.label])
);

export function formatAuthorType(value: string) {
  return authorTypeLabels.get(value) ?? value;
}

export function formatWebsiteGoal(value: string) {
  return websiteGoalLabels.get(value) ?? value;
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

export function formatScore(score: number | null) {
  return score === null ? "Not scored" : `${score}/100`;
}

export function statusBadgeVariant(status: ReportStatus) {
  if (status === ReportStatus.COMPLETE) {
    return "secondary" as const;
  }

  if (status === ReportStatus.FAILED) {
    return "destructive" as const;
  }

  return "outline" as const;
}

export function statusBadgeColor(status: ReportStatus) {
  if (status === ReportStatus.COMPLETE) {
    return "green" as const;
  }

  if (status === ReportStatus.FAILED) {
    return "red" as const;
  }

  if (status === ReportStatus.RUNNING) {
    return "blue" as const;
  }

  return "zinc" as const;
}

export function severityBadgeVariant(severity: FindingSeverity) {
  if (
    severity === FindingSeverity.CRITICAL ||
    severity === FindingSeverity.HIGH
  ) {
    return "destructive" as const;
  }

  if (severity === FindingSeverity.MEDIUM) {
    return "secondary" as const;
  }

  return "outline" as const;
}

export function severityBadgeColor(severity: FindingSeverity) {
  if (severity === FindingSeverity.CRITICAL || severity === FindingSeverity.HIGH) {
    return "red" as const;
  }

  if (severity === FindingSeverity.MEDIUM) {
    return "amber" as const;
  }

  return "zinc" as const;
}

export function formatPriority(priority: number | null | undefined) {
  if (priority === null || priority === undefined) {
    return "Not set";
  }

  return (
    priorityOptions.find((option) => option.value === priority)?.label ??
    `Priority ${priority}`
  );
}
