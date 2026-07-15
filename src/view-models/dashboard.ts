import {
  rankCompletedResults,
  type EngineerResult,
  type EvaluationSnapshot,
} from "@/domain"
import type {
  CategoryAverageDatum,
  CompletedRankingRow,
  DashboardMetric,
  ScoreDistributionDatum,
} from "@/features/dashboard"

import { selectEngineerResultSummaries } from "./results"

export type DashboardViewModel = Readonly<{
  metrics: readonly DashboardMetric[]
  distribution: readonly ScoreDistributionDatum[]
  categoryAverages: readonly CategoryAverageDatum[]
  rankingRows: readonly CompletedRankingRow[]
}>

const roundToOne = (value: number): number => Math.round(value * 10) / 10

function average(values: readonly number[]): number {
  if (values.length === 0) return 0
  return roundToOne(values.reduce((total, value) => total + value, 0) / values.length)
}

function createMetrics(
  summaries: ReturnType<typeof selectEngineerResultSummaries>,
): readonly DashboardMetric[] {
  const targetCount = summaries.length
  const completedCount = summaries.filter((entry) => entry.status === "complete").length
  const inProgressCount = summaries.filter((entry) => entry.status === "in_progress").length
  const unconfirmedCount = summaries.filter((entry) => entry.status === "unconfirmed").length
  const completionRate = targetCount === 0 ? 0 : roundToOne((completedCount / targetCount) * 100)

  return [
    {
      id: "target",
      label: "평가 대상",
      value: targetCount,
      unit: "명",
      description: "이번 시즌 전체 엔지니어",
      tone: "neutral",
    },
    {
      id: "completion-rate",
      label: "완료율",
      value: completionRate,
      unit: "%",
      description: "필수 평가와 직접점수 입력 완료",
      tone: "success",
    },
    {
      id: "in-progress",
      label: "미완료",
      value: inProgressCount,
      unit: "명",
      description: "필수 평가 제출이 남은 대상",
      tone: "danger",
    },
    {
      id: "unconfirmed",
      label: "미확정",
      value: unconfirmedCount,
      unit: "명",
      description: "평가는 완료됐으나 직접점수 입력 필요",
      tone: "warning",
    },
  ]
}

function createDistribution(results: readonly EngineerResult[]): readonly ScoreDistributionDatum[] {
  const counts = [0, 0, 0, 0, 0]
  results.forEach((result) => {
    const score = result.roundedFinalScore
    if (score === null) return
    if (score < 60) counts[0] = (counts[0] ?? 0) + 1
    else if (score < 70) counts[1] = (counts[1] ?? 0) + 1
    else if (score < 80) counts[2] = (counts[2] ?? 0) + 1
    else if (score < 90) counts[3] = (counts[3] ?? 0) + 1
    else counts[4] = (counts[4] ?? 0) + 1
  })

  return [
    { range: "0~59", count: counts[0] ?? 0 },
    { range: "60~69", count: counts[1] ?? 0 },
    { range: "70~79", count: counts[2] ?? 0 },
    { range: "80~89", count: counts[3] ?? 0 },
    { range: "90~100", count: counts[4] ?? 0 },
  ]
}

function createCategoryAverages(
  results: readonly EngineerResult[],
  snapshot: EvaluationSnapshot,
  cycleId: string,
): readonly CategoryAverageDatum[] {
  const definitions = snapshot.tasks
    .filter((task) => task.cycleId === cycleId)
    .toSorted((left, right) => left.order - right.order)
    .map((task) => ({
      id: task.id,
      label: task.name,
      scores: results
        .map((result) => result.taskResults.find((entry) => entry.taskId === task.id)?.score ?? null)
        .filter((score): score is number => score !== null),
    }))

  return definitions
    .filter((definition) => definition.scores.length > 0)
    .map((definition) => ({
      id: definition.id,
      label: definition.label,
      score: average(definition.scores),
    }))
}

function createRankingRows(
  results: readonly EngineerResult[],
  snapshot: EvaluationSnapshot,
): readonly CompletedRankingRow[] {
  const ranked = rankCompletedResults(results)
  return ranked.flatMap((result) => {
    const engineer = snapshot.engineers.find((entry) => entry.id === result.engineerId)
    if (engineer === undefined || result.roundedFinalScore === null) return []
    const tied = ranked.filter((entry) => entry.rank === result.rank).length > 1
    return [{
      id: engineer.id,
      href: `/engineers/detail?engineerId=${encodeURIComponent(engineer.id)}`,
      rank: result.rank,
      name: engineer.displayName,
      team: engineer.team,
      totalScore: result.roundedFinalScore,
      status: tied ? "tied" : "confirmed",
    }]
  })
}

export function selectDashboardViewModel(
  snapshot: EvaluationSnapshot,
  cycleId: string,
): DashboardViewModel | null {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return null

  const summaries = selectEngineerResultSummaries(snapshot, cycleId)
  const results = summaries.map((summary) => summary.result)
  return {
    metrics: createMetrics(summaries),
    distribution: createDistribution(results),
    categoryAverages: createCategoryAverages(results, snapshot, cycleId),
    rankingRows: createRankingRows(results, snapshot),
  }
}
