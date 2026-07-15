import type { EvaluationSnapshot } from "@/domain"
import type {
  AnalysisFilterState,
  AnalysisHighlightDatum,
  ScoreDistributionDatum,
  TaskCompletionDatum,
  TeamTaskPerformanceDatum,
} from "@/features/analysis"

import {
  averageScore,
  normalizeAnalysisFilters,
  selectCategoryScore,
  selectFilteredSummaries,
  selectedCategory,
} from "./analysis-common"

type ScoreDistributionSummary = Readonly<{
  minimum: number
  firstQuartile: number
  median: number
  thirdQuartile: number
  maximum: number
}>

const roundToOne = (value: number): number => Math.round(value * 10) / 10

function quantile(sortedValues: readonly number[], percentile: number): number {
  const position = (sortedValues.length - 1) * percentile
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const lower = sortedValues[lowerIndex]
  const upper = sortedValues[upperIndex]
  if (lower === undefined || upper === undefined) return 0
  return roundToOne(lower + (upper - lower) * (position - lowerIndex))
}

export function summarizeScoreDistribution(
  values: readonly number[],
): ScoreDistributionSummary | null {
  if (values.length === 0) return null
  const sorted = values.toSorted((left, right) => left - right)
  const minimum = sorted[0]
  const maximum = sorted[sorted.length - 1]
  if (minimum === undefined || maximum === undefined) return null
  return {
    minimum: roundToOne(minimum),
    firstQuartile: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    thirdQuartile: quantile(sorted, 0.75),
    maximum: roundToOne(maximum),
  }
}

function selectedTasks(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
) {
  const selectedTaskId = selectedCategory(snapshot, filters)
  return snapshot.tasks
    .filter((task) => task.cycleId === cycleId)
    .filter((task) => selectedTaskId === null || task.id === selectedTaskId)
    .toSorted((left, right) => left.order - right.order)
}

