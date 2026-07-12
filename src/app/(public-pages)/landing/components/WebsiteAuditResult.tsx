import {
  AlertCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  LockIcon,
} from "lucide-react";

import {
  FindingSeverity,
  ReportStatus,
  type ReportCategory,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  reportCategoryDisplay,
  reportCategoryOrder,
} from "@/lib/reports/category-display";
import { getDisplayDomain, getReportPath } from "@/lib/reports/domain";
import { ReportStatusPoller } from "@/app/report/[id]/report-status-poller";
import { UnlockReportForm } from "@/app/report/[id]/unlock-report-form";
import { WebsitePreviewTabs } from "@/app/(public-pages)/landing/components/WebsitePreviewTabs";

import styles from "./WebsiteAuditResult.module.css";

const categoryNavigation: Record<
  ReportCategory,
  { id: string; label: string }
> = {
  BRAND_CLARITY: { id: "brand-clarity", label: "Brand clarity" },
  BOOK_VISIBILITY: { id: "book-visibility", label: "Book visibility" },
  READER_ENGAGEMENT: {
    id: "reader-engagement",
    label: "Reader engagement",
  },
  SEARCH_VISIBILITY: {
    id: "search-visibility",
    label: "Search visibility",
  },
  MOBILE_PERFORMANCE: {
    id: "mobile-performance",
    label: "Mobile performance",
  },
  TECHNICAL_HEALTH: {
    id: "technical-health",
    label: "Technical health",
  },
  AUTHOR_TRUST: {
    id: "author-trust",
    label: "Author trust",
  },
  SITE_USABILITY: {
    id: "site-usability",
    label: "Site usability",
  },
};

const wideCategories = new Set<ReportCategory>([
  "BRAND_CLARITY",
  "SEARCH_VISIBILITY",
]);

