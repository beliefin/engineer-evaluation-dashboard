import type { EvaluationSnapshot } from "@/domain"

import {
  deleteEngineerInputSchema,
  parseRepositoryInput,
  updateEngineerInputSchema,
} from "./input-schemas"
import { appendAuditEvent, type MutationContext } from "./mutation-context"
import {
  requireCycleUnlocked,
  requireEngineer,
  requireOperator,
} from "./repository-helpers"
import {
  RepositoryError,
  type DeleteEngineerInput,
  type UpdateEngineerInput,
} from "./types"

function normalizedCode(value: string): string {
  return value.toLocaleUpperCase("en-US")
}

export function updateEngineerAction(
  context: MutationContext,
  input: UpdateEngineerInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(updateEngineerInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireEngineer(context.snapshot, parsed.engineerId)

  const duplicate = context.snapshot.engineers.some((engineer) =>
    engineer.id !== parsed.engineerId &&
    normalizedCode(engineer.employeeCode) === normalizedCode(parsed.employeeCode))
  if (duplicate) {
    throw new RepositoryError(
      "DUPLICATE_EMPLOYEE_CODE",
      `employee code ${parsed.employeeCode} is already registered`,
    )
  }

  const nextSnapshot: EvaluationSnapshot = {
    ...context.snapshot,
    engineers: context.snapshot.engineers.map((engineer) =>
      engineer.id === parsed.engineerId
        ? {
            id: engineer.id,
            employeeCode: parsed.employeeCode,
            displayName: parsed.displayName,
            team: parsed.team,
            position: parsed.position,
          }
        : engineer),
  }
  return appendAuditEvent(context, nextSnapshot, {
    cycleId: parsed.cycleId,
    type: "engineer_updated",
    actor: parsed.actor,
    targetId: parsed.engineerId,
  })
}

export function deleteEngineerAction(
  context: MutationContext,
  input: DeleteEngineerInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(deleteEngineerInputSchema, input)
  requireOperator(parsed.actor)
  requireEngineer(context.snapshot, parsed.engineerId)

  const affectedCycleIds = new Set<string>([parsed.cycleId])
  for (const assignment of context.snapshot.assignments) {
    if (assignment.engineerId === parsed.engineerId) affectedCycleIds.add(assignment.cycleId)
  }
  for (const score of context.snapshot.directScores) {
    if (score.engineerId === parsed.engineerId) affectedCycleIds.add(score.cycleId)
  }
  for (const event of context.snapshot.scheduleEvents) {
    if (event.engineerId === parsed.engineerId) affectedCycleIds.add(event.cycleId)
  }
  for (const weight of context.snapshot.engineerTaskWeights) {
    if (weight.engineerId === parsed.engineerId) affectedCycleIds.add(weight.cycleId)
  }
  for (const record of context.snapshot.languageScoreRecords) {
    if (record.engineerId === parsed.engineerId) affectedCycleIds.add(record.cycleId)
  }
  for (const record of context.snapshot.certificationRecords) {
    if (record.engineerId === parsed.engineerId) affectedCycleIds.add(record.cycleId)
  }
  for (const cycleId of affectedCycleIds) requireCycleUnlocked(context.snapshot, cycleId)

  const assignmentIds = new Set(
    context.snapshot.assignments
      .filter((assignment) => assignment.engineerId === parsed.engineerId)
      .map((assignment) => assignment.id),
  )
  const nextSnapshot: EvaluationSnapshot = {
    ...context.snapshot,
    engineers: context.snapshot.engineers.filter((engineer) => engineer.id !== parsed.engineerId),
    engineerTaskWeights: context.snapshot.engineerTaskWeights.filter(
      (entry) => entry.engineerId !== parsed.engineerId,
    ),
    assignments: context.snapshot.assignments.filter(
      (assignment) => assignment.engineerId !== parsed.engineerId,
    ),
    scoreSheets: context.snapshot.scoreSheets.filter(
      (sheet) => !assignmentIds.has(sheet.assignmentId),
    ),
    directScores: context.snapshot.directScores.filter(
      (score) => score.engineerId !== parsed.engineerId,
    ),
    languageScoreRecords: context.snapshot.languageScoreRecords.filter(
      (record) => record.engineerId !== parsed.engineerId,
    ),
    certificationRecords: context.snapshot.certificationRecords.filter(
      (record) => record.engineerId !== parsed.engineerId,
    ),
    scheduleEvents: context.snapshot.scheduleEvents.filter(
      (event) => event.engineerId !== parsed.engineerId,
    ),
  }
  return appendAuditEvent(context, nextSnapshot, {
    cycleId: parsed.cycleId,
    type: "engineer_deleted",
    actor: parsed.actor,
    targetId: parsed.engineerId,
  })
}
