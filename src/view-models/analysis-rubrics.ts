import {
  resolveEngineerTaskWeight,
  scoreSheetValue,
  type EvaluationSnapshot,
  type EvaluatorAssignment,
} from "@/domain"
import type {
  AnalysisFilterState,
  EvaluatorCalibrationDatum,
  EvaluatorDeviationDatum,
  EvaluatorScoreComparisonDatum,
  EvaluatorScoreObservationDatum,
  RubricItemAverageDatum,
} from "@/features/analysis"

import {
  averageScore,
  normalizeAnalysisFilters,
  selectFilteredSummaries,
  selectedCategory,
} from "./analysis-common"

export const EVALUATOR_OUTLIER_DELTA = 10

function selectedEvaluationTaskIds(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<string> {
  const taskId = selectedCategory(snapshot, filters)
  if (taskId !== null) {
    const task = snapshot.tasks.find((entry) => entry.id === taskId)
    return task?.method.startsWith("evaluator") === true ? [taskId] : []
  }
  return snapshot.tasks
    .filter((task) => task.cycleId === cycleId && task.method.startsWith("evaluator"))
    .map((task) => task.id)
}

function selectAssignments(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<EvaluatorAssignment> {
  const normalized = normalizeAnalysisFilters(snapshot, filters)
  const engineerIds = new Set(
    selectFilteredSummaries(snapshot, cycleId, normalized).map(
      (summary) => summary.engineer.id,
    ),
  )
  const taskIds = selectedEvaluationTaskIds(snapshot, cycleId, normalized)
  return snapshot.assignments.filter(
    (assignment) => {
      const task = snapshot.tasks.find((entry) => entry.id === assignment.taskId)
      return assignment.cycleId === cycleId &&
        engineerIds.has(assignment.engineerId) &&
        taskIds.includes(assignment.taskId) &&
        task !== undefined &&
        resolveEngineerTaskWeight(
          task,
          assignment.engineerId,
          snapshot.engineerTaskWeights,
        ) > 0
    },
  )
}

export function selectRubricItemAverages(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<RubricItemAverageDatum> {
  const assignments = selectAssignments(snapshot, cycleId, filters)
  const submitted = assignments.flatMap((assignment) => {
    const sheet = snapshot.scoreSheets.find(
      (entry) => entry.assignmentId === assignment.id,
    )
    if (sheet?.status !== "submitted") return []
    return [{ assignment, sheet }]
  })

  const items = snapshot.tasks
    .filter((task) => task.cycleId === cycleId && task.method === "evaluator_score")
    .filter((task) => selectedEvaluationTaskIds(snapshot, cycleId, normalizeAnalysisFilters(snapshot, filters)).includes(task.id))
    .flatMap((task) => task.items.map((item) => ({
      taskId: task.id,
      taskLabel: task.name,
      item,
    })))
  return items.flatMap(({ taskId, taskLabel, item }) => {
    const values = submitted.flatMap(({ assignment, sheet }) => {
      if (assignment.taskId !== taskId) return []
      const score = sheet.scores.find((entry) => entry.itemId === item.id)?.score
      return score === null || score === undefined ? [] : [score * 10]
    })
    if (values.length === 0) return []
    return [{
      taskId,
      taskLabel,
      itemNumber: item.order,
      label: item.label,
      score: averageScore(values),
      responseCount: values.length,
    }]
  })
}

type ScoreObservation = Readonly<{
  evaluatorId: string
  taskId: string
  score: number
}>

type SubmittedEvaluatorScoreObservation = Readonly<{
  taskId: string
  taskLabel: string
  engineerId: string
  engineerLabel: string
  teamLabel: string
  evaluatorId: string
  evaluatorLabel: string
  score: number
}>

type ComparisonAccumulator = {
  taskId: string
  taskLabel: string
  engineerId: string
  engineerLabel: string
  teamLabel: string
  observations: SubmittedEvaluatorScoreObservation[]
}

type CalibrationAccumulator = {
  taskId: string
  taskLabel: string
  evaluatorId: string
  evaluatorLabel: string
  observations: EvaluatorScoreObservationDatum[]
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function selectObservations(
  snapshot: EvaluationSnapshot,
  assignments: readonly EvaluatorAssignment[],
): ReadonlyArray<ScoreObservation> {
  return assignments.flatMap((assignment) => {
    const sheet = snapshot.scoreSheets.find(
      (entry) => entry.assignmentId === assignment.id,
    )
    if (sheet?.status !== "submitted") return []
    const task = snapshot.tasks.find((entry) => entry.id === assignment.taskId)
    if (task === undefined) return []
    const score = scoreSheetValue(task, sheet)
    return score === null
      ? []
      : [{ evaluatorId: assignment.evaluatorId, taskId: assignment.taskId, score }]
  })
}

function selectSubmittedEvaluatorScoreObservations(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<SubmittedEvaluatorScoreObservation> {
  const taskById = new Map(snapshot.tasks.map((task) => [task.id, task]))
  const engineerById = new Map(
    snapshot.engineers.map((engineer) => [engineer.id, engineer]),
  )
  const evaluatorById = new Map(
    snapshot.evaluators.map((evaluator) => [evaluator.id, evaluator]),
  )
  const sheetByAssignmentId = new Map(
    snapshot.scoreSheets.map((sheet) => [sheet.assignmentId, sheet]),
  )

  return selectAssignments(snapshot, cycleId, filters).flatMap((assignment) => {
    const task = taskById.get(assignment.taskId)
    const engineer = engineerById.get(assignment.engineerId)
    const evaluator = evaluatorById.get(assignment.evaluatorId)
    const sheet = sheetByAssignmentId.get(assignment.id)
    if (
      task?.method !== "evaluator_score" ||
      engineer === undefined ||
      evaluator === undefined ||
      sheet?.status !== "submitted"
    ) {
      return []
    }
    const score = scoreSheetValue(task, sheet)
    return score === null
      ? []
      : [{
        taskId: task.id,
        taskLabel: task.name,
        engineerId: engineer.id,
        engineerLabel: engineer.displayName,
        teamLabel: engineer.team,
        evaluatorId: evaluator.id,
        evaluatorLabel: evaluator.displayName,
        score,
      }]
  })
}

export function selectEvaluatorScoreComparisons(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<EvaluatorScoreComparisonDatum> {
  const groups = new Map<string, ComparisonAccumulator>()
  for (const observation of selectSubmittedEvaluatorScoreObservations(
    snapshot,
    cycleId,
    filters,
  )) {
    const key = `${observation.taskId}:${observation.engineerId}`
    const group = groups.get(key)
    if (group === undefined) {
      groups.set(key, {
        taskId: observation.taskId,
        taskLabel: observation.taskLabel,
        engineerId: observation.engineerId,
        engineerLabel: observation.engineerLabel,
        teamLabel: observation.teamLabel,
        observations: [observation],
      })
    } else {
      group.observations.push(observation)
    }
  }

  const taskOrder = new Map(
    snapshot.tasks.map((task) => [task.id, task.order]),
  )
  return Array.from(groups.values())
    .map((group) => {
      const scores = group.observations.map((observation) => observation.score)
      const consensusScore = averageScore(scores)
      const observations = group.observations
        .toSorted((left, right) =>
          left.evaluatorLabel.localeCompare(right.evaluatorLabel, "ko"),
        )
        .map<EvaluatorScoreObservationDatum>((observation) => {
          const deltaFromConsensus = roundToTenth(
            observation.score - consensusScore,
          )
          return {
            evaluatorId: observation.evaluatorId,
            evaluatorLabel: observation.evaluatorLabel,
            score: observation.score,
            deltaFromConsensus,
            isOutlier: Math.abs(deltaFromConsensus) >= EVALUATOR_OUTLIER_DELTA,
          }
        })
      const minimumScore = Math.min(...scores)
      const maximumScore = Math.max(...scores)
      return {
        taskId: group.taskId,
        taskLabel: group.taskLabel,
        engineerId: group.engineerId,
        engineerLabel: group.engineerLabel,
        teamLabel: group.teamLabel,
        consensusScore,
        minimumScore,
        maximumScore,
        scoreRange: roundToTenth(maximumScore - minimumScore),
        submittedCount: observations.length,
        outlierCount: observations.filter((observation) => observation.isOutlier)
          .length,
        observations,
      }
    })
    .toSorted((left, right) => {
      const taskDifference =
        (taskOrder.get(left.taskId) ?? 0) - (taskOrder.get(right.taskId) ?? 0)
      return taskDifference !== 0
        ? taskDifference
        : left.engineerLabel.localeCompare(right.engineerLabel, "ko")
    })
}

export function selectEvaluatorCalibrations(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<EvaluatorCalibrationDatum> {
  const groups = new Map<string, CalibrationAccumulator>()
  for (const comparison of selectEvaluatorScoreComparisons(
    snapshot,
    cycleId,
    filters,
  )) {
    if (comparison.submittedCount < 2) continue
    for (const observation of comparison.observations) {
      const key = `${comparison.taskId}:${observation.evaluatorId}`
      const group = groups.get(key)
      if (group === undefined) {
        groups.set(key, {
          taskId: comparison.taskId,
          taskLabel: comparison.taskLabel,
          evaluatorId: observation.evaluatorId,
          evaluatorLabel: observation.evaluatorLabel,
          observations: [observation],
        })
      } else {
        group.observations.push(observation)
      }
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      taskId: group.taskId,
      taskLabel: group.taskLabel,
      evaluatorId: group.evaluatorId,
      evaluatorLabel: group.evaluatorLabel,
      averageScore: averageScore(
        group.observations.map((observation) => observation.score),
      ),
      meanSignedDelta: averageScore(
        group.observations.map((observation) => observation.deltaFromConsensus),
      ),
      meanAbsoluteDelta: averageScore(
        group.observations.map((observation) =>
          Math.abs(observation.deltaFromConsensus),
        ),
      ),
      comparisonCount: group.observations.length,
      outlierCount: group.observations.filter((observation) => observation.isOutlier)
        .length,
    }))
    .toSorted((left, right) => {
      const taskDifference = left.taskLabel.localeCompare(right.taskLabel, "ko")
      return taskDifference !== 0
        ? taskDifference
        : left.evaluatorLabel.localeCompare(right.evaluatorLabel, "ko")
    })
}

export function selectEvaluatorDeviations(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): ReadonlyArray<EvaluatorDeviationDatum> {
  const observations = selectObservations(
    snapshot,
    selectAssignments(snapshot, cycleId, filters),
  )
  const taskMeans = new Map<string, number>()
  const observedTaskIds = new Set(observations.map((entry) => entry.taskId))
  const taskIds = snapshot.tasks
    .filter((task) => task.cycleId === cycleId && observedTaskIds.has(task.id))
    .toSorted((left, right) => left.order - right.order)
    .map((task) => task.id)
  for (const taskId of taskIds) {
    const values = observations
      .filter((entry) => entry.taskId === taskId)
      .map((entry) => entry.score)
    if (values.length > 0) taskMeans.set(taskId, averageScore(values))
  }

  return taskIds.flatMap((taskId) => {
    const task = snapshot.tasks.find((entry) => entry.id === taskId)
    if (task === undefined) return []
    return snapshot.evaluators.flatMap((evaluator) => {
      const values = observations.filter(
        (entry) => entry.taskId === taskId && entry.evaluatorId === evaluator.id,
      )
      if (values.length === 0) return []
      const deviations = values.map((entry) =>
        Math.abs(entry.score - (taskMeans.get(taskId) ?? entry.score)),
      )
      return [{
        taskId,
        taskLabel: task.name,
        evaluatorId: evaluator.id,
        evaluatorLabel: evaluator.displayName,
        averageScore: averageScore(values.map((entry) => entry.score)),
        meanAbsoluteDeviation: averageScore(deviations),
        sheetCount: values.length,
      }]
    })
  })
}
