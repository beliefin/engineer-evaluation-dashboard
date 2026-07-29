import { describe, expect, it } from "vitest"

import { CYCLE_ID } from "@/data/seed-fixtures"
import { createSeedSnapshot } from "@/data/seed"

import {
  selectEvaluatorCalibrations,
  selectEvaluatorScoreComparisons,
} from "./analysis-rubrics"

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

describe("evaluator score comparison analysis", () => {
  it("shows each submitted evaluator score against the engineer-task consensus", () => {
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

    const comparisons = selectEvaluatorScoreComparisons(
      { ...snapshot, scoreSheets: updatedSheets },
      CYCLE_ID,
      ALL_FILTERS,
    )
    const target = comparisons.find(
      (entry) =>
        entry.engineerId === "engineer-02" &&
        entry.taskId === "task-growth-plan",
    )

    expect(target).toMatchObject({
      consensusScore: 86.7,
      minimumScore: 80,
      maximumScore: 100,
      scoreRange: 20,
      submittedCount: 3,
      outlierCount: 1,
    })
    expect(target?.observations.map((entry) => entry.score)).toEqual([100, 80, 80])
    expect(target?.observations.filter((entry) => entry.isOutlier)).toHaveLength(1)
    expect(target?.observations[0]).toMatchObject({
      deltaFromConsensus: 13.3,
      isOutlier: true,
    })
  })

  it("calibrates evaluators against peer scores for the same engineer and task", () => {
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

    const calibrations = selectEvaluatorCalibrations(
      { ...snapshot, scoreSheets: updatedSheets },
      CYCLE_ID,
      {
        ...ALL_FILTERS,
        category: "task-growth-plan",
      },
    )
    const elevatedEvaluatorId = targetAssignments[0]?.evaluatorId
    const calibration = calibrations.find(
      (entry) => entry.evaluatorId === elevatedEvaluatorId,
    )

    expect(calibration?.comparisonCount).toBeGreaterThan(0)
    expect(calibration?.meanSignedDelta).toBeGreaterThan(0)
    expect(calibration?.outlierCount).toBeGreaterThan(0)
  })

  it("respects the analysis team filter for both individual rows and calibration", () => {
    const snapshot = createSeedSnapshot()
    const filters = {
      ...ALL_FILTERS,
      team: "생산 1팀",
    }

    const comparisons = selectEvaluatorScoreComparisons(snapshot, CYCLE_ID, filters)
    const calibrations = selectEvaluatorCalibrations(snapshot, CYCLE_ID, filters)

    expect(comparisons.every((entry) => entry.teamLabel === "생산 1팀")).toBe(true)
    expect(calibrations.every((entry) => entry.taskId.length > 0)).toBe(true)
  })
})
