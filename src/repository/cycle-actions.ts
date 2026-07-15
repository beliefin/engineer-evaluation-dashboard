import type { EvaluationCycle, EvaluationSnapshot, EvaluationTask } from "@/domain"

import {
  createEvaluationCycleInputSchema,
  parseRepositoryInput,
} from "./input-schemas"
import {
  appendAuditEvent,
  createEntityId,
  type MutationContext,
} from "./mutation-context"
import { requireCycle, requireOperator } from "./repository-helpers"
import { createBlankTaskArtifacts } from "./task-actions"
import { RepositoryError, type CreateEvaluationCycleInput } from "./types"

function cloneTasks(
  context: MutationContext,
  sourceCycleId: string,
  targetCycleId: string,
): ReadonlyArray<EvaluationTask> {
  return context.snapshot.tasks
    .filter((task) => task.cycleId === sourceCycleId)
    .map((task) => ({
      ...task,
      id: createEntityId(context, "task"),
      cycleId: targetCycleId,
      items: task.items.map((item) => ({
        ...item,
        id: createEntityId(context, "item"),
      })),
    }))
}

export function createEvaluationCycleAction(
  context: MutationContext,
  input: CreateEvaluationCycleInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(createEvaluationCycleInputSchema, input)
  requireOperator(parsed.actor)
  requireCycle(context.snapshot, parsed.sourceCycleId)
  const duplicate = context.snapshot.cycles.some(
    (cycle) => cycle.name.toLocaleLowerCase("ko-KR") === parsed.name.toLocaleLowerCase("ko-KR"),
  )
  if (duplicate) {
    throw new RepositoryError("INVALID_INPUT", "같은 이름의 평가 시즌이 이미 있습니다.")
  }

  const cycle: EvaluationCycle = {
    id: createEntityId(context, "cycle"),
    name: parsed.name,
    status: parsed.status,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
  }
  const tasks = parsed.copyConfiguration
    ? cloneTasks(context, parsed.sourceCycleId, cycle.id)
    : []
  const baseSnapshot: EvaluationSnapshot = {
    ...context.snapshot,
    cycles: [...context.snapshot.cycles, cycle],
    tasks: [...context.snapshot.tasks, ...tasks],
  }
  const artifacts = tasks.map((task) => createBlankTaskArtifacts(
    { ...context, snapshot: baseSnapshot },
    task,
  ))
  const snapshot: EvaluationSnapshot = {
    ...baseSnapshot,
    assignments: [
      ...baseSnapshot.assignments,
      ...artifacts.flatMap((artifact) => artifact.assignments),
    ],
    scoreSheets: [
      ...baseSnapshot.scoreSheets,
      ...artifacts.flatMap((artifact) => artifact.scoreSheets),
    ],
    directScores: [
      ...baseSnapshot.directScores,
      ...artifacts.flatMap((artifact) => artifact.directScores),
    ],
  }
  return appendAuditEvent(context, snapshot, {
    cycleId: cycle.id,
    type: "cycle_created",
    actor: parsed.actor,
    targetId: cycle.id,
  })
}
