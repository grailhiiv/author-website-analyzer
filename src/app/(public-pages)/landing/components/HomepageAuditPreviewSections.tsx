"use client";

import { useState } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CircleHelpIcon,
  InfoIcon,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Table from "@/components/ui/Table";
import type {
  HomepageAuditPreviewCheck,
  HomepageAuditPreviewSection,
} from "@/lib/reports/homepage-audit-preview";
import type { ReportCheckState } from "@/lib/reports/report-check-view-model";
import ActionLink from "@/components/shared/ActionLink";

const placeholderRows = ["first", "second"] as const;

const moduleCtaLabels: Record<HomepageAuditPreviewSection["category"], string> =
  {
    BRAND_CLARITY: "See all brand clarity checks",
    BOOK_VISIBILITY: "See all book visibility checks",
    READER_ENGAGEMENT: "See all reader engagement checks",
    SEARCH_VISIBILITY: "See all search visibility checks",
    MOBILE_PERFORMANCE: "See all mobile performance checks",
    TECHNICAL_HEALTH: "See all technical health checks",
    AUTHOR_TRUST: "See all author trust checks",
    SITE_USABILITY: "See all site usability checks",
  };

const statusStyles: Record<
  ReportCheckState,
  { className: string; icon: typeof CheckCircle2Icon }
> = {
  PASSED: { icon: CheckCircle2Icon, className: "text-success" },
  NEEDS_REVIEW: { icon: CircleHelpIcon, className: "text-warning" },
  FAILED: { icon: AlertCircleIcon, className: "text-error" },
};

