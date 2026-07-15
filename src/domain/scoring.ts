import type {
  DirectScore,
  EngineerTaskWeight,
  EngineerResult,
  EvaluationTask,
  EvaluatorAssignment,
  RankedEngineerResult,
  ScoreSheet,
  TaskResult,
} from "./types"

const roundToTwo = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

function isEvaluatorTask(task: EvaluationTask): boolean {
  return task.method === "evaluator_score" || task.method === "evaluator_pass_fail"
}

function scoreResponse(task: EvaluationTask, sheet: ScoreSheet): number | null {
  if (task.items.length === 0 || sheet.scores.length !== task.items.length) return null
  const expectedIds = new Set(task.items.map((item) => item.id))
  const scores = sheet.scores.filter((entry) => expectedIds.has(entry.itemId))
  if (scores.length !== task.items.length || scores.some((entry) => entry.score === null)) {
    return null
  }
  const raw = scores.reduce((total, entry) => total + (entry.score ?? 0), 0)
  return (raw / (task.items.length * 10)) * 100
}

export function scoreSheetValue(task: EvaluationTask, sheet: ScoreSheet): number | null {
  switch (task.method) {
    case "evaluator_score":
      return scoreResponse(task, sheet)
    case "evaluator_pass_fail":
      return sheet.passResult === null ? null : sheet.passResult ? 100 : 0
    case "operator_score":
    case "operator_pass_fail":
      return null
    default:
      return assertNever(task.method)
  }
}

function operatorTaskResult(
  task: EvaluationTask,
  directScores: ReadonlyArray<DirectScore>,
): TaskResult {
  const stored = directScores.find((entry) => entry.taskId === task.id)
  const score = task.method === "operator_score"
    ? (stored?.score ?? null)
    : stored?.passResult === null || stored?.passResult === undefined
      ? null
      : stored.passResult
        ? 100
        : 0
  const passCount = task.method === "operator_pass_fail" && score !== null
    ? (score === 100 ? 1 : 0)
    : null
  return {
    taskId: task.id,
    method: task.method,
    status: score === null ? "incomplete" : "complete",
    score,
    passCount,
    evaluatorCount: task.method === "operator_pass_fail" ? 1 : null,
    evaluators: [],
  }
}

export function calculateTaskResult(
  task: EvaluationTask,
  assignments: ReadonlyArray<EvaluatorAssignment>,
  sheets: ReadonlyArray<ScoreSheet>,
  directScores: ReadonlyArray<DirectScore>,
): TaskResult {
  if (!isEvaluatorTask(task)) return operatorTaskResult(task, directScores)

  const scopedAssignments = assignments.filter((entry) => entry.taskId === task.id)
  const totalWeight = task.evaluatorWeights.reduce((total, entry) => total + entry.weight, 0)
  const evaluators = task.evaluatorWeights.map((definition) => {
    const assignment = scopedAssignments.find(
      (entry) => entry.evaluatorId === definition.evaluatorId,
    )
    const sheet = assignment === undefined
      ? undefined
      : sheets.find((entry) => entry.assignmentId === assignment.id)
    const rawScore = sheet?.status === "submitted" ? scoreSheetValue(task, sheet) : null
    return {
      assignmentId: assignment?.id ?? "",
      evaluatorId: definition.evaluatorId,
      weight: definition.weight,
      normalizedWeight: totalWeight > 0 ? definition.weight / totalWeight : 0,
      rawScore,
      passResult: task.method === "evaluator_pass_fail" ? (sheet?.passResult ?? null) : null,
      submitted: assignment !== undefined && rawScore !== null,
    }
  })
  const complete = evaluators.length > 0 && evaluators.every((entry) => entry.submitted)
  const score = complete
    ? evaluators.reduce(
        (total, entry) => total + (entry.rawScore ?? 0) * entry.normalizedWeight,
        0,
      )
    : null
  const passCount = task.method === "evaluator_pass_fail"
    ? evaluators.filter((entry) => entry.passResult === true).length
    : null
  return {
    taskId: task.id,
    method: task.method,
    status: complete ? "complete" : "incomplete",
    score,
    passCount,
    evaluatorCount: task.method === "evaluator_pass_fail" ? evaluators.length : null,
    evaluators,
  }
}

type EngineerResultInput = Readonly<{
  cycleId: string
  engineerId: string
  tasks: ReadonlyArray<EvaluationTask>
  assignments: ReadonlyArray<EvaluatorAssignment>
  sheets: ReadonlyArray<ScoreSheet>
  directScores: ReadonlyArray<DirectScore>
  engineerTaskWeights?: ReadonlyArray<EngineerTaskWeight>
}>

export function resolveEngineerTaskWeight(
  task: EvaluationTask,
  engineerId: string,
  configured: ReadonlyArray<EngineerTaskWeight>,
): number {
  return configured.find(
    (entry) => entry.engineerId === engineerId && entry.taskId === task.id,
  )?.weight ?? task.weight
}

export function calculateEngineerResult(input: EngineerResultInput): EngineerResult {
  const configured = input.engineerTaskWeights ?? []
  const weightedTasks = input.tasks
    .map((task) => ({
      task,
      weight: resolveEngineerTaskWeight(task, input.engineerId, configured),
    }))
    .filter((entry) => entry.weight > 0)
    .toSorted((left, right) => left.task.order - right.task.order)
  const tasks = weightedTasks.map((entry) => entry.task)
  const taskResults = tasks.map((task) =>
    calculateTaskResult(task, input.assignments, input.sheets, input.directScores),
  )
  const contributions = Object.fromEntries(
    weightedTasks.map(({ task, weight }) => {
      const score = taskResults.find((result) => result.taskId === task.id)?.score ?? null
      return [task.id, score === null ? null : score * (weight / 100)]
    }),
  )
  const values = Object.values(contributions)
  const weightTotal = weightedTasks.reduce((total, entry) => total + entry.weight, 0)
  const complete =
    tasks.length > 0 &&
    Math.abs(weightTotal - 100) < 0.000_001 &&
    values.every((value) => value !== null)
  const finalScore = complete
    ? values.reduce<number>((total, value) => total + (value ?? 0), 0)
    : null

  return {
    cycleId: input.cycleId,
    engineerId: input.engineerId,
    status: complete ? "complete" : "incomplete",
    taskResults,
    contributions,
    finalScore,
    roundedFinalScore: finalScore === null ? null : roundToTwo(finalScore),
  }
}

export function rankCompletedResults(
  results: ReadonlyArray<EngineerResult>,
): ReadonlyArray<RankedEngineerResult> {
  const sorted = results
    .filter(
      (result): result is EngineerResult & { roundedFinalScore: number } =>
        result.status === "complete" && result.roundedFinalScore !== null,
    )
    .toSorted((left, right) => right.roundedFinalScore - left.roundedFinalScore)

  return sorted.map((result, index) => {
    const previous = sorted[index - 1]
    const rank = previous?.roundedFinalScore === result.roundedFinalScore
      ? sorted.findIndex((entry) => entry.roundedFinalScore === result.roundedFinalScore) + 1
      : index + 1
    return { ...result, rank }
  })
}

function assertNever(value: never): never {
  throw new RangeError(`unsupported evaluation method: ${String(value)}`)
}
