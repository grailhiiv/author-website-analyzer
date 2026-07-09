import { NextResponse } from "next/server";

import {
  enqueueAnalysisJob,
  scheduleAnalysisJob,
} from "@/lib/analysis/jobs";

// Temporary MVP trigger. Protect or remove this route before production once
// analysis moves to an authenticated admin action, cron, or managed queue.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await enqueueAnalysisJob(id);
  scheduleAnalysisJob(id);

  return NextResponse.json({
    ok: true,
    reportId: id,
    jobStatus: job.status,
    message: "Analysis job has been queued.",
  });
}
