import type { ScoringResult } from "@/lib/scoring/engine";

function formatCategoryScore(score: ScoringResult["categoryScores"][number]) {
  return `${score.score}/${score.maxScore} (${score.percentageScore}%)`;
}

function scoreTone(score: number) {
  if (score >= 85) {
    return "strong";
  }

  if (score >= 70) {
    return "solid";
  }

  if (score >= 50) {
    return "mixed";
  }

  return "limited";
}

export function buildBasicAnalysisSummary(result: ScoringResult) {
  const sortedScores = [...result.categoryScores].sort(
    (a, b) =>
      b.percentageScore - a.percentageScore || a.label.localeCompare(b.label),
  );
  const strongest = sortedScores[0];
  const weakest = sortedScores[sortedScores.length - 1];
  const topFix = result.findings[0];
  const quickWin = result.quickWins[0];
  const parts = [
    result.overallScore === null
      ? "This author website did not receive a numeric score because verified audit coverage was below the required threshold."
      : `This author website has a ${scoreTone(
          result.overallScore,
        )} score of ${result.overallScore}/100.`,
  ];

  if (strongest) {
    parts.push(
      `The strongest area is ${strongest.label.toLowerCase()} at ${formatCategoryScore(strongest)}.`,
    );
  }

  if (weakest && weakest.percentageScore < 80) {
    parts.push(
      `The area that needs the most attention is ${weakest.label.toLowerCase()} at ${formatCategoryScore(weakest)}.`,
    );
  }

  if (topFix) {
    parts.push(`Top priority: ${topFix.title.toLowerCase()}.`);
  }

  if (quickWin) {
    parts.push(`A practical quick win is to ${quickWin.recommendation}`);
  }

  parts.push(`Recommended service fit: ${result.serviceFitLabel}.`);

  return parts.join(" ");
}
