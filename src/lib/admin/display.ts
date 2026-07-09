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
  BRAND_CLARITY: "First Impression and Author Brand Clarity",
  BOOK_PROMOTION: "Book Promotion and Sales Readiness",
  READER_CONVERSION: "Reader Conversion and Newsletter Growth",
  SEO_DISCOVERABILITY: "SEO Discoverability",
  MOBILE_ACCESSIBILITY: "Mobile Experience and Accessibility",
  PERFORMANCE_HEALTH: "Performance and Technical Health",
  TRUST_CREDIBILITY: "Trust and Credibility",
  MAINTENANCE_RISK: "Maintenance and Website Risk",
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

export function formatPriority(priority: number | null | undefined) {
  if (priority === null || priority === undefined) {
    return "Not set";
  }

  return (
    priorityOptions.find((option) => option.value === priority)?.label ??
    `Priority ${priority}`
  );
}
