import type { DirectScore, Profile, ScoreSheet, Snapshot, Task } from "./model.ts"

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
  const totalWeight = task.evaluatorWeights.reduce((total, entry) => total + entry.weight, 0)
  if (task.evaluatorWeights.length === 0 || totalWeight <= 0) return null
  const values = task.evaluatorWeights.map((definition) => {
    const assignment = snapshot.assignments.find((entry) =>
      entry.taskId === task.id && entry.engineerId === engineerId &&
      entry.evaluatorId === definition.evaluatorId)
    const sheet = assignment === undefined
      ? undefined
      : snapshot.scoreSheets.find((entry) => entry.assignmentId === assignment.id)
    const score = sheet === undefined ? null : sheetValue(task, sheet)
    return { score, weight: definition.weight }
  })
  if (values.some((entry) => entry.score === null)) return null
  return values.reduce((total, entry) => total + (entry.score ?? 0) * entry.weight / totalWeight, 0)
}

function aggregateProjection(snapshot: Snapshot, engineerIds: ReadonlySet<string>): Snapshot {
  const evaluatorTasks = snapshot.tasks.filter((task) =>
    task.method === "evaluator_score" || task.method === "evaluator_pass_fail")
  const tasks = snapshot.tasks.map((task) => evaluatorTasks.some((entry) => entry.id === task.id)
    ? { ...task, method: "operator_score" as const, items: [], evaluatorWeights: [] }
    : { ...task, evaluatorWeights: [] })
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
  }
  return {
    ...snapshot,
    tasks,
    evaluators: [],
    assignments: [],
    scoreSheets: [],
    directScores: [...preserved, ...aggregated],
    auditEvents: [],
  }
}

function evaluatorProjection(snapshot: Snapshot, evaluatorId: string): Snapshot {
  const assignments = snapshot.assignments.filter((entry) => entry.evaluatorId === evaluatorId)
  const assignmentIds = new Set(assignments.map((entry) => entry.id))
  const engineerIds = new Set(assignments.map((entry) => entry.engineerId))
  const taskIds = new Set(assignments.map((entry) => entry.taskId))
  return {
    ...snapshot,
    tasks: snapshot.tasks.filter((task) => taskIds.has(task.id)).map((task) => ({
      ...task,
      evaluatorWeights: [],
    })),
    engineerTaskWeights: snapshot.engineerTaskWeights.filter((entry) =>
      engineerIds.has(entry.engineerId) && taskIds.has(entry.taskId)),
    engineers: snapshot.engineers.filter((entry) => engineerIds.has(entry.id)),
    evaluators: snapshot.evaluators.filter((entry) => entry.id === evaluatorId),
    assignments,
    scoreSheets: snapshot.scoreSheets.filter((entry) => assignmentIds.has(entry.assignmentId)),
    directScores: [],
    languageScoreRecords: [],
    certificationRecords: [],
    scheduleEvents: [],
    auditEvents: [],
  }
}

export function projectSnapshot(snapshot: Snapshot, profile: Profile): Snapshot {
  if (profile.role === "operator") return snapshot
  if (profile.role === "evaluator" && profile.evaluator_id !== null) {
    return evaluatorProjection(snapshot, profile.evaluator_id)
  }
  if (profile.role === "approver") {
    return aggregateProjection(snapshot, new Set(snapshot.engineers.map((entry) => entry.id)))
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
      languageScoreRecords: projected.languageScoreRecords.filter((entry) =>
        entry.engineerId === profile.engineer_id),
      certificationRecords: projected.certificationRecords.filter((entry) =>
        entry.engineerId === profile.engineer_id),
      scheduleEvents: projected.scheduleEvents.filter((entry) => entry.engineerId === profile.engineer_id),
    }
  }
  throw new Error("profile_role_link_invalid")
}
