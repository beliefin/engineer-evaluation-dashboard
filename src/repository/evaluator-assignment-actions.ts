import { resolveEngineerTaskWeight, type EvaluationSnapshot, type ScoreSheet } from "@/domain"

import { updateEvaluatorAssignmentsInputSchema, parseRepositoryInput } from "./input-schemas"
import { appendAuditEvent, createEntityId, type MutationContext } from "./mutation-context"
import {
  requireCycleUnlocked,
  requireEngineer,
  requireEvaluator,
  requireOperator,
  requireTask,
} from "./repository-helpers"
import { RepositoryError, type UpdateEvaluatorAssignmentsInput } from "./types"

function sheetHasResponse(sheet: ScoreSheet | undefined): boolean {
  return sheet?.status === "submitted" || sheet?.passResult !== null && sheet?.passResult !== undefined ||
    sheet?.scores.some((entry) => entry.score !== null) === true
}

export function updateEvaluatorAssignmentsAction(
  context: MutationContext,
  input: UpdateEvaluatorAssignmentsInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(updateEvaluatorAssignmentsInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireEngineer(context.snapshot, parsed.engineerId)
  const task = requireTask(context.snapshot, parsed.taskId)
  if (task.cycleId !== parsed.cycleId) {
    throw new RepositoryError("INVALID_INPUT", "과제와 평가 시즌이 일치하지 않습니다.")
  }
  if (task.method !== "evaluator_score" && task.method !== "evaluator_pass_fail") {
    throw new RepositoryError("INVALID_INPUT", "평가자 입력 과제만 평가자를 배정할 수 있습니다.")
  }
  if (resolveEngineerTaskWeight(task, parsed.engineerId, context.snapshot.engineerTaskWeights) <= 0) {
    throw new RepositoryError("INVALID_INPUT", "0%로 제외된 과제에는 평가자를 배정할 수 없습니다.")
  }
  parsed.evaluatorWeights.forEach((entry) => requireEvaluator(context.snapshot, entry.evaluatorId))

  const current = context.snapshot.assignments.filter((assignment) =>
    assignment.cycleId === parsed.cycleId &&
    assignment.engineerId === parsed.engineerId &&
    assignment.taskId === parsed.taskId)
  const nextByEvaluator = new Map(
    parsed.evaluatorWeights.map((entry) => [entry.evaluatorId, entry.weight]),
  )
  const removed = current.filter((assignment) => !nextByEvaluator.has(assignment.evaluatorId))
  const removedIds = new Set(removed.map((assignment) => assignment.id))
  for (const assignment of removed) {
    const sheet = context.snapshot.scoreSheets.find((entry) => entry.assignmentId === assignment.id)
    if (sheetHasResponse(sheet)) {
      throw new RepositoryError(
        "TASK_LOCKED",
        "점수가 입력되었거나 제출된 평가 배정은 제거할 수 없습니다.",
      )
    }
  }

  const currentByEvaluator = new Map(current.map((assignment) => [assignment.evaluatorId, assignment]))
  const assignments = context.snapshot.assignments
    .filter((assignment) => !removedIds.has(assignment.id))
    .map((assignment) => {
      if (assignment.engineerId !== parsed.engineerId || assignment.taskId !== parsed.taskId) {
        return assignment
      }
      const weight = nextByEvaluator.get(assignment.evaluatorId)
      return weight === undefined ? assignment : { ...assignment, weight }
    })
  const scoreSheets = context.snapshot.scoreSheets.filter(
    (sheet) => !removedIds.has(sheet.assignmentId),
  )

  for (const definition of parsed.evaluatorWeights) {
    if (currentByEvaluator.has(definition.evaluatorId)) continue
    const assignment = {
      id: createEntityId(context, "assignment"),
      cycleId: parsed.cycleId,
      engineerId: parsed.engineerId,
      evaluatorId: definition.evaluatorId,
      taskId: parsed.taskId,
      weight: definition.weight,
    }
    assignments.push(assignment)
    scoreSheets.push({
      id: createEntityId(context, "sheet"),
      assignmentId: assignment.id,
      status: "draft",
      scores: task.method === "evaluator_score"
        ? task.items.map((item) => ({ itemId: item.id, score: null }))
        : [],
      passResult: null,
      updatedAt: context.now,
      submittedAt: null,
    })
  }

  const scoreSheetIds = new Set(scoreSheets.map((sheet) => sheet.id))
  const snapshot: EvaluationSnapshot = {
    ...context.snapshot,
    assignments,
    scoreSheets,
    unlockRequests: context.snapshot.unlockRequests.filter((request) =>
      scoreSheetIds.has(request.sheetId)),
  }
  return appendAuditEvent(context, snapshot, {
    cycleId: parsed.cycleId,
    type: "evaluator_assignments_updated",
    actor: parsed.actor,
    targetId: `${parsed.engineerId}:${parsed.taskId}`,
  })
}