export function selectTaskScoreDistributions(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<ScoreDistributionDatum> {
  const normalized = normalizeAnalysisFilters(snapshot, filters)
  const summaries = selectFilteredSummaries(snapshot, cycleId, normalized)
  return selectedTasks(snapshot, cycleId, normalized)
    .filter((task) => task.method === "evaluator_score" || task.method === "operator_score")
    .flatMap((task) => {
    const values = summaries
      .map((summary) => selectCategoryScore(summary, task.id))
      .filter((value): value is number => value !== null)
    const distribution = summarizeScoreDistribution(values)
    return distribution === null
      ? []
      : [{
          taskId: task.id,
          taskLabel: task.name,
          ...distribution,
          completedCount: values.length,
        }]
    })
}

export function selectTaskCompletionRates(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<TaskCompletionDatum> {
  const normalized = normalizeAnalysisFilters(snapshot, filters)
  const summaries = selectFilteredSummaries(snapshot, cycleId, normalized)
  if (summaries.length === 0) return []
  return selectedTasks(snapshot, cycleId, normalized).map((task) => {
    const eligibleSummaries = summaries.filter((summary) =>
      summary.result.taskResults.some((result) => result.taskId === task.id),
    )
    const completedCount = eligibleSummaries.filter((summary) => (
      summary.result.taskResults.find((result) => result.taskId === task.id)?.status ===
      "complete"
    )).length
    const eligibleCount = eligibleSummaries.length
    return {
      taskId: task.id,
      taskLabel: task.name,
      completedCount,
      eligibleCount,
      completionRate: eligibleCount === 0
        ? 0
        : roundToOne((completedCount / eligibleCount) * 100),
    }
  })
}

export function selectTeamTaskPerformance(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<TeamTaskPerformanceDatum> {
  const normalized = normalizeAnalysisFilters(snapshot, filters)
  const baselineSummaries = selectFilteredSummaries(snapshot, cycleId, {
    ...normalized,
    team: "all",
    status: "all",
  })
  const filteredSummaries = selectFilteredSummaries(snapshot, cycleId, normalized)
  const teams = Array.from(
    new Set(filteredSummaries.map((summary) => summary.engineer.team)),
  ).toSorted((left, right) => left.localeCompare(right, "ko"))

  return selectedTasks(snapshot, cycleId, normalized).flatMap((task) => {
    const baselineValues = baselineSummaries
      .map((summary) => selectCategoryScore(summary, task.id))
      .filter((value): value is number => value !== null)
    if (baselineValues.length === 0) return []
    const overallScore = averageScore(baselineValues)
    return teams.flatMap((team) => {
      const values = filteredSummaries
        .filter((summary) => summary.engineer.team === team)
        .map((summary) => selectCategoryScore(summary, task.id))
        .filter((value): value is number => value !== null)
      if (values.length === 0) return []
      const score = averageScore(values)
      return [{
        teamId: team,
        teamLabel: team,
        taskId: task.id,
        taskLabel: task.name,
        metric: task.method === "evaluator_pass_fail" || task.method === "operator_pass_fail"
          ? "pass-rate"
          : "score",
        score,
        overallScore,
        delta: roundToOne(score - overallScore),
        completedCount: values.length,
      }]
    })
  })
}

function largestTeamGap(
  cells: readonly TeamTaskPerformanceDatum[],
): Readonly<{
  taskLabel: string
  metric: "score" | "pass-rate"
  gap: number
  highTeam: string
  lowTeam: string
}> | null {
  const taskIds = Array.from(new Set(cells.map((cell) => cell.taskId)))
  const candidates = taskIds.flatMap((taskId) => {
    const taskCells = cells.filter((cell) => cell.taskId === taskId)
    if (taskCells.length < 2) return []
    const sorted = taskCells.toSorted((left, right) => left.score - right.score)
    const lowest = sorted[0]
    const highest = sorted[sorted.length - 1]
    if (lowest === undefined || highest === undefined) return []
    return [{
      taskLabel: highest.taskLabel,
      metric: highest.metric,
      gap: roundToOne(highest.score - lowest.score),
      highTeam: highest.teamLabel,
      lowTeam: lowest.teamLabel,
    }]
  })
  return candidates.toSorted((left, right) => right.gap - left.gap)[0] ?? null
}

export function selectAnalysisHighlights(
  distributions: readonly ScoreDistributionDatum[],
  completionRates: readonly TaskCompletionDatum[],
  teamPerformance: readonly TeamTaskPerformanceDatum[],
): ReadonlyArray<AnalysisHighlightDatum> {
  const widest = distributions.toSorted(
    (left, right) =>
      (right.thirdQuartile - right.firstQuartile) -
      (left.thirdQuartile - left.firstQuartile),
  )[0]
  const bottleneck = completionRates.toSorted(
    (left, right) => left.completionRate - right.completionRate,
  )[0]
  const teamGap = largestTeamGap(teamPerformance)

  return [
    ...(widest === undefined
      ? []
      : [{
          kind: "score-spread" as const,
          label: "변별 폭이 큰 과제",
          value: `${roundToOne(widest.thirdQuartile - widest.firstQuartile).toFixed(1)}점`,
          detail: `${widest.taskLabel} · 중앙 50% 점수 범위`,
        }]),
    ...(bottleneck === undefined
      ? []
      : [{
          kind: "completion-bottleneck" as const,
          label: "완료율 병목",
          value: `${bottleneck.completionRate.toFixed(1)}%`,
          detail: `${bottleneck.taskLabel} · ${bottleneck.completedCount}/${bottleneck.eligibleCount}명 완료`,
        }]),
    ...(teamGap === null
      ? []
      : [{
          kind: "team-gap" as const,
          label: "팀 격차가 큰 과제",
          value: teamGap.metric === "pass-rate"
            ? `${teamGap.gap.toFixed(1)}%p`
            : `${teamGap.gap.toFixed(1)}점`,
          detail: `${teamGap.taskLabel} · ${teamGap.highTeam}·${teamGap.lowTeam} 평균 차이`,
        }]),
  ]
}
