import type { EvaluationSnapshot } from "@/domain"
import type {
  AnalysisFilterOption,
  AnalysisFilterState,
  AnalysisHighlightDatum,
  CategoryAverageDatum,
  EvaluatorDeviationDatum,
  RubricItemAverageDatum,
  ScoreDistributionDatum,
  TaskCompletionDatum,
  TeamComparisonDatum,
  TeamTaskPerformanceDatum,
} from "@/features/analysis"

import { selectAnalysisCategoryAverages, selectTeamComparison } from "./analysis-categories"
import {
  categoryLabel,
  DEFAULT_ANALYSIS_FILTERS,
  normalizeAnalysisFilters,
  selectedCategory,
} from "./analysis-common"
import {
  selectAnalysisHighlights,
  selectTaskCompletionRates,
  selectTaskScoreDistributions,
  selectTeamTaskPerformance,
} from "./analysis-insights"
import { selectEvaluatorDeviations, selectRubricItemAverages } from "./analysis-rubrics"

export type AnalysisViewModel = Readonly<{
  filters: AnalysisFilterState
  teamOptions: readonly AnalysisFilterOption[]
  categoryOptions: readonly AnalysisFilterOption[]
  statusOptions: readonly AnalysisFilterOption[]
  highlights: readonly AnalysisHighlightDatum[]
  scoreDistributions: readonly ScoreDistributionDatum[]
  taskCompletionRates: readonly TaskCompletionDatum[]
  teamTaskPerformance: readonly TeamTaskPerformanceDatum[]
  categoryAverages: readonly CategoryAverageDatum[]
  rubricItemAverages: readonly RubricItemAverageDatum[]
  teamComparison: readonly TeamComparisonDatum[]
  evaluatorDeviations: readonly EvaluatorDeviationDatum[]
  teamComparisonCategoryLabel: string
  evaluatorDeviationDomainMax: number
}>

function teamOptions(snapshot: EvaluationSnapshot): readonly AnalysisFilterOption[] {
  const teams = Array.from(
    new Set(snapshot.engineers.map((engineer) => engineer.team)),
  ).toSorted((left, right) => left.localeCompare(right, "ko"))
  return [
    { value: "all", label: "전체 팀" },
    ...teams.map((team) => ({ value: team, label: team })),
  ]
}

export function selectAnalysisViewModel(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState = DEFAULT_ANALYSIS_FILTERS,
): AnalysisViewModel | null {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return null

  const normalized = normalizeAnalysisFilters(snapshot, filters)
  const category = selectedCategory(snapshot, normalized)
  const evaluatorDeviations = selectEvaluatorDeviations(
    snapshot,
    cycleId,
    normalized,
  )
  const scoreDistributions = selectTaskScoreDistributions(
    snapshot,
    cycleId,
    normalized,
  )
  const taskCompletionRates = selectTaskCompletionRates(
    snapshot,
    cycleId,
    normalized,
  )
  const teamTaskPerformance = selectTeamTaskPerformance(
    snapshot,
    cycleId,
    normalized,
  )

  return {
    filters: normalized,
    teamOptions: teamOptions(snapshot),
    categoryOptions: [
      { value: "all", label: "전체 평가 분야" },
      ...snapshot.tasks.filter((task) => task.cycleId === cycleId).toSorted((left, right) => left.order - right.order).map((task) => ({
        value: task.id,
        label: task.name,
      })),
    ],
    statusOptions: [
      { value: "all", label: "전체 상태" },
      { value: "complete", label: "완료" },
      { value: "in_progress", label: "진행 중" },
      { value: "unconfirmed", label: "미확정" },
    ],
    highlights: selectAnalysisHighlights(
      scoreDistributions,
      taskCompletionRates,
      teamTaskPerformance,
    ),
    scoreDistributions,
    taskCompletionRates,
    teamTaskPerformance,
    categoryAverages: selectAnalysisCategoryAverages(
      snapshot,
      cycleId,
      normalized,
    ),
    rubricItemAverages: selectRubricItemAverages(
      snapshot,
      cycleId,
      normalized,
    ),
    teamComparison: selectTeamComparison(snapshot, cycleId, normalized),
    evaluatorDeviations,
    teamComparisonCategoryLabel:
      category === null ? "최종 가중 총점" : categoryLabel(snapshot, category),
    evaluatorDeviationDomainMax: Math.max(
      20,
      Math.ceil(
        Math.max(
          0,
          ...evaluatorDeviations.map((entry) => entry.meanAbsoluteDeviation),
        ) / 5,
      ) * 5,
    ),
  }
}
