import {
  resolveEngineerTaskWeight,
  scoreSheetValue,
  type EvaluationSnapshot,
  type EvaluationTask,
  type ScoreSheet,
  type TaskResult,
} from "@/domain"
import type {
  DashboardEvaluationStatus,
  DashboardEvaluationTask,
  EngineerEvaluationProgressRow,
  EngineerTaskProgress,
} from "@/features/dashboard"

import type { EngineerResultSummary } from "./results"

type TaskProgressInput = Readonly<{
  snapshot: EvaluationSnapshot
  engineerId: string
  task: EvaluationTask
  result: TaskResult
}>

export type DashboardProgressSelection = Readonly<{
  tasks: readonly DashboardEvaluationTask[]
  rows: readonly EngineerEvaluationProgressRow[]
}>

function hasScoreInput(task: EvaluationTask, sheet: ScoreSheet | undefined): boolean {
  if (sheet === undefined) return false

  switch (task.method) {
    case "evaluator_score":
      return sheet.scores.some((entry) => entry.score !== null)
    case "evaluator_pass_fail":
      return sheet.passResult !== null
    case "operator_score":
    case "operator_pass_fail":
    case "derived_score":
      return false
  }
}

function createTaskProgress(input: TaskProgressInput): EngineerTaskProgress {
  const evaluatorTask =
    input.task.method === "evaluator_score" ||
    input.task.method === "evaluator_pass_fail"
  const assignments = evaluatorTask
    ? input.snapshot.assignments.filter((assignment) =>
        assignment.cycleId === input.task.cycleId &&
        assignment.engineerId === input.engineerId &&
        assignment.taskId === input.task.id,
      )
    : []
  const sheets = assignments.map((assignment) =>
    input.snapshot.scoreSheets.find((sheet) => sheet.assignmentId === assignment.id),
  )
  const completedEvaluatorCount = evaluatorTask
    ? assignments.filter((assignment) => {
        const sheet = input.snapshot.scoreSheets.find(
          (candidate) => candidate.assignmentId === assignment.id,
        )
        return sheet?.status === "submitted" && scoreSheetValue(input.task, sheet) !== null
      }).length
    : null
  const started = input.result.status === "complete" || sheets.some((sheet) => hasScoreInput(input.task, sheet))
  const status: DashboardEvaluationStatus = input.result.status === "complete"
    ? "complete"
    : started
      ? "in_progress"
      : "not_started"

  return {
    taskId: input.task.id,
    label: input.task.name,
    weight: resolveEngineerTaskWeight(
      input.task,
      input.engineerId,
      input.snapshot.engineerTaskWeights,
    ),
    status,
    score: input.result.score,
    completedEvaluatorCount,
    evaluatorCount: evaluatorTask ? assignments.length : null,
  }
}

export function selectDashboardProgress(
  snapshot: EvaluationSnapshot,
  summaries: readonly EngineerResultSummary[],
): DashboardProgressSelection {
  const taskById = new Map(snapshot.tasks.map((task) => [task.id, task]))
  const rows = summaries.map((summary) => {
    const tasks = summary.result.taskResults.flatMap((result) => {
      const task = taskById.get(result.taskId)
      return task === undefined
        ? []
        : [createTaskProgress({
            snapshot,
            engineerId: summary.engineer.id,
            task,
            result,
          })]
    })
    const completedTaskCount = tasks.filter((task) => task.status === "complete").length
    const status: DashboardEvaluationStatus = summary.result.status === "complete"
      ? "complete"
      : tasks.some((task) => task.status !== "not_started")
        ? "in_progress"
        : "not_started"

    return {
      id: summary.engineer.id,
      href: `/engineers/detail?engineerId=${encodeURIComponent(summary.engineer.id)}`,
      name: summary.engineer.displayName,
      employeeCode: summary.engineer.employeeCode,
      team: summary.engineer.team,
      status,
      completedTaskCount,
      taskCount: tasks.length,
      tasks,
    }
  })
  const visibleTaskIds = new Set(rows.flatMap((row) => row.tasks.map((task) => task.taskId)))
  const tasks = snapshot.tasks
    .filter((task) => visibleTaskIds.has(task.id))
    .toSorted((left, right) => left.order - right.order)
    .map((task) => ({ id: task.id, label: task.name }))

  return { tasks, rows }
}
