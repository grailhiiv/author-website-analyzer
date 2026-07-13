import {
  Prisma,
  ReportStatus,
  SalesLeadStatus,
} from "@/generated/prisma/client";

export type AdminSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type AdminFilters = {
  scoreRange: "all" | ScoreRangeValue;
  status: "all" | ReportStatus;
  website: string;
};

export type AdminListPaging = {
  order: "asc" | "desc";
  pageIndex: number;
  pageSize: number;
  sortKey: string;
};

export type ReportListFilters = AdminFilters & AdminListPaging;

export type LeadListFilters = AdminListPaging & {
  consent: "all" | "yes" | "no";
  leadStatus: "all" | SalesLeadStatus;
  website: string;
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
const salesLeadStatuses = Object.values(SalesLeadStatus);
const scoreRangeValues = scoreRangeOptions
  .map((option) => option.value)
  .filter((value): value is ScoreRangeValue => value !== "all");

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isReportStatus(value: string): value is ReportStatus {
  return reportStatuses.includes(value as ReportStatus);
}

function isScoreRange(value: string): value is ScoreRangeValue {
  return scoreRangeValues.includes(value as ScoreRangeValue);
}

function isSalesLeadStatus(value: string): value is SalesLeadStatus {
  return salesLeadStatuses.includes(value as SalesLeadStatus);
}

function parsePaging(params: AdminSearchParams): AdminListPaging {
  const parsedPageIndex = Number.parseInt(firstParam(params.pageIndex) ?? "", 10);
  const parsedPageSize = Number.parseInt(firstParam(params.pageSize) ?? "", 10);
  const order = firstParam(params.order);

  return {
    pageIndex:
      Number.isFinite(parsedPageIndex) && parsedPageIndex > 0
        ? parsedPageIndex
        : 1,
    pageSize: [10, 25, 50, 100].includes(parsedPageSize)
      ? parsedPageSize
      : 10,
    sortKey: firstParam(params.sortKey) ?? "createdAt",
    order: order === "asc" ? "asc" : "desc",
  };
}

export function parseAdminFilters(params: AdminSearchParams): AdminFilters {
  const status = firstParam(params.status);
  const scoreRange = firstParam(params.scoreRange);
  const website = firstParam(params.website);

  return {
    status: status && isReportStatus(status) ? status : "all",
    scoreRange:
      scoreRange && isScoreRange(scoreRange) ? scoreRange : "all",
    website: website?.trim() ?? "",
  };
}

export function parseReportListFilters(
  params: AdminSearchParams,
): ReportListFilters {
  return {
    ...parseAdminFilters(params),
    ...parsePaging(params),
  };
}

export function parseLeadListFilters(
  params: AdminSearchParams,
): LeadListFilters {
  const leadStatus = firstParam(params.leadStatus);
  const consent = firstParam(params.consent);

  return {
    ...parsePaging(params),
    website: firstParam(params.website)?.trim() ?? "",
    leadStatus:
      leadStatus && isSalesLeadStatus(leadStatus) ? leadStatus : "all",
    consent: consent === "yes" || consent === "no" ? consent : "all",
  };
}

export function buildReportWhere(filters: AdminFilters) {
  const where: Prisma.ReportWhereInput = {};

  if (filters.status !== "all") {
    where.status = filters.status;
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

export function buildLeadWhere(filters: LeadListFilters) {
  const where: Prisma.LeadWhereInput = {};

  if (filters.website) {
    where.OR = [
      { fullName: { contains: filters.website, mode: "insensitive" } },
      { email: { contains: filters.website, mode: "insensitive" } },
      { websiteUrl: { contains: filters.website, mode: "insensitive" } },
    ];
  }

  if (filters.consent !== "all") {
    where.consent = filters.consent === "yes";
  }

  if (filters.leadStatus !== "all") {
    where.report = {
      is: {
        salesNote: {
          is: { leadStatus: filters.leadStatus },
        },
      },
    };
  }

  return where;
}