function scoreColor(score: number) {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#ca8a04";
  return "#dc2626";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function WebsiteAuditResult({
  domain,
}: {
  domain: string;
}) {
  const report = await prisma.report.findFirst({
    where: { domain },
    orderBy: { createdAt: "desc" },
    include: {
      findings: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
      scores: true,
      lead: {
        select: { email: true },
      },
      analysisJob: {
        select: {
          progress: true,
          stage: true,
        },
      },
      pagesScanned: {
        where: { pageType: "HOME" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          screenshotUrl: true,
          mobileScreenshotUrl: true,
        },
      },
    },
  });

  if (!report) {
    return (
      <section
        id="website-audit-result"
        className="scroll-mt-24 border-y border-gray-200 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-950"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
            Overview for {domain}
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            No saved scan was found for this domain. Enter the website above to
            start a new review.
          </p>
        </div>
      </section>
    );
  }

  const findingsByCategory = new Map<ReportCategory, number>();
  report.findings.forEach((finding) => {
    findingsByCategory.set(
      finding.category,
      (findingsByCategory.get(finding.category) ?? 0) + 1,
    );
  });
  const reportPath = getReportPath(report.domain);
  const isComplete = report.status === ReportStatus.COMPLETE;
  const isUnlocked = Boolean(report.lead?.email);
  const progress = report.analysisJob?.progress ?? 0;
  const stage = report.analysisJob?.stage ?? "QUEUED";
  const highPriorityIssueCount = report.findings.filter(
    (finding) =>
      finding.severity === FindingSeverity.CRITICAL ||
      finding.severity === FindingSeverity.HIGH,
  ).length;
  const otherIssueCount = report.findings.length - highPriorityIssueCount;
  const homepageScreenshot = report.pagesScanned[0];
  const screenshotVersion = (report.completedAt ?? report.updatedAt).getTime();
  const addScreenshotVersion = (url: string | null) =>
    url ? `${url}${url.includes("?") ? "&" : "?"}v=${screenshotVersion}` : null;
  const desktopScreenshotUrl = addScreenshotVersion(
    homepageScreenshot?.screenshotUrl ?? null,
  );
  const mobileScreenshotUrl = addScreenshotVersion(
    homepageScreenshot?.mobileScreenshotUrl ??
      (homepageScreenshot?.screenshotUrl?.includes("homepage-desktop.png")
        ? homepageScreenshot.screenshotUrl.replace(
            "homepage-desktop.png",
            "homepage-mobile.png",
          )
        : null),
  );

  return (
    <section
      id="website-audit-result"
      className="relative z-20 scroll-mt-20 border-y border-gray-200 bg-white py-16 sm:py-20 dark:border-gray-800 dark:bg-gray-900"
    >
      {(report.status === ReportStatus.QUEUED ||
        report.status === ReportStatus.RUNNING) && (
        <ReportStatusPoller
          progress={progress}
          reportId={report.id}
          stage={stage}
          status={report.status}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pb-8 dark:border-gray-800">
          <div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <ClockIcon className="size-4" aria-hidden="true" />
                {formatDate(report.completedAt ?? report.createdAt)}
              </span>
              <h2 className="mt-3 max-w-5xl text-3xl font-bold tracking-[-0.035em] text-gray-950 sm:text-4xl lg:text-5xl dark:text-white">
                <a
                  href={report.normalizedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-blue-600 decoration-2 underline-offset-4 transition-colors hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {getDisplayDomain(report.domain)}
                  <ExternalLinkIcon
                    className="ml-1 inline size-[0.48em] align-super"
                    aria-hidden="true"
                  />
                </a>
              </h2>
              {isComplete ? (
                <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600 dark:text-gray-300">
                  This author website scored{" "}
                  <strong className="font-semibold text-gray-950 dark:text-white">
                    {report.overallScore ?? 0} out of 100
                  </strong>
                  . We found{" "}
                  <strong className="font-semibold text-gray-950 dark:text-white">
                    {highPriorityIssueCount}{" "}
                    {highPriorityIssueCount === 1
                      ? "high-priority issue"
                      : "high-priority issues"}
                  </strong>{" "}
                  and{" "}
                  <strong className="font-semibold text-gray-950 dark:text-white">
                    {otherIssueCount}{" "}
                    {otherIssueCount === 1 ? "other issue" : "other issues"}
                  </strong>{" "}
                  affecting book visibility, reader engagement, search
                  visibility, and website health.
                </p>
              ) : (
                <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
                  The report is being built using the pages, content, and
                  signals found on this website.
                </p>
              )}
            </div>
          </div>

          {isComplete && (
            <nav aria-label="Scorecard modules" className="mt-7">
              <ul className="flex flex-wrap gap-2">
                <li>
                  <a
                    href="#overview"
                    className="inline-flex min-h-9 items-center rounded-full border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                  >
                    Overview
                  </a>
                </li>
                {reportCategoryOrder.map((category) => (
                  <li key={category}>
                    <a
                      href={`#${categoryNavigation[category].id}`}
                      className="inline-flex min-h-9 items-center rounded-full border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                    >
                      {reportCategoryDisplay[category].title}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#issues-and-recommendations"
                    className="inline-flex min-h-9 items-center rounded-full border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                  >
                    Recommendations
                  </a>
                </li>
              </ul>
            </nav>
          )}
        </div>

        {!isComplete ? (
          <div className="py-14">
            {report.status === ReportStatus.FAILED ? (
              <div className="flex max-w-2xl items-start gap-4">
                <AlertCircleIcon
                  className="mt-1 size-6 shrink-0 text-red-500"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-950 dark:text-white">
                    We could not complete this scan
                  </h3>
                  <p className="mt-2 leading-7 text-gray-600 dark:text-gray-300">
                    {report.errorMessage ??
                      "The website may be unavailable or blocking inspection. Please check the URL and try again."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl text-center">
                <h3 className="text-xl font-semibold text-gray-950 sm:text-2xl dark:text-white">
                  Just a moment — we&apos;re analyzing your website.
                </h3>
                <div
                  className="relative mt-8 h-8 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
                  role="progressbar"
                  aria-label="Website analysis progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-950 dark:text-white">
                    {progress}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div id="overview" className="scroll-mt-24 py-10">
              <article className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-8 max-w-3xl">
                  <h3 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
                    Overview
                  </h3>
                  <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
                    A concise view of how this website supports the author,
                    their books, and their readers, with the strongest
                    opportunities surfaced first.
                  </p>
                </div>
                <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[190px_minmax(0,1fr)_340px] xl:gap-7">
                  <div className="flex flex-col items-center justify-center text-center lg:border-r lg:border-gray-200 lg:pr-8 dark:lg:border-gray-800">
                    <div
                      className="grid size-40 place-items-center rounded-full p-3"
                      style={{
                        background: `conic-gradient(${scoreColor(report.overallScore ?? 0)} ${(report.overallScore ?? 0) * 3.6}deg, #e5e7eb 0deg)`,
                      }}
                    >
                      <div className="grid size-full place-items-center rounded-full bg-white dark:bg-gray-900">
                        <div>
                          <span className="block text-5xl font-bold text-gray-950 dark:text-white">
                            {report.overallScore ?? "--"}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            out of 100
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      Deterministic score based on observable website signals.
                    </p>
                  </div>

                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Scan overview
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
                      A clear starting point for improving {report.domain}
                    </h3>
                    <p className="mt-3 max-w-3xl leading-7 text-gray-600 dark:text-gray-300">
                      The overall score brings eight author-focused checks
                      together. Each check appears as its own report module
                      below so strengths, risks, and next priorities are easier
                      to review.
                    </p>
                    <div className="mt-6 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-700">
                        <span className="block text-2xl font-bold text-gray-950 dark:text-white">
                          8
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          audit modules
                        </span>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-700">
                        <span className="block text-2xl font-bold text-gray-950 dark:text-white">
                          {report.findings.length}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          signals flagged
                        </span>
                      </div>
                      <div className="col-span-2 rounded-xl bg-gray-50 px-4 py-3 sm:col-span-1 dark:bg-gray-700">
                        <span className="block text-2xl font-bold text-gray-950 dark:text-white">
                          1
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          top priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2 xl:col-span-1">
                    <WebsitePreviewTabs
                      desktopScreenshotUrl={desktopScreenshotUrl}
                      domain={report.domain}
                      mobileScreenshotUrl={mobileScreenshotUrl}
                    />
                  </div>
                </div>
              </article>
            </div>

            <div className="grid gap-6 py-10 lg:grid-cols-2">
              {reportCategoryOrder.map((category) => {
                const findingCount = findingsByCategory.get(category) ?? 0;

                return (
                  <article
                    key={category}
                    id={categoryNavigation[category].id}
                    className={`scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 dark:border-gray-700 dark:bg-gray-800 ${
                      wideCategories.has(category) ? "lg:col-span-2" : ""
                    }`}
                  >
                    <h3 className="text-xl font-semibold text-gray-950 sm:text-2xl dark:text-white">
                      {reportCategoryDisplay[category].title}
                    </h3>
                    <p className="mt-3 max-w-4xl leading-7 text-gray-600 dark:text-gray-300">
                      {reportCategoryDisplay[category].description}
                    </p>

                    <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {findingCount} {findingCount === 1 ? "item" : "items"}{" "}
                        flagged in this module
                      </span>
                      <span className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <LockIcon className="size-4" aria-hidden="true" />
                        Detailed recommendations in the full report
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div
              id="issues-and-recommendations"
              className="scroll-mt-24 border-t border-gray-200 py-10 dark:border-gray-800"
            >
              <div className="mb-6 max-w-3xl">
                <h3 className="text-2xl font-semibold text-gray-950 dark:text-white">
                  Recommendations
                </h3>
                <p className="mt-2 leading-7 text-gray-600 dark:text-gray-300">
                  This section highlights the most important improvements your
                  author website needs, with clear action steps to strengthen
                  your brand, engage readers, and support book sales.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                {report.findings.slice(0, 3).map((finding, index) => (
                  <div
                    key={finding.id}
                    className="grid gap-3 border-b border-gray-200 px-5 py-5 last:border-b-0 md:grid-cols-[36px_220px_1fr] md:items-start md:px-6 dark:border-gray-800"
                  >
                    {index === 0 ? (
                      <AlertCircleIcon
                        className="mt-0.5 size-5 text-amber-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <LockIcon
                        className="mt-0.5 size-5 text-gray-400"
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Priority {index + 1}
                      </span>
                      <p className="mt-1 font-semibold text-gray-950 dark:text-white">
                        {finding.title}
                      </p>
                    </div>
                    <div className="grid gap-3 text-sm leading-6 text-gray-600 sm:grid-cols-2 dark:text-gray-300">
                      {index === 0 ? (
                        <>
                          <p>{finding.finding}</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {finding.recommendation}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-500 sm:col-span-2 dark:text-gray-400">
                          Unlock the full report to view this finding and its
                          recommendation.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`${styles.unlockPanel} overflow-hidden rounded-[2rem] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24`}
            >
              {isUnlocked ? (
                <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                  <div>
                    <h3 className="font-heading text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl dark:text-white">
                      Your full report is ready
                    </h3>
                    <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
                      Open the complete findings and prioritized recommendations
                      for {report.domain}.
                    </p>
                  </div>
                  <a
                    href={reportPath}
                    className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-7 font-semibold text-white shadow-lg shadow-blue-700/15 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:translate-y-0"
                  >
                    View full report
                  </a>
                </div>
              ) : (
                <div className="mx-auto max-w-4xl text-center">
                  <div className="mx-auto max-w-2xl">
                    <h3 className="font-heading text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl dark:text-white">
                      Unlock the complete author website report
                    </h3>
                    <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-600 sm:text-lg dark:text-gray-300">
                      Enter your email to see every finding, explanation, and
                      prioritized recommendation.
                    </p>
                  </div>
                  <div className="mt-9 text-left sm:mt-10">
                    <UnlockReportForm reportId={report.id} />
                  </div>
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </section>
  );
}