function CheckStatus({ check }: { check: HomepageAuditPreviewCheck }) {
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

function CheckTips({ check }: { check: HomepageAuditPreviewCheck }) {
  return (
    <details className="group mt-3">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-info transition-colors hover:bg-info-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info [&::-webkit-details-marker]:hidden">
        <InfoIcon className="size-4" aria-hidden="true" />
        Tips
      </summary>
      <div className="mt-3 rounded-xl bg-info-subtle p-4 text-sm leading-6 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
        <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Recommended Fix
        </p>
        <p>{check.recommendation}</p>
      </div>
    </details>
  );
}

function InspectedPageLink({ check }: { check: HomepageAuditPreviewCheck }) {
  if (!check.inspectedPageUrl) {
    return null;
  }

  return (
    <ActionLink
      className="mt-2 inline-flex break-all text-xs font-medium"
      href={check.inspectedPageUrl}
      rel="noreferrer"
      target="_blank"
    >
      Inspected page: {check.inspectedPageUrl}
    </ActionLink>
  );
}

function DesktopAuditTable({
  section,
}: {
  section: HomepageAuditPreviewSection;
}) {
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  return (
    <div className="hidden lg:block">
      <Table compact hoverable={false} className="w-full table-fixed">
        <Table.THead>
          <Table.Tr>
            <Table.Th className="w-[24%] px-5 py-4 text-left text-xs font-semibold text-gray-500">
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
          {section.checks.map((check) => {
            const isTipsExpanded = expandedCheckId === check.id;
            const tipsId = `homepage-check-tips-${check.id.replaceAll(
              /[^a-zA-Z0-9_-]/g,
              "-",
            )}`;

            return (
              <Table.Tr
                key={check.id}
                className="border-t border-gray-200 dark:border-gray-700"
              >
                <Table.Td className="px-5 py-4 align-top text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {check.title}
                </Table.Td>
                <Table.Td className="px-5 py-4 align-top">
                  <CheckStatus check={check} />
                </Table.Td>
                <Table.Td className="px-5 py-4 align-top text-sm leading-6 text-gray-600 dark:text-gray-300">
                  <p>{check.details}</p>
                  <InspectedPageLink check={check} />
                  {isTipsExpanded ? (
                    <div
                      id={tipsId}
                      role="region"
                      aria-label={`Recommended fix for ${check.title}`}
                      className="mt-4 rounded-xl bg-info-subtle p-4 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                        Recommended Fix
                      </p>
                      <p>{check.recommendation}</p>
                    </div>
                  ) : null}
                </Table.Td>
                <Table.Td className="px-5 py-3 text-right align-top">
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-info transition-colors hover:bg-info-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
                    aria-expanded={isTipsExpanded}
                    aria-controls={tipsId}
                    aria-label={`${isTipsExpanded ? "Hide" : "Show"} tips for ${check.title}`}
                    onClick={() =>
                      setExpandedCheckId(isTipsExpanded ? null : check.id)
                    }
                  >
                    <InfoIcon className="size-4" aria-hidden="true" />
                    Tips
                  </button>
                </Table.Td>
              </Table.Tr>
            );
          })}
          {placeholderRows.map((row) => (
            <Table.Tr
              key={`${section.category}-${row}-placeholder`}
              className="border-t border-gray-200 opacity-55 dark:border-gray-700"
            >
              <Table.Td className="px-5 py-5 align-top">
                <span className="sr-only">
                  Additional check available in the full audit report
                </span>
                <span aria-hidden="true">
                  <Skeleton animation={false} height={14} width="72%" />
                </span>
              </Table.Td>
              <Table.Td className="px-5 py-5 align-top">
                <div className="flex items-center gap-2" aria-hidden="true">
                  <Skeleton
                    animation={false}
                    variant="circle"
                    height={16}
                    width={16}
                  />
                  <Skeleton animation={false} height={14} width={64} />
                </div>
              </Table.Td>
              <Table.Td className="space-y-2 px-5 py-5 align-top">
                <div className="space-y-2" aria-hidden="true">
                  <Skeleton animation={false} height={14} width="92%" />
                  <Skeleton animation={false} height={14} width="62%" />
                </div>
              </Table.Td>
              <Table.Td className="px-5 py-5 align-top">
                <div aria-hidden="true">
                  <Skeleton
                    animation={false}
                    className="ml-auto"
                    height={14}
                    width={52}
                  />
                </div>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.TBody>
      </Table>
    </div>
  );
}

function MobileAuditList({
  section,
}: {
  section: HomepageAuditPreviewSection;
}) {
  return (
    <div className="divide-y divide-gray-200 lg:hidden dark:divide-gray-700">
      {section.checks.map((check) => (
        <div key={check.id} className="space-y-3 px-4 py-5">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {check.title}
            </p>
            <CheckStatus check={check} />
          </div>
          <div className="text-sm leading-6 text-gray-600 dark:text-gray-300">
            <p>{check.details}</p>
            <InspectedPageLink check={check} />
            <CheckTips check={check} />
          </div>
        </div>
      ))}
      {placeholderRows.map((row) => (
        <div
          key={`${section.category}-${row}-mobile-placeholder`}
          className="space-y-4 px-4 py-5 opacity-55"
        >
          <span className="sr-only">
            Additional check available in the full audit report
          </span>
          <div className="flex items-center justify-between gap-4">
            <span className="w-[52%]" aria-hidden="true">
              <Skeleton animation={false} height={14} />
            </span>
            <div className="flex items-center gap-2" aria-hidden="true">
              <Skeleton
                animation={false}
                variant="circle"
                height={16}
                width={16}
              />
              <Skeleton animation={false} height={14} width={58} />
            </div>
          </div>
          <div className="space-y-2" aria-hidden="true">
            <Skeleton animation={false} height={14} width="94%" />
            <Skeleton animation={false} height={14} width="68%" />
          </div>
          <span aria-hidden="true">
            <Skeleton animation={false} height={14} width={52} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function HomepageAuditPreviewSections({
  sections,
}: {
  sections: HomepageAuditPreviewSection[];
}) {
  return (
    <section aria-label="Homepage website check preview" className="space-y-6">
      {sections.map((section) => {
        const sectionHeadingId = `audit-section-${section.category.toLowerCase()}`;

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
              <DesktopAuditTable section={section} />
              <MobileAuditList section={section} />
              <div className="flex justify-center border-t border-gray-200 px-4 py-6 dark:border-gray-700">
                <span className="inline-flex min-h-12 items-center justify-center rounded-full border border-gray-500 bg-white px-8 text-center text-sm font-semibold text-gray-900 sm:text-base dark:border-gray-500 dark:bg-gray-900 dark:text-white">
                  {moduleCtaLabels[section.category]}
                </span>
              </div>
            </Card>
          </div>
        );
      })}
    </section>
  );
}
