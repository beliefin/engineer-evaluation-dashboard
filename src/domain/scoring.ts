import { highestConvertedDirectScore } from "./direct-score-rules"
import type {
  CertificationRecord,
  DirectScore,
  DirectScoreRule,
  DerivedScoreRule,
  EngineerTaskWeight,
  EngineerResult,
  EngineerScoreAdjustment,
  EvaluationTask,
  EvaluationSnapshot,
  EvaluatorAssignment,
  LanguageScoreRecord,
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
    case "derived_score":
      return null
    default:
      return assertNever(task.method)
  }
}

function operatorTaskResult(
  task: EvaluationTask,
  directScores: ReadonlyArray<DirectScore>,
  directScoreRules: ReadonlyArray<DirectScoreRule>,
  languageRecords: ReadonlyArray<LanguageScoreRecord>,
  certificationRecords: ReadonlyArray<CertificationRecord>,
  cycleStartsAt?: string,
): TaskResult {
  const stored = directScores.find((entry) => entry.taskId === task.id)
  const rules = directScoreRules.filter((rule) => rule.taskId === task.id)
  const calculated = rules.length === 0
    ? null
    : highestConvertedDirectScore(
      rules[0]?.kind === "language" ? languageRecords : certificationRecords,
      rules,
      cycleStartsAt,
    )
  const score = task.method === "operator_score"
    ? (rules.length > 0 ? calculated : stored?.score ?? null)
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
  directScoreRules: ReadonlyArray<DirectScoreRule> = [],
  languageRecords: ReadonlyArray<LanguageScoreRecord> = [],
  certificationRecords: ReadonlyArray<CertificationRecord> = [],
  cycleStartsAt?: string,
): TaskResult {
  if (task.method === "derived_score") {
    return {
      taskId: task.id,
      method: task.method,
      status: "incomplete",
      score: null,
      passCount: null,
      evaluatorCount: null,
      evaluators: [],
    }
  }
  if (!isEvaluatorTask(task)) {
    return operatorTaskResult(
      task,
      directScores,
      directScoreRules,
      languageRecords,
      certificationRecords,
      cycleStartsAt,
    )
  }

  const scopedAssignments = assignments.filter((entry) => entry.taskId === task.id)
  const totalWeight = scopedAssignments.reduce((total, entry) => total + entry.weight, 0)
  const evaluators = scopedAssignments.map((assignment) => {
    const sheet = sheets.find((entry) => entry.assignmentId === assignment.id)
    const rawScore = sheet?.status === "submitted" ? scoreSheetValue(task, sheet) : null
    return {
      assignmentId: assignment.id,
      evaluatorId: assignment.evaluatorId,
      weight: assignment.weight,
      normalizedWeight: totalWeight > 0 ? assignment.weight / totalWeight : 0,
      rawScore,
      passResult: task.method === "evaluator_pass_fail" ? (sheet?.passResult ?? null) : null,
      submitted: rawScore !== null,
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
  cycleStartsAt?: string
  engineerId: string
  tasks: ReadonlyArray<EvaluationTask>
  assignments: ReadonlyArray<EvaluatorAssignment>
  sheets: ReadonlyArray<ScoreSheet>
  directScores: ReadonlyArray<DirectScore>
  engineerTaskWeights?: ReadonlyArray<EngineerTaskWeight>
  directScoreRules?: ReadonlyArray<DirectScoreRule>
  languageRecords?: ReadonlyArray<LanguageScoreRecord>
  certificationRecords?: ReadonlyArray<CertificationRecord>
  scoreAdjustments?: ReadonlyArray<EngineerScoreAdjustment>
  derivedScores?: Readonly<Record<string, number | null>>
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
  const taskResults = tasks.map((task) => {
    if (task.method === "derived_score") {
      const score = input.derivedScores?.[task.id] ?? null
      return {
        taskId: task.id,
        method: task.method,
        status: score === null ? "incomplete" as const : "complete" as const,
        score,
        passCount: null,
        evaluatorCount: null,
        evaluators: [],
      }
    }
    return calculateTaskResult(
      task,
      input.assignments,
      input.sheets,
      input.directScores,
      input.directScoreRules,
      input.languageRecords,
      input.certificationRecords,
      input.cycleStartsAt,
    )
  })
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
  const baseScore = complete
    ? values.reduce<number>((total, value) => total + (value ?? 0), 0)
    : null
  const adjustmentTotal = (input.scoreAdjustments ?? [])
    .filter((adjustment) =>
      adjustment.cycleId === input.cycleId && adjustment.engineerId === input.engineerId,
    )
    .reduce((total, adjustment) => total + adjustment.amount, 0)
  const finalScore = baseScore === null
    ? null
    : Math.min(100, Math.max(0, baseScore + adjustmentTotal))

  return {
    cycleId: input.cycleId,
    engineerId: input.engineerId,
    status: complete ? "complete" : "incomplete",
    taskResults,
    contributions,
    baseScore,
    adjustmentTotal,
    finalScore,
    roundedFinalScore: finalScore === null ? null : roundToTwo(finalScore),
  }
}

function calculateDerivedScore(
  rule: DerivedScoreRule,
  baseResults: ReadonlyArray<EngineerResult>,
): number | null {
  const scores = rule.sourceEngineerIds.map((engineerId) =>
    baseResults
      .find((result) => result.engineerId === engineerId)
      ?.taskResults.find((result) => result.taskId === rule.sourceTaskId)?.score ?? null,
  )
  if (scores.length === 0 || scores.some((score) => score === null)) return null
  return scores.reduce<number>((total, score) => total + (score ?? 0), 0) / scores.length
}

export function calculateSeasonResults(
  snapshot: EvaluationSnapshot,
  cycleId: string,
): ReadonlyArray<EngineerResult> {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return []
  const tasks = snapshot.tasks.filter((task) => task.cycleId === cycleId)
  const calculate = (
    engineerId: string,
    derivedScores?: Readonly<Record<string, number | null>>,
  ) => calculateEngineerResult({
    cycleId,
    cycleStartsAt: cycle.startsAt,
    engineerId,
    tasks,
    assignments: snapshot.assignments.filter((entry) =>
      entry.cycleId === cycleId && entry.engineerId === engineerId),
    sheets: snapshot.scoreSheets,
    directScores: snapshot.directScores.filter((entry) =>
      entry.cycleId === cycleId && entry.engineerId === engineerId),
    engineerTaskWeights: snapshot.engineerTaskWeights,
    directScoreRules: snapshot.directScoreRules,
    languageRecords: snapshot.languageScoreRecords.filter((entry) =>
      entry.cycleId === cycleId && entry.engineerId === engineerId),
    certificationRecords: snapshot.certificationRecords.filter((entry) =>
      entry.cycleId === cycleId && entry.engineerId === engineerId),
    scoreAdjustments: snapshot.scoreAdjustments,
    ...(derivedScores === undefined ? {} : { derivedScores }),
  })
  const baseResults = snapshot.engineers.map((engineer) => calculate(engineer.id))
  const derivedByEngineer = new Map<string, Record<string, number | null>>()
  snapshot.derivedScoreRules
    .filter((rule) => rule.cycleId === cycleId)
    .forEach((rule) => {
      const scores = derivedByEngineer.get(rule.targetEngineerId) ?? {}
      scores[rule.taskId] = calculateDerivedScore(rule, baseResults)
      derivedByEngineer.set(rule.targetEngineerId, scores)
    })
  return snapshot.engineers.map((engineer) =>
    calculate(engineer.id, derivedByEngineer.get(engineer.id)),
  )
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
