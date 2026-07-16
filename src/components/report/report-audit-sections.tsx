"use client";

import { useState } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CircleHelpIcon,
  ExternalLinkIcon,
  InfoIcon,
} from "lucide-react";

import { Button, Card } from "@/components/report/report-ui";
import Table from "@/components/ui/Table";
import type {
  ReportAuditSectionViewModel,
  ReportCheckState,
  ReportCheckViewModel,
} from "@/lib/reports/report-check-view-model";

const statusStyles: Record<
  ReportCheckState,
  { icon: typeof CheckCircle2Icon; className: string }
> = {
  PASSED: { icon: CheckCircle2Icon, className: "text-success" },
  NEEDS_REVIEW: { icon: CircleHelpIcon, className: "text-warning" },
  FAILED: { icon: AlertCircleIcon, className: "text-error" },
};

function Status({ check }: { check: ReportCheckViewModel }) {
  const status = statusStyles[check.state];
  const Icon = status.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-semibold ${status.className}`}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {check.statusLabel}
    </span>
  );
}

function evidenceLabel(href: string) {
  try {
    const url = new URL(href);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return href;
  }
}

function InlineEvidenceLinks({ check }: { check: ReportCheckViewModel }) {
  if (check.evidenceLinks.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {check.evidenceLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          title={link.href}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <span className="truncate">{evidenceLabel(link.href)}</span>
          <ExternalLinkIcon className="size-3 shrink-0" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

function InlineTips({ check }: { check: ReportCheckViewModel }) {
  return (
    <div className="mt-4 rounded-xl bg-info-subtle p-4 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
      <p className="text-sm leading-6">{check.recommendation}</p>
    </div>
  );
}

function AuditTable({
  section,
  showExpandedGuidance,
  expandedCheckId,
  onToggleTips,
  onSectionAction,
}: {
  section: ReportAuditSectionViewModel;
  showExpandedGuidance: boolean;
  expandedCheckId: string | null;
  onToggleTips: (checkId: string) => void;
  onSectionAction: () => void;
}) {
  const checks = section.checks;

  return (
    <>
      <div className="hidden lg:block">
        <Table compact hoverable={false} className="w-full table-fixed">
          <Table.THead>
            <Table.Tr>
              <Table.Th className="w-[20%] px-5 py-4 text-left text-xs font-semibold text-gray-500">
                Check
              </Table.Th>
              <Table.Th className="w-[18%] px-5 py-4 text-left text-xs font-semibold text-gray-500">
                Status
              </Table.Th>
              <Table.Th className="px-5 py-4 text-left text-xs font-semibold text-gray-500">
                Details
              </Table.Th>
              <Table.Th className="w-[110px] px-5 py-4">
                <span className="sr-only">Tips</span>
              </Table.Th>
            </Table.Tr>
          </Table.THead>
          <Table.TBody>
            {checks.map((check) => {
              const isTipsExpanded = expandedCheckId === check.id;
              const tipsId = `check-tips-${check.id.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;

              return (
                <Table.Tr
                  key={check.id}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <Table.Td className="px-5 py-4 align-top text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {check.title}
                  </Table.Td>
                  <Table.Td className="px-5 py-4 align-top">
                    <Status check={check} />
                  </Table.Td>
                  <Table.Td className="px-5 py-4 align-top text-sm leading-6 text-gray-600 dark:text-gray-300">
                    <p>{check.details}</p>
                    {isTipsExpanded ? (
                      <div
                        id={tipsId}
                        role="region"
                        aria-label={`Tips for ${check.title}`}
                      >
                        <InlineTips check={check} />
                      </div>
                    ) : null}
                    {showExpandedGuidance ? (
                      <InlineEvidenceLinks check={check} />
                    ) : null}
                  </Table.Td>
                  <Table.Td className="px-5 py-3 text-right align-top">
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-info hover:text-info"
                      icon={<InfoIcon className="size-4" aria-hidden="true" />}
                      aria-expanded={isTipsExpanded}
                      aria-controls={tipsId}
                      aria-label={`${isTipsExpanded ? "Hide" : "Show"} tips for ${check.title}`}
                      onClick={() => onToggleTips(check.id)}
                    >
                      Tips
                    </Button>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.TBody>
        </Table>
      </div>

      {showExpandedGuidance ? (
        <div className="flex justify-end border-b border-gray-200 px-4 py-4 lg:hidden dark:border-gray-700">
          <Button
            size="sm"
            className="rounded-full px-5"
            aria-label={`Improve your ${section.title}`}
            onClick={onSectionAction}
          >
            Improve Your {section.title}
          </Button>
        </div>
      ) : null}

      <div className="divide-y divide-gray-200 lg:hidden dark:divide-gray-700">
        {checks.map((check) => {
          const isTipsExpanded = expandedCheckId === check.id;
          const tipsId = `mobile-check-tips-${check.id.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;

          return (
            <div key={check.id} className="space-y-3 px-4 py-5">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {check.title}
                </p>
                <Status check={check} />
              </div>
              <div className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                <p>{check.details}</p>
                {isTipsExpanded ? (
                  <div
                    id={tipsId}
                    role="region"
                    aria-label={`Tips for ${check.title}`}
                  >
                    <InlineTips check={check} />
                  </div>
                ) : null}
                {showExpandedGuidance ? (
                  <InlineEvidenceLinks check={check} />
                ) : null}
              </div>
              <Button
                size="xs"
                variant="ghost"
                className="self-start text-info hover:text-info"
                icon={<InfoIcon className="size-4" aria-hidden="true" />}
                aria-expanded={isTipsExpanded}
                aria-controls={tipsId}
                aria-label={`${isTipsExpanded ? "Hide" : "Show"} tips for ${check.title}`}
                onClick={() => onToggleTips(check.id)}
              >
                Tips
              </Button>
            </div>
          );
        })}
      </div>

      {showExpandedGuidance ? (
        <div className="flex justify-center border-t border-gray-200 px-4 py-5 dark:border-gray-700">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full px-6"
            onClick={onSectionAction}
          >
            Review {section.title} recommendations
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function ReportAuditSections({
  sections,
  showExpandedGuidance = false,
}: {
  sections: ReportAuditSectionViewModel[];
  showExpandedGuidance?: boolean;
}) {
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const handleToggleTips = (checkId: string) => {
    setExpandedCheckId((currentCheckId) =>
      currentCheckId === checkId ? null : checkId,
    );
  };

  return (
    <section aria-label="Website checks" className="space-y-6">
      {sections.map((section) => {
        const sectionHeadingId = `audit-section-${section.category.toLowerCase()}`;
        const actionableCheck =
          section.checks.find((check) => check.state === "FAILED") ??
          section.checks.find((check) => check.state === "NEEDS_REVIEW") ??
          section.checks[0] ??
          null;
        const handleSectionAction = () => {
          setExpandedCheckId(actionableCheck?.id ?? null);
        };

        return (
          <div
            key={section.category}
            aria-labelledby={sectionHeadingId}
            className="space-y-5 pt-5 first:pt-0"
          >
            <div className="max-w-5xl">
              <h3
                id={sectionHeadingId}
                className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl dark:text-white"
              >
                {section.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7 dark:text-gray-300">
                {section.description}
              </p>
            </div>

            <Card
              className="overflow-hidden rounded-xl"
              bodyClass="flex flex-col gap-0 p-0"
            >
              <AuditTable
                section={section}
                showExpandedGuidance={showExpandedGuidance}
                expandedCheckId={expandedCheckId}
                onToggleTips={handleToggleTips}
                onSectionAction={handleSectionAction}
              />
            </Card>
          </div>
        );
      })}
    </section>
  );
}
