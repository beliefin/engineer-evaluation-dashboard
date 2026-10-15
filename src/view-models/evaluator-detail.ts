import { scoreSheetValue, type EvaluationSnapshot } from "@/domain"

import { EVALUATOR_OUTLIER_DELTA } from "./analysis-rubrics"
import { displayEvaluationTaskName } from "./labels"
import {
  EVALUATOR_DISAGREEMENT_STANDARD_DEVIATION,
  selectEvaluatorResiduals,
} from "./analysis-reliability"
import type {
  EvaluatorConsistency,
  EvaluatorDetailViewModel,
  EvaluatorRecentEvaluation,
} from "./evaluator-detail.types"

export type {
  EvaluatorConsistency,
  EvaluatorDetailViewModel,
  EvaluatorItemProfile,
  EvaluatorRecentEvaluation,
  EvaluatorTaskTendency,
} from "./evaluator-detail.types"

const ALL_FILTERS = { team: "all", category: "all", status: "all" } as const

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function average(values: readonly number[]): number | null {
  return values.length === 0
    ? null
    : round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const ordered = values.toSorted((left, right) => left - right)
  const middle = Math.floor(ordered.length / 2)
  const upper = ordered[middle]
  if (upper === undefined) return null
  if (ordered.length % 2 === 1) return round(upper)
  const lower = ordered[middle - 1]
  return lower === undefined ? null : round((lower + upper) / 2)
}

function standardDeviation(values: readonly number[]): number | null {
  const mean = average(values)
  if (mean === null) return null
  return round(Math.sqrt(values.reduce(
    (sum, value) => sum + ((value - mean) ** 2),
    0,
  ) / values.length))
}

function consistency(
  comparisonCount: number,
  residualStandardDeviation: number | null,
  outlierCount: number,
): EvaluatorConsistency {
  if (comparisonCount < 3 || residualStandardDeviation === null) {
    return {
      status: "limited",
      label: "표본 부족",
      detail: "동일 대상의 동료 비교가 3건 이상 쌓이면 안정성을 판단합니다.",
    }
  }
  if (
    residualStandardDeviation >= EVALUATOR_DISAGREEMENT_STANDARD_DEVIATION ||
    outlierCount > 0
  ) {
    return {
      status: "review",
      label: "확인 필요",
      detail: `잔차 표준편차 ${residualStandardDeviation.toFixed(1)}점, ${EVALUATOR_OUTLIER_DELTA}점 이상 이탈 ${outlierCount}건입니다.`,
    }
  }
  return {
      status: "stable",
      label: "안정적",
      detail: `잔차 표준편차 ${residualStandardDeviation.toFixed(1)}점이며 ${EVALUATOR_OUTLIER_DELTA}점 이상 이탈이 없습니다.`,
  }
}

