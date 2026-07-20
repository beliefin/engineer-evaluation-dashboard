import {
  resolveEngineerTaskWeight,
  scoreSheetValue,
  type EvaluationSnapshot,
  type EvaluatorAssignment,
} from "@/domain"
import type {
  AnalysisFilterState,
  EvaluatorDeviationDatum,
  RubricItemAverageDatum,
} from "@/features/analysis"

import {
  averageScore,
  normalizeAnalysisFilters,
  selectFilteredSummaries,
  selectedCategory,
} from "./analysis-common"

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
