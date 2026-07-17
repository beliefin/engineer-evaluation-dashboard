import type {
  DirectScore,
  EvaluationSnapshot,
  EvaluationTask,
  EvaluatorAssignment,
  ScoreSheet,
} from "@/domain"

import {
  deleteEvaluationTaskInputSchema,
  parseRepositoryInput,
  saveEvaluationTaskInputSchema,
} from "./input-schemas"
import {
  appendAuditEvent,
  createEntityId,
  type MutationContext,
} from "./mutation-context"
import {
  requireCycleUnlocked,
  requireOperator,
  requireTask,
} from "./repository-helpers"
import {
  RepositoryError,
  type DeleteEvaluationTaskInput,
  type SaveEvaluationTaskInput,
} from "./types"

type TaskArtifacts = Readonly<{
  assignments: ReadonlyArray<EvaluatorAssignment>
  scoreSheets: ReadonlyArray<ScoreSheet>
  directScores: ReadonlyArray<DirectScore>
}>

function isEvaluatorTask(task: EvaluationTask): boolean {
  return task.method === "evaluator_score" || task.method === "evaluator_pass_fail"
}

function isDirectInputTask(task: EvaluationTask): boolean {
  return task.method === "operator_score" || task.method === "operator_pass_fail"
}

export function createBlankTaskArtifacts(
  context: MutationContext,
  task: EvaluationTask,
): TaskArtifacts {
  if (isDirectInputTask(task)) {
    return {
      assignments: [],
      scoreSheets: [],
      directScores: context.snapshot.engineers.map((engineer) => ({
        id: createEntityId(context, "direct"),
        cycleId: task.cycleId,
        engineerId: engineer.id,
        taskId: task.id,
        score: null,
        passResult: null,
        updatedAt: context.now,
      })),
    }
  }
  return { assignments: [], scoreSheets: [], directScores: [] }
}

function assertTaskEditable(snapshot: EvaluationSnapshot, taskId: string): void {
  const assignmentIds = new Set(
    snapshot.assignments
      .filter((assignment) => assignment.taskId === taskId)
      .map((assignment) => assignment.id),
  )
  const hasSubmittedSheet = snapshot.scoreSheets.some(
    (sheet) => assignmentIds.has(sheet.assignmentId) && sheet.status === "submitted",
  )
  if (hasSubmittedSheet) {
    throw new RepositoryError(
      "TASK_LOCKED",
      "제출된 평가가 있는 과제는 평가 구조를 변경하거나 삭제할 수 없습니다.",
    )
  }
}

function removeTaskArtifacts(
  snapshot: EvaluationSnapshot,
  taskId: string,
): Pick<EvaluationSnapshot, "assignments" | "scoreSheets" | "directScores"> {
  const removedAssignmentIds = new Set(
    snapshot.assignments
      .filter((assignment) => assignment.taskId === taskId)
      .map((assignment) => assignment.id),
  )
  return {
    assignments: snapshot.assignments.filter((assignment) => assignment.taskId !== taskId),
    scoreSheets: snapshot.scoreSheets.filter(
      (sheet) => !removedAssignmentIds.has(sheet.assignmentId),
    ),
    directScores: snapshot.directScores.filter((score) => score.taskId !== taskId),
  }
}

function sheetHasResponse(sheet: ScoreSheet): boolean {
  return sheet.passResult !== null || sheet.scores.some((entry) => entry.score !== null)
}

function taskStructureChanged(existing: EvaluationTask, next: EvaluationTask): boolean {
  if (existing.method !== next.method) return true
  const existingIds = existing.items.map((item) => item.id)
  const nextIds = next.items.map((item) => item.id)
  return existingIds.length !== nextIds.length ||
    existingIds.some((itemId, index) => itemId !== nextIds[index])
}

function existingTaskArtifacts(
  context: MutationContext,
  existing: EvaluationTask,
  next: EvaluationTask,
): TaskArtifacts {
  const assignments = context.snapshot.assignments.filter(
    (assignment) => assignment.taskId === existing.id,
  )
  const assignmentIds = new Set(assignments.map((assignment) => assignment.id))
  const scoreSheets = context.snapshot.scoreSheets.filter(
    (sheet) => assignmentIds.has(sheet.assignmentId),
  )
  const directScores = context.snapshot.directScores.filter(
    (score) => score.taskId === existing.id,
  )
  const structureChanged = taskStructureChanged(existing, next)
  const hasEnteredData = scoreSheets.some(sheetHasResponse) || directScores.some(
    (score) => score.score !== null || score.passResult !== null,
  )
  if (structureChanged && hasEnteredData) {
    throw new RepositoryError(
      "TASK_LOCKED",
      "입력 중인 평가가 있는 과제는 평가방식이나 문항 구성을 변경할 수 없습니다.",
    )
  }
  if (isEvaluatorTask(existing) && isEvaluatorTask(next)) {
    return {
      assignments,
      scoreSheets: structureChanged
        ? scoreSheets.map((sheet) => ({
            ...sheet,
            scores: next.method === "evaluator_score"
              ? next.items.map((item) => ({ itemId: item.id, score: null }))
              : [],
            passResult: null,
            updatedAt: context.now,
          }))
        : scoreSheets,
      directScores: [],
    }
  }
  if (!isEvaluatorTask(existing) && !isEvaluatorTask(next) && !structureChanged) {
    return { assignments: [], scoreSheets: [], directScores }
  }
  return createBlankTaskArtifacts(context, next)
}

