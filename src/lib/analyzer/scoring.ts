import { scoreCategories, type ScoreCategoryId } from "@/lib/analyzer/categories";

export type CategoryEvidence = {
  signalsFound: number;
  signalsChecked: number;
  criticalIssues: number;
};

export type ScoreInput = Partial<Record<ScoreCategoryId, CategoryEvidence>>;

export type CategoryScore = {
  id: ScoreCategoryId;
  label: string;
  score: number;
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateCategoryScore(evidence: CategoryEvidence) {
  if (evidence.signalsChecked <= 0) {
    return 0;
  }

  const baseScore = (evidence.signalsFound / evidence.signalsChecked) * 100;
  const issuePenalty = evidence.criticalIssues * 12;

  return clampScore(baseScore - issuePenalty);
}

export function calculateScorecard(input: ScoreInput) {
  const categories: CategoryScore[] = scoreCategories.map((category) => ({
    id: category.id,
    label: category.label,
    score: calculateCategoryScore(
      input[category.id] ?? {
        signalsFound: 0,
        signalsChecked: 0,
        criticalIssues: 0,
      }
    ),
  }));

  const overallScore = clampScore(
    categories.reduce((sum, category) => sum + category.score, 0) /
      categories.length
  );

  return {
    overallScore,
    categories,
  };
}
