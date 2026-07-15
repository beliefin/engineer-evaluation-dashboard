import {
  calculateEngineerResult,
  resolveEngineerTaskWeight,
  type EngineerResult,
  type EvaluationSnapshot,
  type EvaluatorAssignment,
  type ScoreSheet,
} from "@/domain"

export const PENDING_EVALUATION_STATUSES = [
  "unassigned",
  "not_started",
  "in_progress",
  "direct_scores_pending",
] as const

export type PendingEvaluationStatus =
  (typeof PENDING_EVALUATION_STATUSES)[number]

export type PendingEvaluationRow = Readonly<{
  engineerId: string
  employeeCode: string
  engineerName: string
  team: string
  position: string
  status: PendingEvaluationStatus
  submittedSheetCount: number
  totalSheetCount: number
  enteredDirectScoreCount: number
  totalDirectScoreCount: number
  missingEvaluatorNames: ReadonlyArray<string>
  firstPendingAssignmentId: string | null
}>

export type PendingEvaluationMetrics = Readonly<{
  totalEngineers: number
  completedEngineers: number
  pendingEngineers: number
  byStatus: Readonly<Record<PendingEvaluationStatus, number>>
}>

export type PendingEvaluationSelection = Readonly<{
  rows: ReadonlyArray<PendingEvaluationRow>
  metrics: PendingEvaluationMetrics
}>

const EMPTY_METRICS: PendingEvaluationMetrics = {
  totalEngineers: 0,
  completedEngineers: 0,
  pendingEngineers: 0,
  byStatus: {
    unassigned: 0,
    not_started: 0,
    in_progress: 0,
    direct_scores_pending: 0,
  },
}

const STATUS_PRIORITY = {
  unassigned: 0,
  not_started: 1,
  in_progress: 2,
  direct_scores_pending: 3,
} as const satisfies Readonly<Record<PendingEvaluationStatus, number>>

function isSubmitted(
  assignment: EvaluatorAssignment,
  sheets: ReadonlyArray<ScoreSheet>,
): boolean {
  return sheets.find((sheet) => sheet.assignmentId === assignment.id)?.status === "submitted"
}

function getPendingStatus(
  assignments: ReadonlyArray<EvaluatorAssignment>,
  sheets: ReadonlyArray<ScoreSheet>,
  result: EngineerResult,
  hasEvaluatorTasks: boolean,
): PendingEvaluationStatus {
  if (hasEvaluatorTasks && assignments.length === 0) return "unassigned"

  const submittedCount = assignments.filter((assignment) =>
    isSubmitted(assignment, sheets),
  ).length
  const hasAnswers = assignments.some((assignment) => {
    const sheet = sheets.find((entry) => entry.assignmentId === assignment.id)
    return sheet !== undefined && (
      sheet.passResult !== null || sheet.scores.some((entry) => entry.score !== null)
    )
  })
  if (submittedCount === 0 && !hasAnswers) return "not_started"

  const evaluationsComplete = result.taskResults
    .filter((task) => task.method === "evaluator_score" || task.method === "evaluator_pass_fail")
    .every((task) => task.status === "complete")
  return evaluationsComplete ? "direct_scores_pending" : "in_progress"
}

export function selectPendingEvaluations(
  snapshot: EvaluationSnapshot,
  cycleId: string,
): PendingEvaluationSelection {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return { rows: [], metrics: EMPTY_METRICS }
  const tasks = snapshot.tasks.filter((task) => task.cycleId === cycleId)
  const evaluatorTasks = tasks.filter(
    (task) => task.method === "evaluator_score" || task.method === "evaluator_pass_fail",
  )
  const operatorTasks = tasks.filter(
    (task) => task.method === "operator_score" || task.method === "operator_pass_fail",
  )

  const rows = snapshot.engineers
    .flatMap<PendingEvaluationRow>((engineer) => {
      const applicableTaskIds = new Set(
        tasks
          .filter((task) => (
            resolveEngineerTaskWeight(task, engineer.id, snapshot.engineerTaskWeights) > 0
          ))
          .map((task) => task.id),
      )
      const assignments = snapshot.assignments.filter(
        (assignment) =>
          assignment.cycleId === cycleId &&
          assignment.engineerId === engineer.id &&
          applicableTaskIds.has(assignment.taskId),
      )
      const directScores = snapshot.directScores.filter(
        (score) => score.cycleId === cycleId && score.engineerId === engineer.id,
      )
      const result = calculateEngineerResult({
        cycleId,
        engineerId: engineer.id,
        tasks,
        assignments,
        sheets: snapshot.scoreSheets,
        directScores,
        engineerTaskWeights: snapshot.engineerTaskWeights,
      })
      if (result.status === "complete") return []

      const pendingAssignments = assignments.filter(
        (assignment) => !isSubmitted(assignment, snapshot.scoreSheets),
      )
      const missingEvaluatorNames = Array.from(
        new Set(
          pendingAssignments.flatMap((assignment) => {
            const evaluator = snapshot.evaluators.find(
              (entry) => entry.id === assignment.evaluatorId,
            )
            return evaluator === undefined ? [] : [evaluator.displayName]
          }),
        ),
      )
      const applicableOperatorTasks = operatorTasks.filter((task) => applicableTaskIds.has(task.id))
      const hasApplicableEvaluatorTasks = evaluatorTasks.some((task) => applicableTaskIds.has(task.id))
      const enteredDirectScoreCount = applicableOperatorTasks.filter((task) => {
        const direct = directScores.find((score) => score.taskId === task.id)
        return task.method === "operator_score"
          ? direct?.score !== null && direct?.score !== undefined
          : direct?.passResult !== null && direct?.passResult !== undefined
      }).length

      return [{
        engineerId: engineer.id,
        employeeCode: engineer.employeeCode,
        engineerName: engineer.displayName,
        team: engineer.team,
        position: engineer.position,
        status: getPendingStatus(
          assignments,
          snapshot.scoreSheets,
          result,
          hasApplicableEvaluatorTasks,
        ),
        submittedSheetCount: assignments.length - pendingAssignments.length,
        totalSheetCount: assignments.length,
        enteredDirectScoreCount,
        totalDirectScoreCount: applicableOperatorTasks.length,
        missingEvaluatorNames,
        firstPendingAssignmentId: pendingAssignments[0]?.id ?? null,
      }]
    })
    .toSorted((left, right) => {
      const statusOrder = STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status]
      if (statusOrder !== 0) return statusOrder

      const teamOrder = left.team.localeCompare(right.team, "ko")
      return teamOrder !== 0
        ? teamOrder
        : left.engineerName.localeCompare(right.engineerName, "ko")
    })
  const byStatus = {
    unassigned: rows.filter((row) => row.status === "unassigned").length,
    not_started: rows.filter((row) => row.status === "not_started").length,
    in_progress: rows.filter((row) => row.status === "in_progress").length,
    direct_scores_pending: rows.filter(
      (row) => row.status === "direct_scores_pending",
    ).length,
  }

  return {
    rows,
    metrics: {
      totalEngineers: snapshot.engineers.length,
      completedEngineers: snapshot.engineers.length - rows.length,
      pendingEngineers: rows.length,
      byStatus,
    },
  }
}
