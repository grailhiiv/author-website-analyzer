import "server-only";

import { prisma } from "@/lib/db/prisma.core";
import { detectAuthorWebsiteSignals } from "@/lib/signals/author-website-signals";
import { scoreAuthorWebsite } from "@/lib/scoring/engine";

export async function scoreAndSaveReport(reportId: string) {
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
  const result = scoreAuthorWebsite({
    signals,
    pagesScanned: report.pagesScanned,
    technicalAudit: report.technicalAudit,
    authorType: report.authorType,
    websiteGoal: report.websiteGoal,
  });

  await prisma.$transaction([
    prisma.reportScore.deleteMany({
      where: {
        reportId,
      },
    }),
    prisma.reportFinding.deleteMany({
      where: {
        reportId,
        priority: {
          lte: 7,
        },
      },
    }),
    prisma.reportScore.createMany({
      data: result.categoryScores.map((score) => ({
        reportId,
        category: score.category,
        score: score.score,
        maxScore: score.maxScore,
        summary: score.summary,
      })),
    }),
    prisma.reportFinding.createMany({
      data: result.findings.map((finding) => ({
        reportId,
        category: finding.category,
        severity: finding.severity,
        title: finding.title,
        finding: finding.finding,
        recommendation: finding.recommendation,
        practicalActions: finding.practicalActions,
        priority: finding.priority,
      })),
    }),
    prisma.report.update({
      where: {
        id: reportId,
      },
      data: {
        overallScore: result.overallScore,
      },
    }),
  ]);

  return result;
}
