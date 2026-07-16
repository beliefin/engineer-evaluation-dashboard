import type { EvaluationSnapshot } from "@/domain"

import {
  deleteEvaluatorInputSchema,
  parseRepositoryInput,
  updateEvaluatorInputSchema,
} from "./input-schemas"
import { appendAuditEvent, type MutationContext } from "./mutation-context"
import {
  requireCycleUnlocked,
  requireEvaluator,
  requireOperator,
} from "./repository-helpers"
import {
  RepositoryError,
  type DeleteEvaluatorInput,
  type UpdateEvaluatorInput,
} from "./types"

function normalizedCode(value: string): string {
  return value.toLocaleUpperCase("en-US")
}

export function updateEvaluatorAction(
  context: MutationContext,
  input: UpdateEvaluatorInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(updateEvaluatorInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireEvaluator(context.snapshot, parsed.evaluatorId)

  const duplicate = context.snapshot.evaluators.some((evaluator) =>
    evaluator.id !== parsed.evaluatorId &&
    normalizedCode(evaluator.employeeCode) === normalizedCode(parsed.employeeCode))
  if (duplicate) {
    throw new RepositoryError(
      "DUPLICATE_EMPLOYEE_CODE",
      `employee code ${parsed.employeeCode} is already registered`,
    )
  }

  const nextSnapshot: EvaluationSnapshot = {
    ...context.snapshot,
    evaluators: context.snapshot.evaluators.map((evaluator) =>
      evaluator.id === parsed.evaluatorId
        ? {
            id: evaluator.id,
            employeeCode: parsed.employeeCode,
            displayName: parsed.displayName,
            division: parsed.division,
            team: parsed.team,
            department: parsed.department,
            organizationUnit: evaluator.organizationUnit,
            rank: evaluator.rank,
            jobTitle: evaluator.jobTitle,
          }
        : evaluator),
  }
  return appendAuditEvent(context, nextSnapshot, {
    cycleId: parsed.cycleId,
    type: "evaluator_updated",
    actor: parsed.actor,
    targetId: parsed.evaluatorId,
  })
}

export function deleteEvaluatorAction(
  context: MutationContext,
  input: DeleteEvaluatorInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(deleteEvaluatorInputSchema, input)
  requireOperator(parsed.actor)
  requireEvaluator(context.snapshot, parsed.evaluatorId)

  const affectedCycleIds = new Set<string>([parsed.cycleId])
  for (const task of context.snapshot.tasks) {
    if (task.evaluatorWeights.some((entry) => entry.evaluatorId === parsed.evaluatorId)) {
      affectedCycleIds.add(task.cycleId)
    }
  }
  for (const assignment of context.snapshot.assignments) {
    if (assignment.evaluatorId === parsed.evaluatorId) affectedCycleIds.add(assignment.cycleId)
  }
  for (const cycleId of affectedCycleIds) requireCycleUnlocked(context.snapshot, cycleId)

  const assignmentIds = new Set(
    context.snapshot.assignments
      .filter((assignment) => assignment.evaluatorId === parsed.evaluatorId)
      .map((assignment) => assignment.id),
  )
  const nextSnapshot: EvaluationSnapshot = {
    ...context.snapshot,
    evaluators: context.snapshot.evaluators.filter(
      (evaluator) => evaluator.id !== parsed.evaluatorId,
    ),
    tasks: context.snapshot.tasks.map((task) => ({
      ...task,
      evaluatorWeights: task.evaluatorWeights.filter(
        (entry) => entry.evaluatorId !== parsed.evaluatorId,
      ),
    })),
    assignments: context.snapshot.assignments.filter(
      (assignment) => assignment.evaluatorId !== parsed.evaluatorId,
    ),
    scoreSheets: context.snapshot.scoreSheets.filter(
      (sheet) => !assignmentIds.has(sheet.assignmentId),
    ),
  }
  return appendAuditEvent(context, nextSnapshot, {
    cycleId: parsed.cycleId,
    type: "evaluator_deleted",
    actor: parsed.actor,
    targetId: parsed.evaluatorId,
  })
}
