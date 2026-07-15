import type { EvaluationSnapshot } from "@/domain"
import type { AnalysisFilterState } from "@/features/analysis"

import {
  selectEngineerResultSummaries,
  type EngineerProgressStatus,
  type EngineerResultSummary,
} from "./results"

export type AnalysisCategoryKey = string

export const DEFAULT_ANALYSIS_FILTERS: AnalysisFilterState = {
  team: "all",
  category: "all",
  status: "all",
}

export function averageScore(values: readonly number[]): number {
  if (values.length === 0) return 0
  const average = values.reduce((total, value) => total + value, 0) / values.length
  return Math.round(average * 10) / 10
}

export function isAnalysisCategoryKey(
  snapshot: EvaluationSnapshot,
  value: string,
): value is AnalysisCategoryKey {
  return snapshot.tasks.some((task) => task.id === value)
}

function isProgressStatus(value: string): value is EngineerProgressStatus {
  return (
    value === "complete" ||
    value === "in_progress" ||
    value === "unconfirmed"
  )
}

export function normalizeAnalysisFilters(
  snapshot: EvaluationSnapshot,
  filters: AnalysisFilterState,
): AnalysisFilterState {
  const teamIsValid =
    filters.team === "all" ||
    snapshot.engineers.some((engineer) => engineer.team === filters.team)
  return {
    team: teamIsValid ? filters.team : "all",
    category:
      filters.category === "all" || isAnalysisCategoryKey(snapshot, filters.category)
        ? filters.category
        : "all",
    status:
      filters.status === "all" || isProgressStatus(filters.status)
        ? filters.status
        : "all",
  }
}

export function selectFilteredSummaries(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<EngineerResultSummary> {
  const normalized = normalizeAnalysisFilters(snapshot, filters)
  return selectEngineerResultSummaries(snapshot, cycleId).filter(
    (summary) =>
      (normalized.team === "all" || summary.engineer.team === normalized.team) &&
      (normalized.status === "all" || summary.status === normalized.status),
  )
}

export function selectedCategory(
  snapshot: EvaluationSnapshot,
  filters: AnalysisFilterState,
): AnalysisCategoryKey | null {
  return isAnalysisCategoryKey(snapshot, filters.category) ? filters.category : null
}

export function categoryLabel(
  snapshot: EvaluationSnapshot,
  category: AnalysisCategoryKey,
): string {
  return snapshot.tasks.find((task) => task.id === category)?.name ?? "알 수 없는 과제"
}

export function selectCategoryScore(
  summary: EngineerResultSummary,
  category: AnalysisCategoryKey,
): number | null {
  return summary.result.taskResults.find((entry) => entry.taskId === category)?.score ?? null
}
