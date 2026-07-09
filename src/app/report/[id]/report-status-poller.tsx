"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type PollableReportStatus = "QUEUED" | "RUNNING" | "COMPLETE" | "FAILED";

const pollingStatuses = new Set<PollableReportStatus>(["QUEUED", "RUNNING"]);

export function ReportStatusPoller({
  intervalMs = 5000,
  reportId,
  status,
}: {
  intervalMs?: number;
  reportId: string;
  status: PollableReportStatus;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!pollingStatuses.has(status)) {
      return;
    }

    let cancelled = false;

    async function pollStatus() {
      try {
        const response = await fetch(`/api/reports/${reportId}/status`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          status?: PollableReportStatus;
        };

        if (!cancelled && data.status && data.status !== status) {
          router.refresh();
        }
      } catch {
        // Polling is best-effort. The visible report state remains the source
        // of truth if a single status check fails.
      }
    }

    void pollStatus();
    const interval = window.setInterval(() => {
      void pollStatus();
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [intervalMs, reportId, router, status]);

  return null;
}