export function saveEvaluationTaskAction(
  context: MutationContext,
  input: SaveEvaluationTaskInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(saveEvaluationTaskInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)

  const existing = parsed.taskId === null
    ? undefined
    : requireTask(context.snapshot, parsed.taskId)
  if (existing !== undefined) {
    if (existing.cycleId !== parsed.cycleId) {
      throw new RepositoryError("INVALID_INPUT", "과제의 평가 시즌을 변경할 수 없습니다.")
    }
    assertTaskEditable(context.snapshot, existing.id)
  }

  const nextOrder = Math.max(
    0,
    ...context.snapshot.tasks
      .filter((task) => task.cycleId === parsed.cycleId)
      .map((task) => task.order),
  ) + 1
  const task: EvaluationTask = {
    id: existing?.id ?? createEntityId(context, "task"),
    cycleId: parsed.cycleId,
    name: parsed.name,
    description: parsed.description,
    method: parsed.method,
    weight: parsed.weight,
    order: existing?.order ?? nextOrder,
    items: parsed.items.map((item, index) => ({
      id: item.id ?? createEntityId(context, "item"),
      label: item.label,
      order: index + 1,
      section: item.section,
      criteria: item.criteria,
    })),
  }

  const baseArtifacts = removeTaskArtifacts(context.snapshot, task.id)
  const nextArtifacts = existing === undefined
    ? createBlankTaskArtifacts(
        { ...context, snapshot: { ...context.snapshot, ...baseArtifacts } },
        task,
      )
    : existingTaskArtifacts(context, existing, task)
  const tasks = existing === undefined
    ? [...context.snapshot.tasks, task]
    : context.snapshot.tasks.map((candidate) => candidate.id === task.id ? task : candidate)
  const finalScoreSheets = [...baseArtifacts.scoreSheets, ...nextArtifacts.scoreSheets]
  const finalSheetIds = new Set(finalScoreSheets.map((sheet) => sheet.id))
  const snapshot: EvaluationSnapshot = {
    ...context.snapshot,
    tasks,
    assignments: [...baseArtifacts.assignments, ...nextArtifacts.assignments],
    scoreSheets: finalScoreSheets,
    unlockRequests: context.snapshot.unlockRequests.filter((request) => finalSheetIds.has(request.sheetId)),
    directScores: [...baseArtifacts.directScores, ...nextArtifacts.directScores],
  }
  return appendAuditEvent(context, snapshot, {
    cycleId: task.cycleId,
    type: "task_saved",
    actor: parsed.actor,
    targetId: task.id,
  })
}

export function deleteEvaluationTaskAction(
  context: MutationContext,
  input: DeleteEvaluationTaskInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(deleteEvaluationTaskInputSchema, input)
  requireOperator(parsed.actor)
  const task = requireTask(context.snapshot, parsed.taskId)
  requireCycleUnlocked(context.snapshot, task.cycleId)
  assertTaskEditable(context.snapshot, task.id)
  const artifacts = removeTaskArtifacts(context.snapshot, task.id)
  const remainingSheetIds = new Set(artifacts.scoreSheets.map((sheet) => sheet.id))
  const snapshot: EvaluationSnapshot = {
    ...context.snapshot,
    tasks: context.snapshot.tasks.filter((candidate) => candidate.id !== task.id),
    engineerTaskWeights: context.snapshot.engineerTaskWeights.filter(
      (entry) => entry.taskId !== task.id,
    ),
    directScoreRules: context.snapshot.directScoreRules.filter(
      (entry) => entry.taskId !== task.id,
    ),
    derivedScoreRules: context.snapshot.derivedScoreRules.filter(
      (entry) => entry.taskId !== task.id && entry.sourceTaskId !== task.id,
    ),
    ...artifacts,
    unlockRequests: context.snapshot.unlockRequests.filter((request) => remainingSheetIds.has(request.sheetId)),
  }
  return appendAuditEvent(context, snapshot, {
    cycleId: task.cycleId,
    type: "task_deleted",
    actor: parsed.actor,
    targetId: task.id,
  })
}
