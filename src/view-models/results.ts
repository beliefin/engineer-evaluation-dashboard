import {
  calculateEngineerResult,
  type Engineer,
  type EngineerResult,
  type EvaluationSnapshot,
} from "@/domain"

export type EngineerProgressStatus =
  | "complete"
  | "in_progress"
  | "unconfirmed"

export type EngineerResultSummary = Readonly<{
  engineer: Engineer
  result: EngineerResult
  status: EngineerProgressStatus
}>

export function getEngineerProgressStatus(
  result: EngineerResult,
): EngineerProgressStatus {
  if (result.status === "complete") return "complete"

  const evaluatorTasks = result.taskResults.filter(
    (task) => task.method === "evaluator_score" || task.method === "evaluator_pass_fail",
  )
  const evaluatorInputsComplete = evaluatorTasks.every((task) => task.status === "complete")
  return evaluatorInputsComplete ? "unconfirmed" : "in_progress"
}

export function selectEngineerResultSummaries(
  snapshot: EvaluationSnapshot,
  cycleId: string,
): ReadonlyArray<EngineerResultSummary> {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return []

  return snapshot.engineers.map((engineer) => {
    const assignments = snapshot.assignments.filter(
      (assignment) =>
        assignment.cycleId === cycleId && assignment.engineerId === engineer.id,
    )
    const directScores = snapshot.directScores.filter(
      (score) => score.cycleId === cycleId && score.engineerId === engineer.id,
    )
    const tasks = snapshot.tasks.filter((task) => task.cycleId === cycleId)
    const result = calculateEngineerResult({
      cycleId,
      cycleStartsAt: cycle.startsAt,
      engineerId: engineer.id,
      tasks,
      assignments,
      sheets: snapshot.scoreSheets,
      directScores,
      engineerTaskWeights: snapshot.engineerTaskWeights,
      directScoreRules: snapshot.directScoreRules,
      languageRecords: snapshot.languageScoreRecords,
      certificationRecords: snapshot.certificationRecords,
      scoreAdjustments: snapshot.scoreAdjustments,
    })

    return {
      engineer,
      result,
      status: getEngineerProgressStatus(result),
    }
  })
}

export function selectEngineerResults(
  snapshot: EvaluationSnapshot,
  cycleId: string,
): ReadonlyArray<EngineerResult> {
  return selectEngineerResultSummaries(snapshot, cycleId).map(
    (summary) => summary.result,
  )
}
