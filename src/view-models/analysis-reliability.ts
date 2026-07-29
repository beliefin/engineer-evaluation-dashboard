import type { EvaluationSnapshot } from "@/domain"
import type {
  AnalysisFilterState,
  EvaluationReliabilityDatum,
  EvaluatorExclusionSensitivityDatum,
  EvaluatorExclusionSensitivityRowDatum,
  EvaluatorResidualDatum,
  EvaluatorScoreComparisonDatum,
} from "@/features/analysis"

import {
  EVALUATOR_OUTLIER_DELTA,
  selectEvaluatorScoreComparisons,
} from "./analysis-rubrics"

export const EVALUATOR_DISAGREEMENT_RANGE = 15
export const EVALUATOR_DISAGREEMENT_STANDARD_DEVIATION = 7.5
export const EVALUATOR_RANK_SHIFT_ALERT = 2

type EvaluatorResidualSource = Readonly<{
  evaluatorId: string
  evaluatorLabel: string
  score: number
  leaveOneOutAverage: number
  residual: number
  isOutlier: boolean
}>

type SensitivityCohortRow = Readonly<{
  engineerId: string
  engineerLabel: string
  teamLabel: string
  baselineScore: number
  excludedScore: number
}>

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function average(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length
}

function standardDeviation(values: readonly number[]): number {
  const mean = average(values)
  const squaredDeviation = values.reduce(
    (total, value) => total + ((value - mean) ** 2),
    0,
  )
  return roundToTenth(Math.sqrt(squaredDeviation / values.length))
}

function residualSources(
  comparison: EvaluatorScoreComparisonDatum,
): readonly EvaluatorResidualSource[] {
  const observations = comparison.observations
  if (observations.length < 2) return []
  const total = observations.reduce((sum, observation) => sum + observation.score, 0)
  return observations.map((observation) => {
    const leaveOneOutAverage = roundToTenth(
      (total - observation.score) / (observations.length - 1),
    )
    const residual = roundToTenth(observation.score - leaveOneOutAverage)
    return {
      evaluatorId: observation.evaluatorId,
      evaluatorLabel: observation.evaluatorLabel,
      score: observation.score,
      leaveOneOutAverage,
      residual,
      isOutlier: Math.abs(residual) >= EVALUATOR_OUTLIER_DELTA,
    }
  })
}

function ranksByEngineer(
  scores: readonly Readonly<{ engineerId: string; score: number }>[],
): ReadonlyMap<string, number> {
  const ranks = new Map<string, number>()
  let previousScore: number | null = null
  let currentRank = 0
  for (const [index, entry] of scores
    .toSorted((left, right) => (
      left.score === right.score
        ? left.engineerId.localeCompare(right.engineerId)
        : right.score - left.score
    ))
    .entries()) {
    if (previousScore === null || entry.score !== previousScore) {
      currentRank = index + 1
      previousScore = entry.score
    }
    ranks.set(entry.engineerId, currentRank)
  }
  return ranks
}

export function selectEvaluationReliability(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): readonly EvaluationReliabilityDatum[] {
  return selectEvaluatorScoreComparisons(snapshot, cycleId, filters)
    .flatMap((comparison) => {
      if (comparison.submittedCount < 2) return []
      const residuals = residualSources(comparison)
      const leaveOneOutOutlierCount = residuals.filter((entry) => entry.isOutlier).length
      const deviation = standardDeviation(
        comparison.observations.map((observation) => observation.score),
      )
      return [{
        taskId: comparison.taskId,
        taskLabel: comparison.taskLabel,
        engineerId: comparison.engineerId,
        engineerLabel: comparison.engineerLabel,
        teamLabel: comparison.teamLabel,
        consensusScore: comparison.consensusScore,
        evaluatorCount: comparison.submittedCount,
        scoreRange: comparison.scoreRange,
        standardDeviation: deviation,
        leaveOneOutOutlierCount,
        isHighDisagreement:
          comparison.scoreRange >= EVALUATOR_DISAGREEMENT_RANGE ||
          deviation >= EVALUATOR_DISAGREEMENT_STANDARD_DEVIATION ||
          leaveOneOutOutlierCount > 0,
      }]
    })
    .toSorted((left, right) => {
      const taskDifference = left.taskLabel.localeCompare(right.taskLabel, "ko")
      return taskDifference !== 0
        ? taskDifference
        : right.standardDeviation - left.standardDeviation
    })
}

