import "server-only";

import { prisma } from "@/lib/db/prisma.core";
import { detectAuthorWebsiteSignals } from "@/lib/signals/author-website-signals";
import {
  generateReportNarrative,
  serializeReportNarrative,
  type ReportNarrativeResult,
} from "@/lib/ai/report-narrative.core";
import type { ScoringResult } from "@/lib/scoring/engine";

export async function generateReportNarrativeForReport(
  reportId: string,
  scoringResult: ScoringResult
): Promise<ReportNarrativeResult> {
  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
    include: {
      pagesScanned: true,
      technicalAudit: true,
    },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  const signals = detectAuthorWebsiteSignals(report.pagesScanned);

  return generateReportNarrative(
    {
      websiteUrl: report.normalizedUrl || report.url,
      authorType: report.authorType,
      websiteGoal: report.websiteGoal,
      pagesScanned: report.pagesScanned,
      signals,
      categoryScores: scoringResult.categoryScores,
      findings: scoringResult.findings,
      quickWins: scoringResult.quickWins,
      serviceFitLabel: scoringResult.serviceFitLabel,
      overallScore: scoringResult.overallScore,
      technicalAudit: report.technicalAudit,
    },
    {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
    }
  );
}

export async function generateSerializedReportNarrativeForReport(
  reportId: string,
  scoringResult: ScoringResult
) {
  const result = await generateReportNarrativeForReport(reportId, scoringResult);

  return serializeReportNarrative(result);
}
