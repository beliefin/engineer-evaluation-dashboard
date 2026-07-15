import {
  resolveEngineerTaskWeight,
  type EvaluationSnapshot,
  type EvaluatorAssignment,
} from "@/domain"
import type {
  CategoryScoreViewModel,
  EngineerDetailViewerRole,
  EngineerDetailViewModel,
  EngineerFinalResultViewModel,
  EvaluatorScoreViewModel,
} from "@/features/engineers"

import { selectEngineerResultSummaries } from "./results"

function evaluatorStatus(
  snapshot: EvaluationSnapshot,
  assignment: EvaluatorAssignment,
): EvaluatorScoreViewModel["status"] {
  const sheet = snapshot.scoreSheets.find(
    (entry) => entry.assignmentId === assignment.id,
  )
  if (sheet?.status === "submitted") return "submitted"
  return sheet !== undefined && (
    sheet.passResult !== null || sheet.scores.some((entry) => entry.score !== null)
  )
    ? "draft"
    : "pending"
}

function createEvaluatorScore(
  snapshot: EvaluationSnapshot,
  assignment: EvaluatorAssignment,
  result: ReturnType<typeof selectEngineerResultSummaries>[number]["result"],
): EvaluatorScoreViewModel | null {
  const evaluator = snapshot.evaluators.find(
    (entry) => entry.id === assignment.evaluatorId,
  )
  const task = snapshot.tasks.find((entry) => entry.id === assignment.taskId)
  if (evaluator === undefined || task === undefined) return null
  const taskResult = result.taskResults.find((entry) => entry.taskId === task.id)
  const score = taskResult?.evaluators.find(
    (entry) => entry.assignmentId === assignment.id,
  )
  const configuredWeight = task.evaluatorWeights.find(
    (entry) => entry.evaluatorId === assignment.evaluatorId,
  )?.weight ?? 0
  const status = evaluatorStatus(snapshot, assignment)
  const base = {
    id: assignment.id,
    evaluatorName: evaluator.displayName,
    categoryLabel: task.name,
    configuredWeight,
    normalizedRatioPercent: (score?.normalizedWeight ?? 0) * 100,
  }
  if (status === "submitted") {
    if (score?.rawScore !== null && score?.rawScore !== undefined) {
      return { ...base, status: "submitted", rawScore: score.rawScore }
    }
    return { ...base, status: "pending", rawScore: null }
  }
  return { ...base, status, rawScore: null }
}

export function selectEngineerDetail(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  engineerId: string,
  role: EngineerDetailViewerRole,
): EngineerDetailViewModel | null {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  const summary = selectEngineerResultSummaries(snapshot, cycleId).find(
    (entry) => entry.engineer.id === engineerId,
  )
  if (cycle === undefined || summary === undefined) return null

  const tasks = snapshot.tasks
    .filter((task) => task.cycleId === cycleId)
    .toSorted((left, right) => left.order - right.order)
  const categories: readonly CategoryScoreViewModel[] = tasks.map((task): CategoryScoreViewModel => {
    const effectiveWeight = resolveEngineerTaskWeight(
      task,
      engineerId,
      snapshot.engineerTaskWeights,
    )
    const taskResult = summary.result.taskResults.find((entry) => entry.taskId === task.id)
    const contribution = summary.result.contributions[task.id] ?? null
    const complete = taskResult?.status === "complete" && taskResult.score !== null && contribution !== null
    const base = {
      key: task.id,
      label: task.name,
      reflectionRatioPercent: effectiveWeight,
      maxContribution: effectiveWeight,
    }
    if (complete) {
      return { ...base, status: "complete", rawScore: taskResult.score, contribution }
    }
    return {
      ...base,
      status: task.method.startsWith("operator") ? "unconfirmed" : "in_progress",
      rawScore: taskResult?.score ?? null,
      contribution: null,
    }
  }).filter((category) => category.reflectionRatioPercent > 0)
  const assignments = snapshot.assignments.filter(
    (entry) =>
      entry.cycleId === cycleId &&
      entry.engineerId === engineerId &&
      categories.some((category) => category.key === entry.taskId),
  )
  const evaluatorScores = role === "operator"
    ? assignments.flatMap((assignment) => {
        const score = createEvaluatorScore(snapshot, assignment, summary.result)
        return score === null ? [] : [score]
      })
    : []
  const completedCategoryCount = categories.filter(
    (category) => category.status === "complete",
  ).length
  const result: EngineerFinalResultViewModel = summary.result.roundedFinalScore === null
    ? {
        status: summary.status === "unconfirmed" ? "unconfirmed" : "in_progress",
        finalScore: null,
        completedCategoryCount,
        totalCategoryCount: categories.length,
      }
    : {
        status: "complete",
        finalScore: summary.result.roundedFinalScore,
        completedCategoryCount,
        totalCategoryCount: categories.length,
      }

  return {
    engineer: {
      id: summary.engineer.id,
      displayName: summary.engineer.displayName,
      engineerCode: summary.engineer.employeeCode,
      teamName: summary.engineer.team,
      seasonLabel: cycle.name,
    },
    result,
    categories,
    evaluatorScores,
  }
}
