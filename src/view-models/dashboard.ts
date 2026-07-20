import {
  type EngineerResult,
  type EvaluationSnapshot,
  type TaskResult,
} from "@/domain"
import type {
  CategoryAverageDatum,
  CompletedRankingRow,
  DashboardMetric,
  DashboardEvaluationTask,
  EngineerEvaluationProgressRow,
  TaskRankingRow,
  TaskRankingSection,
} from "@/features/dashboard"

import { selectDashboardProgress } from "./dashboard-progress"
import { selectEngineerResultSummaries } from "./results"

export type DashboardViewModel = Readonly<{
  metrics: readonly DashboardMetric[]
  categoryAverages: readonly CategoryAverageDatum[]
  rankingRows: readonly CompletedRankingRow[]
  taskRankings: readonly TaskRankingSection[]
  evaluationTasks: readonly DashboardEvaluationTask[]
  evaluationRows: readonly EngineerEvaluationProgressRow[]
}>

const roundToOne = (value: number): number => Math.round(value * 10) / 10
const roundToTwo = (value: number): number => Math.round(value * 100) / 100

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
      description: "선택 범위의 시즌 엔지니어",
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
      scores: results.flatMap((result) => {
        const taskResult = result.taskResults.find((entry) => entry.taskId === task.id)
        if (taskResult?.status !== "complete" || taskResult.score === null) return []
        return [{
          weighted: taskResult.score,
          unweighted: unweightedTaskScore(taskResult),
        }]
      }),
    }))

  return definitions
    .filter((definition) => definition.scores.length > 0)
    .map((definition) => ({
      id: definition.id,
      label: definition.label,
      weightedScore: average(definition.scores.map((score) => score.weighted)),
      unweightedScore: average(definition.scores.map((score) => score.unweighted)),
      sampleSize: definition.scores.length,
    }))
}

function unweightedTaskScore(result: TaskResult): number {
  if (result.method !== "evaluator_score" && result.method !== "evaluator_pass_fail") {
    return result.score ?? 0
  }
  const scores = result.evaluators.flatMap((evaluator) =>
    evaluator.rawScore === null ? [] : [evaluator.rawScore],
  )
  return scores.length === 0
    ? 0
    : scores.reduce((total, score) => total + score, 0) / scores.length
}

type RankCandidate<T> = Readonly<{
  row: T
  id: string
  score: number | null
  statusOrder: number
  name: string
}>

function applyCompetitionRanks<T>(
  candidates: readonly RankCandidate<T>[],
): ReadonlyArray<T & Readonly<{ rank: number | null; isTied: boolean }>> {
  const sorted = candidates.toSorted((left, right) => {
    if (left.score === null && right.score !== null) return 1
    if (left.score !== null && right.score === null) return -1
    if (left.score !== null && right.score !== null && left.score !== right.score) {
      return right.score - left.score
    }
    if (left.statusOrder !== right.statusOrder) return left.statusOrder - right.statusOrder
    return left.name.localeCompare(right.name, "ko")
  })
  const scoreCounts = new Map<number, number>()
  sorted.forEach((candidate) => {
    if (candidate.score !== null) {
      scoreCounts.set(candidate.score, (scoreCounts.get(candidate.score) ?? 0) + 1)
    }
  })
  let previousScore: number | null = null
  let previousRank = 0
  return sorted.map((candidate, index) => {
    const rank = candidate.score === null
      ? null
      : previousScore !== null && candidate.score === previousScore
        ? previousRank
        : index + 1
    if (candidate.score !== null) {
      previousScore = candidate.score
      previousRank = rank ?? previousRank
    }
    return {
      ...candidate.row,
      rank,
      isTied: candidate.score !== null && (scoreCounts.get(candidate.score) ?? 0) > 1,
    }
  })
}

function createRankingRows(
  results: readonly EngineerResult[],
  snapshot: EvaluationSnapshot,
): readonly CompletedRankingRow[] {
  const candidates = results.flatMap((result) => {
    const engineer = snapshot.engineers.find((entry) => entry.id === result.engineerId)
    if (engineer === undefined) return []
    const contributionValues = Object.values(result.contributions)
    const completedTaskCount = contributionValues.filter((value) => value !== null).length
    const earnedScore = contributionValues.reduce<number>(
      (total, value) => total + (value ?? 0),
      0,
    )
    const totalScore = result.roundedFinalScore ?? (
      completedTaskCount === 0
        ? null
        : roundToTwo(Math.min(100, Math.max(0, earnedScore + result.adjustmentTotal)))
    )
    const status = result.roundedFinalScore !== null
      ? "confirmed" as const
      : totalScore === null
        ? "not_started" as const
        : "in_progress" as const
    return [{
      id: engineer.id,
      score: totalScore,
      statusOrder: status === "confirmed" ? 0 : status === "in_progress" ? 1 : 2,
      name: engineer.displayName,
      row: {
        id: engineer.id,
        href: `/engineers/detail?engineerId=${encodeURIComponent(engineer.id)}`,
        name: engineer.displayName,
        team: engineer.team,
        totalScore,
        status,
        completedTaskCount,
        taskCount: contributionValues.length,
      },
    }]
  })
  return applyCompetitionRanks(candidates)
}

function createTaskRankings(
  results: readonly EngineerResult[],
  snapshot: EvaluationSnapshot,
  cycleId: string,
  evaluationRows: readonly EngineerEvaluationProgressRow[],
): readonly TaskRankingSection[] {
  return snapshot.tasks
    .filter((task) => task.cycleId === cycleId)
    .toSorted((left, right) => left.order - right.order)
    .map((task) => {
      const candidates = results.flatMap((result): readonly RankCandidate<Omit<TaskRankingRow, "rank" | "isTied">>[] => {
        const taskResult = result.taskResults.find((entry) => entry.taskId === task.id)
        const engineer = snapshot.engineers.find((entry) => entry.id === result.engineerId)
        if (taskResult === undefined || engineer === undefined) return []
        const progressStatus = evaluationRows
          .find((row) => row.id === engineer.id)
          ?.tasks.find((entry) => entry.taskId === task.id)
          ?.status ?? "not_started"
        const score = taskResult.status === "complete" && taskResult.score !== null
          ? roundToTwo(taskResult.score)
          : null
        return [{
          id: engineer.id,
          score,
          statusOrder: progressStatus === "complete" ? 0 : progressStatus === "in_progress" ? 1 : 2,
          name: engineer.displayName,
          row: {
            id: engineer.id,
            href: `/engineers/detail?engineerId=${encodeURIComponent(engineer.id)}`,
            name: engineer.displayName,
            team: engineer.team,
            score,
            status: progressStatus,
          },
        }]
      })
      const rows = applyCompetitionRanks(candidates)
      return {
        taskId: task.id,
        label: task.name,
        completedCount: rows.filter((row) => row.status === "complete").length,
        targetCount: rows.length,
        rows,
      }
    })
}

export function selectDashboardViewModel(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  team = "all",
): DashboardViewModel | null {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return null

  const summaries = selectEngineerResultSummaries(snapshot, cycleId).filter(
    (summary) => team === "all" || summary.engineer.team === team,
  )
  const results = summaries.map((summary) => summary.result)
  const progress = selectDashboardProgress(snapshot, summaries)
  return {
    metrics: createMetrics(summaries),
    categoryAverages: createCategoryAverages(results, snapshot, cycleId),
    rankingRows: createRankingRows(results, snapshot),
    taskRankings: createTaskRankings(results, snapshot, cycleId, progress.rows),
    evaluationTasks: progress.tasks,
    evaluationRows: progress.rows,
  }
}
