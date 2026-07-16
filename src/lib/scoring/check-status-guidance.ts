import type { ScoringCheckDefinition } from "@/lib/scoring/check-registry";
import {
  getCheckStatusContent,
  type AuditCheckStatus,
} from "@/lib/scoring/check-status-content.generated";

export type CheckStatusGuidance = {
  details: string;
  recommendation: string;
};

export function getCheckStatusGuidance(
  check: ScoringCheckDefinition,
  status: AuditCheckStatus,
): CheckStatusGuidance {
  const content = getCheckStatusContent(check.id, status);

  return {
    details: content.details,
    recommendation: content.recommendation,
  };
}
