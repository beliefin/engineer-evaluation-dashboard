import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"
import type { ScoreSheet } from "@/domain"

import { selectPendingEvaluations } from "./pending"

const CYCLE_ID = "cycle-2026-h1"

describe("selectPendingEvaluations", () => {
  it("returns every incomplete engineer with actionable progress details", () => {
    // Given
    const snapshot = createSeedSnapshot()

    // When
    const selection = selectPendingEvaluations(snapshot, CYCLE_ID)

    // Then
    expect(selection.metrics).toEqual({
      totalEngineers: 24,
      completedEngineers: 12,
      pendingEngineers: 12,
      byStatus: {
        unassigned: 2,
        not_started: 0,
        in_progress: 6,
        direct_scores_pending: 4,
      },
    })
    expect(selection.rows).toHaveLength(12)
    expect(selection.rows.find((row) => row.engineerId === "engineer-13")).toMatchObject({
      status: "in_progress",
      submittedSheetCount: 9,
      totalSheetCount: 10,
      enteredDirectScoreCount: 1,
      totalDirectScoreCount: 3,
      missingEvaluatorNames: ["샘플 평가자 1"],
      firstPendingAssignmentId:
        "engineer-13-task-dx-tool-evaluator-01",
    })
    expect(selection.rows.find((row) => row.engineerId === "engineer-19")).toMatchObject({
      status: "direct_scores_pending",
      submittedSheetCount: 10,
      totalSheetCount: 10,
      enteredDirectScoreCount: 2,
      missingEvaluatorNames: [],
      firstPendingAssignmentId: null,
    })
    expect(selection.rows.find((row) => row.engineerId === "engineer-23")).toMatchObject({
      status: "unassigned",
      submittedSheetCount: 0,
      totalSheetCount: 0,
      enteredDirectScoreCount: 0,
      firstPendingAssignmentId: null,
    })
  })

  it("marks an assigned engineer as not started when every draft answer is empty", () => {
    // Given
    const snapshot = createSeedSnapshot()
    const assignmentIds = snapshot.assignments
      .filter((assignment) => assignment.engineerId === "engineer-13")
      .map((assignment) => assignment.id)
    const notStarted = {
      ...snapshot,
      scoreSheets: snapshot.scoreSheets.map((sheet): ScoreSheet =>
        assignmentIds.includes(sheet.assignmentId)
          ? {
              ...sheet,
              status: "draft",
              scores: sheet.scores.map((score) => ({ ...score, score: null })),
              submittedAt: null,
            }
          : sheet,
      ),
    }

    // When
    const selection = selectPendingEvaluations(notStarted, CYCLE_ID)

    // Then
    expect(selection.rows.find((row) => row.engineerId === "engineer-13")).toMatchObject({
      status: "not_started",
      submittedSheetCount: 0,
      totalSheetCount: 10,
      missingEvaluatorNames: [
        "샘플 평가자 1",
        "샘플 평가자 2",
        "샘플 평가자 3",
        "샘플 평가자 4",
        "샘플 평가자 5",
      ],
      firstPendingAssignmentId:
        "engineer-13-task-growth-plan-evaluator-01",
    })
    expect(selection.metrics.byStatus.not_started).toBe(1)
    expect(selection.metrics.byStatus.in_progress).toBe(5)
  })

  it("treats a direct score of zero as entered and excludes the completed engineer", () => {
    // Given
    const snapshot = createSeedSnapshot()
    const withZero = {
      ...snapshot,
      directScores: snapshot.directScores.map((score) =>
        score.engineerId === "engineer-19" && score.taskId === "task-proposal"
          ? { ...score, score: 0 }
          : score,
      ),
    }

    // When
    const selection = selectPendingEvaluations(withZero, CYCLE_ID)

    // Then
    expect(selection.rows.some((row) => row.engineerId === "engineer-19")).toBe(false)
    expect(selection.metrics.completedEngineers).toBe(13)
    expect(selection.metrics.pendingEngineers).toBe(11)
    expect(selection.metrics.byStatus.direct_scores_pending).toBe(3)
  })

  it("returns an empty selection when the cycle does not exist", () => {
    // Given
    const snapshot = createSeedSnapshot()

    // When
    const selection = selectPendingEvaluations(snapshot, "missing-cycle")

    // Then
    expect(selection.rows).toEqual([])
    expect(selection.metrics).toEqual({
      totalEngineers: 0,
      completedEngineers: 0,
      pendingEngineers: 0,
      byStatus: {
        unassigned: 0,
        not_started: 0,
        in_progress: 0,
        direct_scores_pending: 0,
      },
    })
  })
})
