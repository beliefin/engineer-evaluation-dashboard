import type {
  Assignment,
  DirectScore,
  EvaluationBenchmark,
  Profile,
  ScoreSheet,
  Snapshot,
  Task,
} from "./model.ts"

function sheetValue(task: Task, sheet: ScoreSheet): number | null {
  if (sheet.status !== "submitted") return null
  if (task.method === "evaluator_pass_fail") {
    return sheet.passResult === null ? null : sheet.passResult ? 100 : 0
  }
  const expected = new Set(task.items.map((item) => item.id))
  if (sheet.scores.length !== expected.size) return null
  if (sheet.scores.some((entry) => entry.score === null || !expected.has(entry.itemId))) return null
  const sum = sheet.scores.reduce((total, entry) => total + (entry.score ?? 0), 0)
  return expected.size === 0 ? null : (sum / (expected.size * 10)) * 100
}

function aggregateEvaluatorScore(snapshot: Snapshot, task: Task, engineerId: string): number | null {
  const assignments = snapshot.assignments.filter((entry) =>
    entry.taskId === task.id && entry.engineerId === engineerId)
  const totalWeight = assignments.reduce((total, entry) => total + entry.weight, 0)
  if (assignments.length === 0 || totalWeight <= 0) return null
  const values = assignments.map((assignment) => {
    const sheet = snapshot.scoreSheets.find((entry) => entry.assignmentId === assignment.id)
    const score = sheet === undefined ? null : sheetValue(task, sheet)
    return { score, weight: assignment.weight }
  })
  if (values.some((entry) => entry.score === null)) return null
  return values.reduce((total, entry) => total + (entry.score ?? 0) * entry.weight / totalWeight, 0)
}

function scheduleKey(date: string, startTime: string | null): string {
  return `${date}T${startTime ?? "23:59"}`
}

function benchmarkForAssignment(
  snapshot: Snapshot,
  assignment: Assignment,
): EvaluationBenchmark | null {
  const task = snapshot.tasks.find((entry) => entry.id === assignment.taskId)
  if (task?.method !== "evaluator_score") return null
  const current = snapshot.scheduleEvents
    .filter((event) =>
      event.cycleId === assignment.cycleId &&
      event.engineerId === assignment.engineerId &&
      event.taskId === assignment.taskId)
    .sort((left, right) => scheduleKey(left.date, left.startTime).localeCompare(
      scheduleKey(right.date, right.startTime),
    ))[0]
  if (current === undefined) return null
  const seen = new Set<string>()
  const scores = snapshot.scheduleEvents
    .filter((event) =>
      event.cycleId === assignment.cycleId &&
      event.taskId === assignment.taskId &&
      event.engineerId !== assignment.engineerId &&
      scheduleKey(event.date, event.startTime) < scheduleKey(current.date, current.startTime))
    .sort((left, right) => scheduleKey(right.date, right.startTime).localeCompare(
      scheduleKey(left.date, left.startTime),
    ))
    .flatMap((event) => {
      if (seen.has(event.engineerId)) return []
      seen.add(event.engineerId)
      const score = aggregateEvaluatorScore(snapshot, task, event.engineerId)
      return score === null ? [] : [score]
    })
    .slice(0, 3)
  if (scores.length === 0) return null
  return {
    assignmentId: assignment.id,
    sampleSize: scores.length,
    averageScore: scores.reduce((total, score) => total + score, 0) / scores.length,
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
  }
}

function derivedScore(snapshot: Snapshot, taskId: string, targetEngineerId: string): number | null {
  const rule = snapshot.derivedScoreRules.find((entry) =>
    entry.taskId === taskId && entry.targetEngineerId === targetEngineerId)
  if (rule === undefined) return null
  const sourceTask = snapshot.tasks.find((task) => task.id === rule.sourceTaskId)
  if (sourceTask === undefined ||
    (sourceTask.method !== "evaluator_score" && sourceTask.method !== "evaluator_pass_fail")) return null
  const scores = rule.sourceEngineerIds.map((engineerId) =>
    aggregateEvaluatorScore(snapshot, sourceTask, engineerId))
  if (scores.length === 0 || scores.some((score) => score === null)) return null
  return scores.reduce<number>((total, score) => total + (score ?? 0), 0) / scores.length
}

