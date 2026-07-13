import "server-only";

import { prisma } from "@/lib/db/prisma.core";
import { detectAuthorWebsiteSignals } from "@/lib/signals/author-website-signals";
import {
  generateReportNarrative,
  serializeReportNarrative,
  type GenerateReportNarrativeOptions,
  type ReportNarrativeInput,
  type ReportNarrativeResult,
} from "@/lib/ai/report-narrative.core";
import type { ScoringResult } from "@/lib/scoring/engine";

async function loadReportNarrativeInput(
  reportId: string,
  scoringResult: ScoringResult
): Promise<ReportNarrativeInput> {
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

  return {
    websiteUrl: report.normalizedUrl || report.url,
    pagesScanned: report.pagesScanned,
    signals,
    categoryScores: scoringResult.categoryScores,
    findings: scoringResult.findings,
    quickWins: scoringResult.quickWins,
    serviceFitLabel: scoringResult.serviceFitLabel,
    overallScore: scoringResult.overallScore,
    technicalAudit: report.technicalAudit,
  };
}

export async function generateReportNarrativeForReport(
  reportId: string,
  scoringResult: ScoringResult,
  options: Pick<GenerateReportNarrativeOptions, "timeoutMs"> = {}
): Promise<ReportNarrativeResult> {
  const input = await loadReportNarrativeInput(reportId, scoringResult);

  return generateReportNarrative(input, {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
    timeoutMs: options.timeoutMs,
  });
}

export async function generateDeterministicSerializedReportNarrativeForReport(
  reportId: string,
  scoringResult: ScoringResult
) {
  const input = await loadReportNarrativeInput(reportId, scoringResult);
  const result = await generateReportNarrative(input);

  return serializeReportNarrative(result);
}

export async function generateSerializedReportNarrativeForReport(
  reportId: string,
  scoringResult: ScoringResult,
  options: Pick<GenerateReportNarrativeOptions, "timeoutMs"> = {}
) {
  const result = await generateReportNarrativeForReport(
    reportId,
    scoringResult,
    {
      timeoutMs: options.timeoutMs,
    }
  );

  return serializeReportNarrative(result);
}
