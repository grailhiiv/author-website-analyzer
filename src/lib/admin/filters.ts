import { Prisma, ReportStatus } from "@/generated/prisma/client";
import {
  type AuthorType,
  authorTypes,
  type WebsiteGoal,
  websiteGoals,
} from "@/lib/analyzer/options";

export type AdminSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type AdminFilters = {
  authorType: "all" | AuthorType;
  scoreRange: "all" | ScoreRangeValue;
  status: "all" | ReportStatus;
  website: string;
  websiteGoal: "all" | WebsiteGoal;
};

type ScoreRangeValue = "0-49" | "50-69" | "70-84" | "85-100";

export const allFilterValue = "all";

export const scoreRangeOptions: Array<{
  label: string;
  value: AdminFilters["scoreRange"];
}> = [
  { value: "all", label: "Any score" },
  { value: "0-49", label: "0-49" },
  { value: "50-69", label: "50-69" },
  { value: "70-84", label: "70-84" },
  { value: "85-100", label: "85-100" },
];

const scoreRanges: Record<
  ScoreRangeValue,
  Prisma.IntNullableFilter<"Report">
> = {
  "0-49": { gte: 0, lte: 49 },
  "50-69": { gte: 50, lte: 69 },
  "70-84": { gte: 70, lte: 84 },
  "85-100": { gte: 85, lte: 100 },
};

const reportStatuses = Object.values(ReportStatus);
const authorTypeValues = authorTypes.map((option) => option.value);
const websiteGoalValues = websiteGoals.map((option) => option.value);
const scoreRangeValues = scoreRangeOptions
  .map((option) => option.value)
  .filter((value): value is ScoreRangeValue => value !== "all");

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isReportStatus(value: string): value is ReportStatus {
  return reportStatuses.includes(value as ReportStatus);
}

function isAuthorType(value: string): value is AuthorType {
  return authorTypeValues.includes(value as AuthorType);
}

function isWebsiteGoal(value: string): value is WebsiteGoal {
  return websiteGoalValues.includes(value as WebsiteGoal);
}

function isScoreRange(value: string): value is ScoreRangeValue {
  return scoreRangeValues.includes(value as ScoreRangeValue);
}

export function parseAdminFilters(params: AdminSearchParams): AdminFilters {
  const status = firstParam(params.status);
  const authorType = firstParam(params.authorType);
  const websiteGoal = firstParam(params.websiteGoal);
  const scoreRange = firstParam(params.scoreRange);
  const website = firstParam(params.website);

  return {
    status: status && isReportStatus(status) ? status : "all",
    authorType: authorType && isAuthorType(authorType) ? authorType : "all",
    websiteGoal:
      websiteGoal && isWebsiteGoal(websiteGoal) ? websiteGoal : "all",
    scoreRange:
      scoreRange && isScoreRange(scoreRange) ? scoreRange : "all",
    website: website?.trim() ?? "",
  };
}

export function buildReportWhere(filters: AdminFilters) {
  const where: Prisma.ReportWhereInput = {};

  if (filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters.authorType !== "all") {
    where.authorType = filters.authorType;
  }

  if (filters.websiteGoal !== "all") {
    where.websiteGoal = filters.websiteGoal;
  }

  if (filters.scoreRange !== "all") {
    where.overallScore = scoreRanges[filters.scoreRange];
  }

  if (filters.website) {
    where.OR = [
      { url: { contains: filters.website, mode: "insensitive" } },
      { normalizedUrl: { contains: filters.website, mode: "insensitive" } },
      { domain: { contains: filters.website, mode: "insensitive" } },
    ];
  }

  return where;
}

export function buildLeadWhere(filters: AdminFilters) {
  const where: Prisma.LeadWhereInput = {};
  const reportWhere: Prisma.ReportWhereInput = {};

  if (filters.authorType !== "all") {
    where.authorType = filters.authorType;
  }

  if (filters.websiteGoal !== "all") {
    where.websiteGoal = filters.websiteGoal;
  }

  if (filters.website) {
    where.websiteUrl = {
      contains: filters.website,
      mode: "insensitive",
    };
  }

  if (filters.status !== "all") {
    reportWhere.status = filters.status;
  }

  if (filters.scoreRange !== "all") {
    reportWhere.overallScore = scoreRanges[filters.scoreRange];
  }

  if (Object.keys(reportWhere).length > 0) {
    where.report = { is: reportWhere };
  }

  return where;
}
