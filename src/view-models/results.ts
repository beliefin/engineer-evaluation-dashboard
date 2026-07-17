import {
  calculateSeasonResults,
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

  const resultByEngineer = new Map(
    calculateSeasonResults(snapshot, cycleId).map((result) => [result.engineerId, result]),
  )
  return snapshot.engineers.flatMap((engineer) => {
    const result = resultByEngineer.get(engineer.id)
    if (result === undefined) return []
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