function aggregateProjection(snapshot: Snapshot, engineerIds: ReadonlySet<string>): Snapshot {
  const evaluatorTasks = snapshot.tasks.filter((task) =>
    task.method === "evaluator_score" || task.method === "evaluator_pass_fail")
  const derivedTasks = snapshot.tasks.filter((task) => task.method === "derived_score")
  const tasks = snapshot.tasks.map((task) =>
    evaluatorTasks.some((entry) => entry.id === task.id) || derivedTasks.some((entry) => entry.id === task.id)
    ? { ...task, method: "operator_score" as const, items: [] }
    : task)
  const preserved = snapshot.directScores.filter((score) => engineerIds.has(score.engineerId))
  const aggregated: DirectScore[] = []
  const now = new Date().toISOString()
  for (const engineerId of engineerIds) {
    for (const task of evaluatorTasks) {
      aggregated.push({
        id: `aggregate:${task.id}:${engineerId}`,
        cycleId: task.cycleId,
        engineerId,
        taskId: task.id,
        score: aggregateEvaluatorScore(snapshot, task, engineerId),
        passResult: null,
        updatedAt: now,
      })
    }
    for (const task of derivedTasks) {
      aggregated.push({
        id: `derived:${task.id}:${engineerId}`,
        cycleId: task.cycleId,
        engineerId,
        taskId: task.id,
        score: derivedScore(snapshot, task.id, engineerId),
        passResult: null,
        updatedAt: now,
      })
    }
  }
  return {
    ...snapshot,
    tasks,
    evaluators: [],
    assignments: [],
    scoreSheets: [],
    unlockRequests: [],
    directScores: [...preserved, ...aggregated],
    derivedScoreRules: [],
    evaluationBenchmarks: [],
    scoreAdjustments: snapshot.scoreAdjustments.filter((entry) => engineerIds.has(entry.engineerId)),
    auditEvents: [],
  }
}

export function projectInsightsSnapshot(snapshot: Snapshot): Snapshot {
  return aggregateProjection(snapshot, new Set(snapshot.engineers.map((entry) => entry.id)))
}

function evaluatorProjection(snapshot: Snapshot, evaluatorId: string): Snapshot {
  const sourceAssignments = snapshot.assignments
    .filter((entry) => entry.evaluatorId === evaluatorId)
  const assignments = sourceAssignments
    .map((entry) => ({ ...entry, weight: 1 }))
  const assignmentIds = new Set(assignments.map((entry) => entry.id))
  const engineerIds = new Set(assignments.map((entry) => entry.engineerId))
  const taskIds = new Set(assignments.map((entry) => entry.taskId))
  const scheduleKeys = new Set(assignments.map((entry) => `${entry.cycleId}:${entry.engineerId}:${entry.taskId}`))
  return {
    ...snapshot,
    tasks: snapshot.tasks.filter((task) => taskIds.has(task.id)),
    engineerTaskWeights: snapshot.engineerTaskWeights.filter((entry) =>
      engineerIds.has(entry.engineerId) && taskIds.has(entry.taskId)),
    engineers: snapshot.engineers.filter((entry) => engineerIds.has(entry.id)),
    evaluators: snapshot.evaluators.filter((entry) => entry.id === evaluatorId),
    assignments,
    scoreSheets: snapshot.scoreSheets.filter((entry) => assignmentIds.has(entry.assignmentId)),
    unlockRequests: snapshot.unlockRequests.filter((entry) =>
      entry.evaluatorId === evaluatorId && assignmentIds.has(
        snapshot.scoreSheets.find((sheet) => sheet.id === entry.sheetId)?.assignmentId ?? "",
      )),
    directScores: [],
    derivedScoreRules: [],
    evaluationBenchmarks: sourceAssignments.flatMap((assignment) => {
      const benchmark = benchmarkForAssignment(snapshot, assignment)
      return benchmark === null ? [] : [benchmark]
    }),
    scoreAdjustments: [],
    languageScoreRecords: [],
    certificationRecords: [],
    scheduleEvents: snapshot.scheduleEvents.filter((entry) =>
      entry.taskId !== null && scheduleKeys.has(`${entry.cycleId}:${entry.engineerId}:${entry.taskId}`)),
    auditEvents: [],
  }
}

export function projectSnapshot(snapshot: Snapshot, profile: Profile): Snapshot {
  if (profile.role === "operator") return snapshot
  if (profile.role === "evaluator" && profile.evaluator_id !== null) {
    return evaluatorProjection(snapshot, profile.evaluator_id)
  }
  if (profile.role === "approver") {
    return projectInsightsSnapshot(snapshot)
  }
  if (profile.role === "engineer" && profile.engineer_id !== null) {
    const engineerIds = new Set([profile.engineer_id])
    const projected = aggregateProjection(snapshot, engineerIds)
    return {
      ...projected,
      engineerTaskWeights: projected.engineerTaskWeights.filter((entry) =>
        entry.engineerId === profile.engineer_id),
      engineers: projected.engineers.filter((entry) => entry.id === profile.engineer_id),
      directScores: projected.directScores.filter((entry) => entry.engineerId === profile.engineer_id),
      scoreAdjustments: projected.scoreAdjustments.filter((entry) => entry.engineerId === profile.engineer_id),
      languageScoreRecords: projected.languageScoreRecords.filter((entry) =>
        entry.engineerId === profile.engineer_id),
      certificationRecords: projected.certificationRecords.filter((entry) =>
        entry.engineerId === profile.engineer_id),
      scheduleEvents: projected.scheduleEvents.filter((entry) => entry.engineerId === profile.engineer_id),
    }
  }
  throw new Error("profile_role_link_invalid")
}
