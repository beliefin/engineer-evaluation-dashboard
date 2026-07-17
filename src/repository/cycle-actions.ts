import type { EvaluationCycle, EvaluationSnapshot, EvaluationTask } from "@/domain"

import {
  createEvaluationCycleInputSchema,
  deleteEvaluationCycleInputSchema,
  setEvaluationCycleLockInputSchema,
  updateEvaluationCycleInputSchema,
  parseRepositoryInput,
} from "./input-schemas"
import {
  appendAuditEvent,
  createEntityId,
  type MutationContext,
} from "./mutation-context"
import { requireCycle, requireOperator } from "./repository-helpers"
import { createBlankTaskArtifacts } from "./task-actions"
import {
  RepositoryError,
  type CreateEvaluationCycleInput,
  type DeleteEvaluationCycleInput,
  type SetEvaluationCycleLockInput,
  type UpdateEvaluationCycleInput,
} from "./types"

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
    locked: false,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
  }
  const tasks = parsed.copyConfiguration
    ? cloneTasks(context, parsed.sourceCycleId, cycle.id)
    : []
  const sourceTaskIds = new Set(
    context.snapshot.tasks.filter((task) => task.cycleId === parsed.sourceCycleId).map((task) => task.id),
  )
  const clonedTaskIdBySource = new Map(
    context.snapshot.tasks
      .filter((task) => sourceTaskIds.has(task.id))
      .map((task, index) => [task.id, tasks[index]?.id] as const)
      .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
  )
  const rules = parsed.copyConfiguration
    ? context.snapshot.directScoreRules
      .filter((rule) => rule.cycleId === parsed.sourceCycleId)
      .flatMap((rule) => {
        const taskId = clonedTaskIdBySource.get(rule.taskId)
        return taskId === undefined ? [] : [{ ...rule, id: createEntityId(context, "score-rule"), cycleId: cycle.id, taskId }]
      })
    : []
  const derivedRules = parsed.copyConfiguration
    ? context.snapshot.derivedScoreRules
      .filter((rule) => rule.cycleId === parsed.sourceCycleId)
      .flatMap((rule) => {
        const taskId = clonedTaskIdBySource.get(rule.taskId)
        const sourceTaskId = clonedTaskIdBySource.get(rule.sourceTaskId)
        return taskId === undefined || sourceTaskId === undefined
          ? []
          : [{
              ...rule,
              id: createEntityId(context, "derived-rule"),
              cycleId: cycle.id,
              taskId,
              sourceTaskId,
            }]
      })
    : []
  const baseSnapshot: EvaluationSnapshot = {
    ...context.snapshot,
    cycles: [...context.snapshot.cycles, cycle],
    tasks: [...context.snapshot.tasks, ...tasks],
    directScoreRules: [...context.snapshot.directScoreRules, ...rules],
    derivedScoreRules: [...context.snapshot.derivedScoreRules, ...derivedRules],
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

export function updateEvaluationCycleAction(
  context: MutationContext,
  input: UpdateEvaluationCycleInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(updateEvaluationCycleInputSchema, input)
  requireOperator(parsed.actor)
  const cycle = requireCycle(context.snapshot, parsed.cycleId)
  if (cycle.locked) {
    throw new RepositoryError("TASK_LOCKED", "잠긴 평가 시즌은 설정을 수정할 수 없습니다.")
  }
  const nextCycle: EvaluationCycle = {
    ...cycle,
    name: parsed.name,
    status: parsed.status,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
  }
  return appendAuditEvent(context, {
    ...context.snapshot,
    cycles: context.snapshot.cycles.map((entry) => entry.id === cycle.id ? nextCycle : entry),
  }, {
    cycleId: cycle.id,
    type: "cycle_updated",
    actor: parsed.actor,
    targetId: cycle.id,
  })
}

export function setEvaluationCycleLockAction(
  context: MutationContext,
  input: SetEvaluationCycleLockInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(setEvaluationCycleLockInputSchema, input)
  requireOperator(parsed.actor)
  const cycle = requireCycle(context.snapshot, parsed.cycleId)
  if (cycle.locked === parsed.locked) return context.snapshot
  return appendAuditEvent(context, {
    ...context.snapshot,
    cycles: context.snapshot.cycles.map((entry) => entry.id === cycle.id
      ? { ...entry, locked: parsed.locked }
      : entry),
  }, {
    cycleId: cycle.id,
    type: parsed.locked ? "cycle_locked" : "cycle_unlocked",
    actor: parsed.actor,
    targetId: cycle.id,
  })
}

export function deleteEvaluationCycleAction(
  context: MutationContext,
  input: DeleteEvaluationCycleInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(deleteEvaluationCycleInputSchema, input)
  requireOperator(parsed.actor)
  const cycle = requireCycle(context.snapshot, parsed.cycleId)
  if (context.snapshot.cycles.length <= 1) {
    throw new RepositoryError("INVALID_INPUT", "최소 하나의 평가 시즌은 유지해야 합니다.")
  }
  if (cycle.locked) {
    throw new RepositoryError("TASK_LOCKED", "잠긴 평가 시즌은 삭제하기 전에 잠금을 해제해야 합니다.")
  }
  if (cycle.status === "active") {
    throw new RepositoryError("INVALID_INPUT", "진행 중인 평가 시즌은 삭제할 수 없습니다. 먼저 설정 중 또는 종료 상태로 변경해 주세요.")
  }
  const assignmentIds = new Set(
    context.snapshot.assignments
      .filter((assignment) => assignment.cycleId === cycle.id)
      .map((assignment) => assignment.id),
  )
  if (context.snapshot.scoreSheets.some(
    (sheet) => assignmentIds.has(sheet.assignmentId) && sheet.status === "submitted",
  )) {
    throw new RepositoryError("TASK_LOCKED", "제출된 평가가 있는 평가 시즌은 삭제할 수 없습니다.")
  }
  const next = {
    ...context.snapshot,
    cycles: context.snapshot.cycles.filter((entry) => entry.id !== cycle.id),
    tasks: context.snapshot.tasks.filter((task) => task.cycleId !== cycle.id),
    engineerTaskWeights: context.snapshot.engineerTaskWeights.filter((entry) => entry.cycleId !== cycle.id),
    directScoreRules: context.snapshot.directScoreRules.filter((rule) => rule.cycleId !== cycle.id),
    derivedScoreRules: context.snapshot.derivedScoreRules.filter((rule) => rule.cycleId !== cycle.id),
    assignments: context.snapshot.assignments.filter((entry) => entry.cycleId !== cycle.id),
    scoreSheets: context.snapshot.scoreSheets.filter((entry) => !assignmentIds.has(entry.assignmentId)),
    unlockRequests: context.snapshot.unlockRequests.filter((entry) => entry.cycleId !== cycle.id),
    directScores: context.snapshot.directScores.filter((entry) => entry.cycleId !== cycle.id),
    scoreAdjustments: context.snapshot.scoreAdjustments.filter((entry) => entry.cycleId !== cycle.id),
    languageScoreRecords: context.snapshot.languageScoreRecords.filter((entry) => entry.cycleId !== cycle.id),
    certificationRecords: context.snapshot.certificationRecords.filter((entry) => entry.cycleId !== cycle.id),
    scheduleEvents: context.snapshot.scheduleEvents.filter((entry) => entry.cycleId !== cycle.id),
  }
  return appendAuditEvent(context, next, {
    cycleId: cycle.id,
    type: "cycle_deleted",
    actor: parsed.actor,
    targetId: cycle.id,
  })
}
