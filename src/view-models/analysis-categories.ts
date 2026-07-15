import type { EvaluationSnapshot } from "@/domain"
import type {
  AnalysisFilterState,
  CategoryAverageDatum,
  TeamComparisonDatum,
} from "@/features/analysis"

import {
  averageScore,
  categoryLabel,
  normalizeAnalysisFilters,
  selectCategoryScore,
  selectFilteredSummaries,
  selectedCategory,
  type AnalysisCategoryKey,
} from "./analysis-common"

export function selectAnalysisCategoryAverages(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<CategoryAverageDatum> {
  const normalized = normalizeAnalysisFilters(snapshot, filters)
  const summaries = selectFilteredSummaries(snapshot, cycleId, normalized)
  const selected = selectedCategory(snapshot, normalized)
  const categories: ReadonlyArray<AnalysisCategoryKey> =
    selected === null
      ? snapshot.tasks.filter((task) => task.cycleId === cycleId).map((task) => task.id)
      : [selected]

  return categories.flatMap((category) => {
    const values = summaries
      .map((summary) => selectCategoryScore(summary, category))
      .filter((value): value is number => value !== null)
    if (values.length === 0) return []
    return [{
      key: category,
      label: categoryLabel(snapshot, category),
      score: averageScore(values),
      completedCount: values.length,
    }]
  })
}

function teamScore(
  summary: ReturnType<typeof selectFilteredSummaries>[number],
  category: AnalysisCategoryKey | null,
): number | null {
  if (category !== null) return selectCategoryScore(summary, category)
  return summary.result.status === "complete"
    ? summary.result.roundedFinalScore
    : null
}

export function selectTeamComparison(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<TeamComparisonDatum> {
  const normalized = normalizeAnalysisFilters(snapshot, filters)
  const summaries = selectFilteredSummaries(snapshot, cycleId, normalized)
  const category = selectedCategory(snapshot, normalized)
  const teams = Array.from(
    new Set(summaries.map((summary) => summary.engineer.team)),
  ).toSorted((left, right) => left.localeCompare(right, "ko"))

  return teams.flatMap((team) => {
    const values = summaries
      .filter((summary) => summary.engineer.team === team)
      .map((summary) => teamScore(summary, category))
      .filter((value): value is number => value !== null)
    if (values.length === 0) return []
    return [{
      teamId: team,
      teamLabel: team,
      score: averageScore(values),
      completedCount: values.length,
    }]
  })
}
