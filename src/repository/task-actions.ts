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

export function createBlankTaskArtifacts(
  context: MutationContext,
  task: EvaluationTask,
): TaskArtifacts {
  if (!isEvaluatorTask(task)) {
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

  const assignments: EvaluatorAssignment[] = []
  const scoreSheets: ScoreSheet[] = []
  for (const engineer of context.snapshot.engineers) {
    for (const evaluator of task.evaluatorWeights) {
      const assignment: EvaluatorAssignment = {
        id: createEntityId(context, "assignment"),
        cycleId: task.cycleId,
        engineerId: engineer.id,
        evaluatorId: evaluator.evaluatorId,
        taskId: task.id,
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
  }
  return { assignments, scoreSheets, directScores: [] }
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

  const evaluatorIds = new Set(context.snapshot.evaluators.map((evaluator) => evaluator.id))
  for (const evaluator of parsed.evaluatorWeights) {
    if (!evaluatorIds.has(evaluator.evaluatorId)) {
      throw new RepositoryError("NOT_FOUND", `평가자 ${evaluator.evaluatorId}를 찾을 수 없습니다.`)
    }
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
    })),
    evaluatorWeights: parsed.evaluatorWeights,
  }

  const baseArtifacts = removeTaskArtifacts(context.snapshot, task.id)
  const blankArtifacts = createBlankTaskArtifacts(
    { ...context, snapshot: { ...context.snapshot, ...baseArtifacts } },
    task,
  )
  const tasks = existing === undefined
    ? [...context.snapshot.tasks, task]
    : context.snapshot.tasks.map((candidate) => candidate.id === task.id ? task : candidate)
  const snapshot: EvaluationSnapshot = {
    ...context.snapshot,
    tasks,
    assignments: [...baseArtifacts.assignments, ...blankArtifacts.assignments],
    scoreSheets: [...baseArtifacts.scoreSheets, ...blankArtifacts.scoreSheets],
    directScores: [...baseArtifacts.directScores, ...blankArtifacts.directScores],
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
  const snapshot: EvaluationSnapshot = {
    ...context.snapshot,
    tasks: context.snapshot.tasks.filter((candidate) => candidate.id !== task.id),
    engineerTaskWeights: context.snapshot.engineerTaskWeights.filter(
      (entry) => entry.taskId !== task.id,
    ),
    directScoreRules: context.snapshot.directScoreRules.filter(
      (entry) => entry.taskId !== task.id,
    ),
    ...artifacts,
  }
  return appendAuditEvent(context, snapshot, {
    cycleId: task.cycleId,
    type: "task_deleted",
    actor: parsed.actor,
    targetId: task.id,
  })
}
