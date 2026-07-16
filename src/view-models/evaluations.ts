import {
  resolveEngineerTaskWeight,
  type EvaluationSnapshot,
  type ScoreSheet,
} from "@/domain"
import type {
  AssignedEvaluationStatus,
  AssignedEvaluationViewModel,
  AutosaveStatus,
  EvaluationScoreFormViewModel,
} from "@/features/evaluations"

import { formatTimestamp } from "./labels"

export type ScoreFormSelectorState = Readonly<{
  autosaveStatus: AutosaveStatus
  proxyEntry: boolean
}>

const DEFAULT_SCORE_FORM_STATE: ScoreFormSelectorState = {
  autosaveStatus: "idle",
  proxyEntry: false,
}

function answeredCount(sheet: ScoreSheet | undefined): number {
  if (sheet?.passResult !== null && sheet?.passResult !== undefined) return 1
  return sheet?.scores.filter((entry) => entry.score !== null).length ?? 0
}

function assignmentStatus(
  sheet: ScoreSheet | undefined,
): AssignedEvaluationStatus {
  if (sheet?.status === "submitted") return "submitted"
  return answeredCount(sheet) > 0 ? "in_progress" : "pending"
}

function statusPriority(status: AssignedEvaluationStatus): number {
  if (status === "in_progress") return 0
  if (status === "pending") return 1
  return 2
}

export function selectAssignedEvaluations(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  evaluatorId?: string,
): ReadonlyArray<AssignedEvaluationViewModel> {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return []

  return snapshot.assignments
    .filter(
      (assignment) =>
        assignment.cycleId === cycleId &&
        (evaluatorId === undefined || assignment.evaluatorId === evaluatorId),
    )
    .flatMap((assignment) => {
      const engineer = snapshot.engineers.find(
        (entry) => entry.id === assignment.engineerId,
      )
      const task = snapshot.tasks.find((entry) => entry.id === assignment.taskId)
      const evaluator = snapshot.evaluators.find(
        (entry) => entry.id === assignment.evaluatorId,
      )
      if (engineer === undefined || task === undefined || evaluator === undefined) return []
      if (resolveEngineerTaskWeight(task, engineer.id, snapshot.engineerTaskWeights) <= 0) {
        return []
      }

      const sheet = snapshot.scoreSheets.find(
        (entry) => entry.assignmentId === assignment.id,
      )
      return [{
        id: assignment.id,
        engineerName: engineer.displayName,
        teamName: engineer.team,
        evaluatorId: evaluator.id,
        evaluatorName: evaluator.displayName,
        categoryLabel: task.name,
        cycleLabel: cycle.name,
        status: assignmentStatus(sheet),
        answeredCount: answeredCount(sheet),
        totalItems: task.method === "evaluator_score" ? task.items.length : 1,
        updatedAtLabel: formatTimestamp(sheet?.updatedAt ?? null) ?? "미저장",
      }]
    })
    .toSorted((left, right) => {
      const statusOrder = statusPriority(left.status) - statusPriority(right.status)
      return statusOrder === 0
        ? left.engineerName.localeCompare(right.engineerName, "ko")
        : statusOrder
    })
}

export function selectEvaluationScoreForm(
  snapshot: EvaluationSnapshot,
  assignmentId: string,
  state: ScoreFormSelectorState = DEFAULT_SCORE_FORM_STATE,
): EvaluationScoreFormViewModel | null {
  const assignment = snapshot.assignments.find(
    (entry) => entry.id === assignmentId,
  )
  if (assignment === undefined) return null

  const cycle = snapshot.cycles.find((entry) => entry.id === assignment.cycleId)
  const engineer = snapshot.engineers.find(
    (entry) => entry.id === assignment.engineerId,
  )
  const evaluator = snapshot.evaluators.find(
    (entry) => entry.id === assignment.evaluatorId,
  )
  const task = snapshot.tasks.find((entry) => entry.id === assignment.taskId)
  if (
    cycle === undefined ||
    engineer === undefined ||
    evaluator === undefined ||
    task === undefined ||
    (task.method !== "evaluator_score" && task.method !== "evaluator_pass_fail")
  ) {
    return null
  }
  if (resolveEngineerTaskWeight(task, engineer.id, snapshot.engineerTaskWeights) <= 0) {
    return null
  }

  const sheet = snapshot.scoreSheets.find(
    (entry) => entry.assignmentId === assignment.id,
  )
  const items = task.items
    .toSorted((left, right) => left.order - right.order)
    .map((item) => ({
      id: item.id,
      index: item.order,
      label: item.label,
      section: item.section,
      criteria: item.criteria,
      value:
        sheet?.scores.find((entry) => entry.itemId === item.id)?.score ?? null,
    }))

  return {
    assignmentId,
    cycleLabel: cycle.name,
    categoryLabel: task.name,
    description: task.description,
    method: task.method,
    engineerName: engineer.displayName,
    teamName: engineer.team,
    evaluatorName: evaluator.displayName,
    proxyEntry: state.proxyEntry,
    items,
    passResult: sheet?.passResult ?? null,
    autosaveStatus: state.autosaveStatus,
    lastSavedAtLabel: formatTimestamp(sheet?.updatedAt ?? null),
    submittedAtLabel: formatTimestamp(sheet?.submittedAt ?? null),
    locked: sheet?.status === "submitted",
  }
}
