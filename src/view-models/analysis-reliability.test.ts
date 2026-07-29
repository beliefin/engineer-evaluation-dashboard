import { describe, expect, it } from "vitest"

import { CYCLE_ID } from "@/data/seed-fixtures"
import { createSeedSnapshot } from "@/data/seed"

import {
  selectEvaluationReliability,
  selectEvaluatorExclusionSensitivities,
  selectEvaluatorResiduals,
} from "./analysis-reliability"

const ALL_FILTERS = {
  team: "all",
  category: "all",
  status: "all",
} as const

function scoreAllItems(score: number) {
  return (entry: Readonly<{ itemId: string; score: number | null }>) => ({
    ...entry,
    score,
  })
}

function createDisagreementSnapshot() {
  const snapshot = createSeedSnapshot()
  const targetAssignments = snapshot.assignments.filter(
    (assignment) =>
      assignment.engineerId === "engineer-02" &&
      assignment.taskId === "task-growth-plan",
  )
  const updatedSheets = snapshot.scoreSheets.map((sheet) => {
    const targetIndex = targetAssignments.findIndex(
      (assignment) => assignment.id === sheet.assignmentId,
    )
    if (targetIndex === -1) return sheet
    return {
      ...sheet,
      scores: sheet.scores.map(scoreAllItems(targetIndex === 0 ? 10 : 8)),
    }
  })
  return { ...snapshot, scoreSheets: updatedSheets, targetAssignments }
}

describe("evaluation reliability analysis", () => {
  it("marks spread and leave-one-out disagreement for the same engineer-task", () => {
    const { targetAssignments, ...snapshot } = createDisagreementSnapshot()
    const reliability = selectEvaluationReliability(snapshot, CYCLE_ID, ALL_FILTERS)
    const target = reliability.find(
      (entry) =>
        entry.engineerId === "engineer-02" &&
        entry.taskId === "task-growth-plan",
    )

    expect(target).toMatchObject({
      consensusScore: 86.7,
      evaluatorCount: targetAssignments.length,
      scoreRange: 20,
      standardDeviation: 9.4,
      leaveOneOutOutlierCount: 3,
      isHighDisagreement: true,
    })
  })

  it("uses other evaluators only when calculating a residual", () => {
    const { targetAssignments, ...snapshot } = createDisagreementSnapshot()
    const evaluatorId = targetAssignments[0]?.evaluatorId
    const residual = selectEvaluatorResiduals(snapshot, CYCLE_ID, ALL_FILTERS).find(
      (entry) =>
        entry.engineerId === "engineer-02" &&
        entry.taskId === "task-growth-plan" &&
        entry.evaluatorId === evaluatorId,
    )

    expect(residual).toMatchObject({
      score: 100,
      leaveOneOutAverage: 80,
      residual: 20,
      isOutlier: true,
    })
  })

  it("simulates an evaluator exclusion within a shared task cohort", () => {
    const { targetAssignments, ...snapshot } = createDisagreementSnapshot()
    const evaluatorId = targetAssignments[0]?.evaluatorId
    const scenario = selectEvaluatorExclusionSensitivities(
      snapshot,
      CYCLE_ID,
      ALL_FILTERS,
    ).find(
      (entry) =>
        entry.taskId === "task-growth-plan" && entry.evaluatorId === evaluatorId,
    )
    const target = scenario?.rows.find((entry) => entry.engineerId === "engineer-02")

    expect(scenario?.cohortCount).toBeGreaterThan(1)
    expect(target).toMatchObject({
      baselineScore: 86.7,
      excludedScore: 80,
      scoreDelta: -6.7,
    })
  })
})