export function selectEvaluatorDetail(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  evaluatorId: string,
): EvaluatorDetailViewModel | null {
  const evaluator = snapshot.evaluators.find((entry) => entry.id === evaluatorId)
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (evaluator === undefined || cycle === undefined) return null

  const taskById = new Map(snapshot.tasks.map((task) => [task.id, task]))
  const engineerById = new Map(snapshot.engineers.map((engineer) => [engineer.id, engineer]))
  const sheetByAssignmentId = new Map(snapshot.scoreSheets.map((sheet) => [sheet.assignmentId, sheet]))
  const assignments = snapshot.assignments.filter((assignment) =>
    assignment.cycleId === cycleId && assignment.evaluatorId === evaluatorId)
  const submitted = assignments.flatMap((assignment) => {
    const sheet = sheetByAssignmentId.get(assignment.id)
    const task = taskById.get(assignment.taskId)
    const engineer = engineerById.get(assignment.engineerId)
    if (sheet?.status !== "submitted" || task === undefined || engineer === undefined) return []
    const score = scoreSheetValue(task, sheet)
    return [{ assignment, sheet, task, engineer, score }]
  })
  const scored = submitted.filter((entry) => entry.score !== null)
  const residuals = selectEvaluatorResiduals(snapshot, cycleId, ALL_FILTERS)
    .filter((entry) => entry.evaluatorId === evaluatorId)
  const residualByTarget = new Map(residuals.map((entry) => [
    `${entry.taskId}:${entry.engineerId}`,
    entry,
  ]))
  const residualValues = residuals.map((entry) => entry.residual)
  const residualStandardDeviation = standardDeviation(residualValues)
  const outlierCount = residuals.filter((entry) => entry.isOutlier).length

  const taskTendencies = Array.from(new Set(scored.map((entry) => entry.task.id)))
    .flatMap((taskId) => {
      const rows = scored.filter((entry) => entry.task.id === taskId)
      const task = taskById.get(taskId)
      if (task === undefined) return []
      const taskResiduals = residuals.filter((entry) => entry.taskId === taskId)
      return [{
        taskId,
        taskLabel: displayEvaluationTaskName(task.name),
        evaluationCount: rows.length,
        averageScore: average(rows.flatMap((entry) => entry.score === null ? [] : [entry.score])) ?? 0,
        peerAverage: average(taskResiduals.map((entry) => entry.leaveOneOutAverage)),
        meanResidual: average(taskResiduals.map((entry) => entry.residual)),
        meanAbsoluteResidual: average(taskResiduals.map((entry) => Math.abs(entry.residual))),
        residualStandardDeviation: standardDeviation(taskResiduals.map((entry) => entry.residual)),
        outlierCount: taskResiduals.filter((entry) => entry.isOutlier).length,
      }]
    })
    .toSorted((left, right) => left.taskLabel.localeCompare(right.taskLabel, "ko"))

  const peerAssignments = snapshot.assignments.filter((assignment) =>
    assignment.cycleId === cycleId && assignment.evaluatorId !== evaluatorId)
  const itemProfiles = taskTendencies.flatMap((tendency) => {
    const task = taskById.get(tendency.taskId)
    if (task?.method !== "evaluator_score") return []
    return task.items.toSorted((left, right) => left.order - right.order).flatMap((item) => {
      const evaluatorValues = submitted.flatMap((entry) => {
        if (entry.task.id !== task.id) return []
        const value = entry.sheet.scores.find((score) => score.itemId === item.id)?.score
        return value === null || value === undefined ? [] : [value * 10]
      })
      if (evaluatorValues.length === 0) return []
      const peerValues = peerAssignments.flatMap((assignment) => {
        if (assignment.taskId !== task.id) return []
        const sheet = sheetByAssignmentId.get(assignment.id)
        if (sheet?.status !== "submitted") return []
        const value = sheet.scores.find((score) => score.itemId === item.id)?.score
        return value === null || value === undefined ? [] : [value * 10]
      })
      const evaluatorAverage = average(evaluatorValues) ?? 0
      const peerAverage = average(peerValues)
      return [{
        taskId: task.id,
        taskLabel: displayEvaluationTaskName(task.name),
        itemId: item.id,
        itemNumber: item.order,
        itemLabel: item.label,
        evaluatorAverage,
        peerAverage,
        delta: peerAverage === null ? null : round(evaluatorAverage - peerAverage),
        responseCount: evaluatorValues.length,
      }]
    })
  })

  const recentEvaluations = scored.map<EvaluatorRecentEvaluation>((entry) => {
    const residual = residualByTarget.get(`${entry.task.id}:${entry.engineer.id}`)
    return {
      assignmentId: entry.assignment.id,
      engineerId: entry.engineer.id,
      engineerLabel: entry.engineer.displayName,
      teamLabel: entry.engineer.team,
      taskId: entry.task.id,
      taskLabel: displayEvaluationTaskName(entry.task.name),
      score: entry.score ?? 0,
      peerAverage: residual?.leaveOneOutAverage ?? null,
      residual: residual?.residual ?? null,
      isOutlier: residual?.isOutlier ?? false,
      submittedAt: entry.sheet.submittedAt ?? entry.sheet.updatedAt,
    }
  }).toSorted((left, right) => right.submittedAt.localeCompare(left.submittedAt))

  const scores = scored.flatMap((entry) => entry.score === null ? [] : [entry.score])
  const meanSignedResidual = average(residualValues)
  const strongestTask = taskTendencies.toSorted((left, right) =>
    Math.abs(right.meanResidual ?? 0) - Math.abs(left.meanResidual ?? 0))[0]
  const strongestItem = itemProfiles.toSorted((left, right) =>
    Math.abs(right.delta ?? 0) - Math.abs(left.delta ?? 0))[0]
  const characteristics = scores.length === 0
    ? ["제출된 점수형 평가가 없어 평가 성향을 계산할 수 없습니다."]
    : [
      meanSignedResidual === null
        ? "동일 대상을 평가한 동료 표본이 없어 상대 성향은 아직 계산하지 않습니다."
        : `동일 대상의 동료 평균보다 ${Math.abs(meanSignedResidual).toFixed(1)}점 ${meanSignedResidual >= 0 ? "높게" : "낮게"} 평가하는 경향입니다.`,
      consistency(residuals.length, residualStandardDeviation, outlierCount).detail,
      strongestTask?.meanResidual === null || strongestTask?.meanResidual === undefined
        ? "과제별 동료 비교 표본이 충분하지 않습니다."
        : `${strongestTask.taskLabel}에서 동료 평균과의 차이가 가장 큽니다 (${strongestTask.meanResidual >= 0 ? "+" : ""}${strongestTask.meanResidual.toFixed(1)}점).`,
      strongestItem?.delta === null || strongestItem?.delta === undefined
        ? "문항별 비교 표본이 충분하지 않습니다."
        : `${strongestItem.taskLabel}의 ${strongestItem.itemNumber}번 문항에서 다른 평가자 평균과 가장 큰 차이를 보입니다 (${strongestItem.delta >= 0 ? "+" : ""}${strongestItem.delta.toFixed(1)}점).`,
    ]

  return {
    evaluator,
    cycleName: cycle.name,
    summary: {
      assignedCount: assignments.length,
      submittedCount: submitted.length,
      uniqueEngineerCount: new Set(submitted.map((entry) => entry.engineer.id)).size,
      scoredCount: scores.length,
      averageScore: average(scores),
      medianScore: median(scores),
      minimumScore: scores.length === 0 ? null : Math.min(...scores),
      maximumScore: scores.length === 0 ? null : Math.max(...scores),
      comparisonCount: residuals.length,
      meanSignedResidual,
      meanAbsoluteResidual: average(residualValues.map((value) => Math.abs(value))),
      residualStandardDeviation,
      outlierCount,
      consistency: consistency(residuals.length, residualStandardDeviation, outlierCount),
    },
    taskTendencies,
    itemProfiles,
    recentEvaluations,
    characteristics,
  }
}
