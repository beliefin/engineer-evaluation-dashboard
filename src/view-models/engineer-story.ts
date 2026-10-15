import type { EngineerResult } from "@/domain"
import type {
  CategoryScoreViewModel,
  EngineerEvaluationStoryViewModel,
  EngineerStoryHighlightViewModel,
} from "@/features/engineers"

import type { EngineerResultSummary } from "./results"
import type { ViewerRanking } from "@/backend/evaluation-backend"

const roundToOne = (value: number): number => Math.round(value * 10) / 10
const roundToTwo = (value: number): number => Math.round(value * 100) / 100

function average(values: readonly number[]): number {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

function distribution(values: readonly number[]): EngineerEvaluationStoryViewModel["taskComparisons"][number]["distribution"] {
  if (values.length === 0) return null
  const sorted = values.toSorted((left, right) => left - right)
  const quantile = (percentile: number) => {
    const position = (sorted.length - 1) * percentile
    const lower = sorted[Math.floor(position)]
    const upper = sorted[Math.ceil(position)]
    if (lower === undefined || upper === undefined) return 0
    return roundToOne(lower + (upper - lower) * (position - Math.floor(position)))
  }
  const minimum = sorted[0]
  const maximum = sorted.at(-1)
  if (minimum === undefined || maximum === undefined) return null
  return {
    minimum: roundToOne(minimum),
    firstQuartile: quantile(0.25),
    median: quantile(0.5),
    thirdQuartile: quantile(0.75),
    maximum: roundToOne(maximum),
  }
}

function currentScore(result: EngineerResult): number | null {
  if (result.roundedFinalScore !== null) return result.roundedFinalScore
  const contributions = Object.values(result.contributions).filter(
    (value): value is number => value !== null,
  )
  if (contributions.length === 0) return null
  const earnedScore = contributions.reduce((total, value) => total + value, 0)
  return roundToTwo(Math.min(result.totalScoreLimit ?? 100, Math.max(0, earnedScore + result.adjustmentTotal)))
}

function rankForEngineer(
  summaries: readonly EngineerResultSummary[],
  engineerId: string,
): Readonly<{ rank: number | null; cohortCount: number }> {
  const candidates = summaries.flatMap((summary) => {
    const score = currentScore(summary.result)
    return score === null ? [] : [{ engineerId: summary.engineer.id, score }]
  }).toSorted((left, right) =>
    right.score - left.score || left.engineerId.localeCompare(right.engineerId),
  )
  const target = candidates.find((candidate) => candidate.engineerId === engineerId)
  if (target === undefined) return { rank: null, cohortCount: candidates.length }
  const rank = candidates.findIndex((candidate) => candidate.score === target.score) + 1
  return { rank, cohortCount: candidates.length }
}

function taskScores(
  summaries: readonly EngineerResultSummary[],
  taskId: string,
): readonly number[] {
  return summaries.flatMap((summary) => {
    const task = summary.result.taskResults.find((entry) => entry.taskId === taskId)
    return task?.status === "complete" && task.score !== null ? [task.score] : []
  })
}

function toHighlight(
  point: EngineerEvaluationStoryViewModel["profile"][number] | undefined,
): EngineerStoryHighlightViewModel | null {
  return point === undefined ? null : {
    key: point.key,
    label: point.label,
    score: point.score,
    differenceFromAverage: roundToOne(point.score - point.averageScore),
  }
}

export function createEngineerEvaluationStory(
  summaries: readonly EngineerResultSummary[],
  engineerId: string,
  categories: readonly CategoryScoreViewModel[],
  viewerRanking?: Pick<ViewerRanking, "rank" | "cohortCount">,
): EngineerEvaluationStoryViewModel {
  const summary = summaries.find((entry) => entry.engineer.id === engineerId)
  const score = summary === undefined ? null : currentScore(summary.result)
  const ranking = viewerRanking ?? rankForEngineer(summaries, engineerId)
  const taskComparisons = categories.map((category) => {
    const scores = taskScores(summaries, category.key)
    const topCount = Math.max(1, Math.ceil(scores.length * 0.25))
    const topScores = scores.toSorted((left, right) => right - left).slice(0, topCount)
    return {
      key: category.key,
      label: category.label,
      ownScore: category.rawScore,
      averageScore: roundToOne(average(scores)),
      topQuartileAverage: roundToOne(average(topScores)),
      sampleSize: scores.length,
      distribution: distribution(scores),
    }
  })
  const profile = taskComparisons.flatMap((comparison) =>
    comparison.ownScore === null
      ? []
      : [{
          key: comparison.key,
          label: comparison.label,
          score: roundToOne(comparison.ownScore),
          averageScore: comparison.averageScore,
        }],
  )
  const byDifference = profile.toSorted((left, right) => {
    const leftDifference = left.score - left.averageScore
    const rightDifference = right.score - right.averageScore
    return rightDifference - leftDifference || right.score - left.score
  })

  return {
    score,
    scoreLabel: summary?.result.roundedFinalScore === null ? "현재 반영 점수" : "최종 점수",
    rank: ranking.rank,
    cohortCount: ranking.cohortCount,
    topPercentile: ranking.rank === null || ranking.cohortCount === 0
      ? null
      : roundToOne((ranking.rank / ranking.cohortCount) * 100),
    strongestCategory: toHighlight(byDifference[0]),
    improvementCategory: toHighlight(byDifference.at(-1)),
    profile,
    taskComparisons,
  }
}
