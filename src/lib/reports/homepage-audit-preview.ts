import type {
  ReportAuditSectionViewModel,
  ReportCheckState,
  ReportCheckViewModel,
} from "@/lib/reports/report-check-view-model";

const HOMEPAGE_PREVIEW_RATIO = 0.25;

const statePriority: Record<ReportCheckState, number> = {
  FAILED: 0,
  NEEDS_REVIEW: 1,
  PASSED: 2,
};

export type HomepageAuditPreviewCheck = Pick<
  ReportCheckViewModel,
  | "details"
  | "id"
  | "inspectedPageUrl"
  | "recommendation"
  | "state"
  | "statusLabel"
  | "title"
>;

export type HomepageAuditPreviewSection = Pick<
  ReportAuditSectionViewModel,
  "category" | "description" | "title"
> & {
  checks: HomepageAuditPreviewCheck[];
  totalCheckCount: number;
};

type IndexedCheck = {
  check: ReportCheckViewModel;
  checkIndex: number;
  key: string;
  sectionIndex: number;
};

function compareChecks(a: IndexedCheck, b: IndexedCheck) {
  return (
    statePriority[a.check.state] - statePriority[b.check.state] ||
    a.sectionIndex - b.sectionIndex ||
    a.checkIndex - b.checkIndex
  );
}

export function buildHomepageAuditPreviewSections(
  sections: readonly ReportAuditSectionViewModel[],
): HomepageAuditPreviewSection[] {
  const candidates = sections.flatMap((section, sectionIndex) =>
    section.checks.map<IndexedCheck>((check, checkIndex) => ({
      check,
      checkIndex,
      key: `${section.category}:${check.id}`,
      sectionIndex,
    })),
  );
  const nonEmptySectionCount = sections.filter(
    (section) => section.checks.length > 0,
  ).length;
  const targetCheckCount = Math.min(
    candidates.length,
    Math.max(
      nonEmptySectionCount,
      Math.ceil(candidates.length * HOMEPAGE_PREVIEW_RATIO),
    ),
  );
  const selectedKeys = new Set<string>();

  sections.forEach((section, sectionIndex) => {
    const representativeCheck = section.checks
      .map<IndexedCheck>((check, checkIndex) => ({
        check,
        checkIndex,
        key: `${section.category}:${check.id}`,
        sectionIndex,
      }))
      .sort(compareChecks)[0];

    if (representativeCheck) {
      selectedKeys.add(representativeCheck.key);
    }
  });

  for (const candidate of candidates.toSorted(compareChecks)) {
    if (selectedKeys.size >= targetCheckCount) {
      break;
    }

    selectedKeys.add(candidate.key);
  }

  return sections
    .map((section) => ({
      category: section.category,
      title: section.title,
      description: section.description,
      totalCheckCount: section.checks.length,
      checks: section.checks
        .filter((check) => selectedKeys.has(`${section.category}:${check.id}`))
        .map(
          ({
            details,
            id,
            inspectedPageUrl,
            recommendation,
            state,
            statusLabel,
            title,
          }) => ({
            details,
            id,
            inspectedPageUrl,
            recommendation,
            state,
            statusLabel,
            title,
          }),
        ),
    }))
    .filter((section) => section.checks.length > 0);
}
