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
      submittedSheetCount: 3,
      totalSheetCount: 4,
      enteredDirectScoreCount: 0,
      totalDirectScoreCount: 3,
      missingEvaluatorNames: ["샘플 평가자 3"],
      firstPendingAssignmentId:
        "engineer-13-task-dx-tool-evaluator-03",
    })
    expect(selection.rows.find((row) => row.engineerId === "engineer-19")).toMatchObject({
      status: "direct_scores_pending",
      submittedSheetCount: 4,
      totalSheetCount: 4,
      enteredDirectScoreCount: 0,
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
      totalSheetCount: 4,
      missingEvaluatorNames: [
        "샘플 평가자 3",
        "샘플 평가자 4",
      ],
      firstPendingAssignmentId:
        "engineer-13-task-growth-plan-evaluator-03",
    })
    expect(selection.metrics.byStatus.not_started).toBe(1)
    expect(selection.metrics.byStatus.in_progress).toBe(5)
  })

  it("treats a direct score of zero as entered and excludes the completed engineer", () => {
    // Given
    const snapshot = {
      ...createSeedSnapshot(),
      directScoreRules: [],
    }
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

  it("treats explicit no-score declarations as complete only for the declaring engineer", () => {
    // Given
    const seed = createSeedSnapshot()
    const directTaskIds = ["task-language", "task-certification"]
    const directTasks = seed.tasks
      .filter((task) => directTaskIds.includes(task.id))
      .map((task) => ({ ...task, weight: 50 }))
    const snapshot = {
      ...seed,
      engineers: seed.engineers.filter((engineer) =>
        engineer.id === "engineer-01" || engineer.id === "engineer-02",
      ),
      tasks: directTasks,
      engineerTaskWeights: [],
      assignments: [],
      scoreSheets: [],
      directScores: [],
      directScoreRules: seed.directScoreRules.filter((rule) => directTaskIds.includes(rule.taskId)),
      languageScoreRecords: [{
        id: "language-none-engineer-01",
        cycleId: CYCLE_ID,
        engineerId: "engineer-01",
        examName: "보유 어학성적 없음",
        languageName: null,
        result: "0",
        noScore: true,
        languageGroup: "english" as const,
        previousResult: null,
        newlyAcquired: false,
        acquiredOn: null,
        note: null,
        updatedAt: "2026-07-23T00:00:00.000Z",
      }],
      certificationRecords: [{
        id: "certification-none-engineer-01",
        cycleId: CYCLE_ID,
        engineerId: "engineer-01",
        certificateName: "보유 자격증 없음",
        noScore: true,
        grade: null,
        acquiredOn: null,
        issuer: null,
        updatedAt: "2026-07-23T00:00:00.000Z",
      }],
    }

    // When
    const selection = selectPendingEvaluations(snapshot, CYCLE_ID)

    // Then
    expect(selection.rows.some((row) => row.engineerId === "engineer-01")).toBe(false)
    expect(selection.rows.find((row) => row.engineerId === "engineer-02")).toMatchObject({
      status: "not_started",
      enteredDirectScoreCount: 0,
      totalDirectScoreCount: 2,
    })
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
