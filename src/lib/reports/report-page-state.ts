import { ReportStatus } from "@/generated/prisma/client";

export type ReportPageState = {
  showAnalyzingState: boolean;
  showCompleteState: boolean;
  showEmailGate: boolean;
  showFailedState: boolean;
  showFullReport: boolean;
};

export function getReportPageState({
  hasLeadEmail,
  status,
}: {
  hasLeadEmail: boolean;
  status: ReportStatus;
}): ReportPageState {
  const showAnalyzingState =
    status === ReportStatus.QUEUED || status === ReportStatus.RUNNING;
  const showFailedState = status === ReportStatus.FAILED;
  const showCompleteState = status === ReportStatus.COMPLETE;
  const showFullReport = showCompleteState && hasLeadEmail;

  return {
    showAnalyzingState,
    showCompleteState,
    showEmailGate: showCompleteState && !hasLeadEmail,
    showFailedState,
    showFullReport,
  };
}