export function selectEvaluatorResiduals(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): readonly EvaluatorResidualDatum[] {
  return selectEvaluatorScoreComparisons(snapshot, cycleId, filters)
    .flatMap((comparison) => residualSources(comparison).map((residual) => ({
      taskId: comparison.taskId,
      taskLabel: comparison.taskLabel,
      engineerId: comparison.engineerId,
      engineerLabel: comparison.engineerLabel,
      teamLabel: comparison.teamLabel,
      ...residual,
    })))
    .toSorted((left, right) => {
      const taskDifference = left.taskLabel.localeCompare(right.taskLabel, "ko")
      if (taskDifference !== 0) return taskDifference
      const engineerDifference = left.engineerLabel.localeCompare(right.engineerLabel, "ko")
      return engineerDifference !== 0
        ? engineerDifference
        : left.evaluatorLabel.localeCompare(right.evaluatorLabel, "ko")
    })
}

function sensitivityRows(
  comparisons: readonly EvaluatorScoreComparisonDatum[],
  evaluatorId: string,
): readonly EvaluatorExclusionSensitivityRowDatum[] {
  const cohort: readonly SensitivityCohortRow[] = comparisons.flatMap((comparison) => {
    const observation = comparison.observations.find(
      (entry) => entry.evaluatorId === evaluatorId,
    )
    if (observation === undefined || comparison.observations.length < 2) return []
    const others = comparison.observations.filter(
      (entry) => entry.evaluatorId !== evaluatorId,
    )
    if (others.length === 0) return []
    return [{
      engineerId: comparison.engineerId,
      engineerLabel: comparison.engineerLabel,
      teamLabel: comparison.teamLabel,
      baselineScore: comparison.consensusScore,
      excludedScore: roundToTenth(average(others.map((entry) => entry.score))),
    }]
  })
  if (cohort.length < 2) return []

  const baselineRanks = ranksByEngineer(cohort.map((entry) => ({
    engineerId: entry.engineerId,
    score: entry.baselineScore,
  })))
  const excludedRanks = ranksByEngineer(cohort.map((entry) => ({
    engineerId: entry.engineerId,
    score: entry.excludedScore,
  })))

  return cohort
    .flatMap((entry) => {
      const baselineRank = baselineRanks.get(entry.engineerId)
      const excludedRank = excludedRanks.get(entry.engineerId)
      if (baselineRank === undefined || excludedRank === undefined) return []
      const scoreDelta = roundToTenth(entry.excludedScore - entry.baselineScore)
      const rankDelta = baselineRank - excludedRank
      return [{
        ...entry,
        scoreDelta,
        baselineRank,
        excludedRank,
        rankDelta,
        isHighImpact: Math.abs(rankDelta) >= EVALUATOR_RANK_SHIFT_ALERT,
      }]
    })
    .toSorted((left, right) => {
      const rankDifference = Math.abs(right.rankDelta) - Math.abs(left.rankDelta)
      return rankDifference !== 0
        ? rankDifference
        : left.baselineRank - right.baselineRank
    })
}

export function selectEvaluatorExclusionSensitivities(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): readonly EvaluatorExclusionSensitivityDatum[] {
  const taskGroups = new Map<string, {
    taskLabel: string
    comparisons: EvaluatorScoreComparisonDatum[]
  }>()
  for (const comparison of selectEvaluatorScoreComparisons(snapshot, cycleId, filters)) {
    if (comparison.submittedCount < 2) continue
    const group = taskGroups.get(comparison.taskId)
    if (group === undefined) {
      taskGroups.set(comparison.taskId, {
        taskLabel: comparison.taskLabel,
        comparisons: [comparison],
      })
    } else {
      group.comparisons.push(comparison)
    }
  }

  return Array.from(taskGroups.entries()).flatMap(([taskId, group]) => {
    const evaluators = new Map<string, string>()
    for (const comparison of group.comparisons) {
      for (const observation of comparison.observations) {
        evaluators.set(observation.evaluatorId, observation.evaluatorLabel)
      }
    }
    return Array.from(evaluators.entries())
      .flatMap(([evaluatorId, evaluatorLabel]) => {
        const rows = sensitivityRows(group.comparisons, evaluatorId)
        if (rows.length < 2) return []
        return [{
          taskId,
          taskLabel: group.taskLabel,
          evaluatorId,
          evaluatorLabel,
          cohortCount: rows.length,
          rows,
        }]
      })
      .toSorted((left, right) => left.evaluatorLabel.localeCompare(right.evaluatorLabel, "ko"))
  })
}
