import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import {
  selectDashboardViewModel,
  selectEngineerResultSummaries,
} from "./index"

const CYCLE_ID = "cycle-2026-h1"

describe("engineer result selectors", () => {
  it("separates completed, in-progress, and unconfirmed engineers", () => {
    const summaries = selectEngineerResultSummaries(
      createSeedSnapshot(),
      CYCLE_ID,
    )

    expect(summaries).toHaveLength(24)
    expect(summaries.filter((entry) => entry.status === "complete")).toHaveLength(12)
    expect(summaries.filter((entry) => entry.status === "in_progress")).toHaveLength(8)
    expect(summaries.filter((entry) => entry.status === "unconfirmed")).toHaveLength(4)
  })

  it("ranks current weighted scores while keeping never-started engineers at the bottom", () => {
    const dashboard = selectDashboardViewModel(createSeedSnapshot(), CYCLE_ID)

    expect(dashboard).not.toBeNull()
    expect(dashboard?.rankingRows).toHaveLength(24)
    expect(
      dashboard?.rankingRows.filter((row) => row.totalScore !== null),
    ).toHaveLength(22)
    expect(
      dashboard?.rankingRows
        .filter((row) => row.totalScore === null)
        .every((row) => row.rank === null && row.status === "not_started"),
    ).toBe(true)
  })

  it("keeps every engineer out of final scoring when task weights do not total 100", () => {
    const snapshot = createSeedSnapshot()
    const invalidWeightSnapshot = {
      ...snapshot,
      engineerTaskWeights: [],
      tasks: snapshot.tasks.map((task) =>
        task.id === "task-growth-plan" ? { ...task, weight: 34 } : task,
      ),
    }

    const summaries = selectEngineerResultSummaries(
      invalidWeightSnapshot,
      CYCLE_ID,
    )
    const dashboard = selectDashboardViewModel(invalidWeightSnapshot, CYCLE_ID)

    expect(
      summaries.every(
        ({ result }) =>
          result.status === "incomplete" &&
          result.roundedFinalScore === null,
      ),
    ).toBe(true)
    expect(
      dashboard?.rankingRows.every((row) => row.status !== "confirmed"),
    ).toBe(true)
    expect(dashboard?.rankingRows.some((row) => row.status === "in_progress")).toBe(true)
  })

  it("reports the sample completion metrics without merging missing states", () => {
    const dashboard = selectDashboardViewModel(createSeedSnapshot(), CYCLE_ID)

    expect(dashboard?.metrics.find((metric) => metric.id === "target")?.value).toBe(24)
    expect(
      dashboard?.metrics.find((metric) => metric.id === "completion-rate")?.value,
    ).toBe(50)
    expect(
      dashboard?.metrics.find((metric) => metric.id === "in-progress")?.value,
    ).toBe(8)
    expect(
      dashboard?.metrics.find((metric) => metric.id === "unconfirmed")?.value,
    ).toBe(4)
  })

  it("Given a team scope When selecting the dashboard Then every aggregate uses only that team", () => {
    // Given
    const snapshot = createSeedSnapshot()

    // When
    const dashboard = selectDashboardViewModel(snapshot, CYCLE_ID, "생산 1팀")

    // Then
    expect(dashboard?.metrics.find((metric) => metric.id === "target")?.value).toBe(12)
    expect(dashboard?.evaluationRows).toHaveLength(12)
    expect(dashboard?.evaluationRows.every((row) => row.team === "생산 1팀")).toBe(true)
    expect(dashboard?.rankingRows.every((row) => row.team === "생산 1팀")).toBe(true)
    expect(
      dashboard?.taskRankings.every((ranking) =>
        ranking.rows.every((row) => row.team === "생산 1팀"),
      ),
    ).toBe(true)
  })

  it("ranks each task by completed weighted average and leaves unfinished targets below ranked rows", () => {
    const dashboard = selectDashboardViewModel(createSeedSnapshot(), CYCLE_ID)
    const growth = dashboard?.taskRankings.find((ranking) => ranking.taskId === "task-growth-plan")

    expect(dashboard?.taskRankings).toHaveLength(6)
    expect(growth).toMatchObject({
      label: "성장탐구계획서",
      completedCount: 22,
      targetCount: 24,
    })
    expect(growth?.rows.slice(0, 22).every((row) => row.rank !== null && row.score !== null)).toBe(true)
    expect(growth?.rows.slice(22).every((row) => row.rank === null && row.status === "not_started")).toBe(true)
  })

  it("applies competition ranks to equal task averages", () => {
    const snapshot = createSeedSnapshot()
    const tiedEngineerIds = new Set(["engineer-01", "engineer-02"])
    const assignmentIds = new Set(
      snapshot.assignments
        .filter((assignment) =>
          tiedEngineerIds.has(assignment.engineerId) && assignment.taskId === "task-growth-plan",
        )
        .map((assignment) => assignment.id),
    )
    const scoreSheets = snapshot.scoreSheets.map((sheet) =>
      assignmentIds.has(sheet.assignmentId)
        ? { ...sheet, scores: sheet.scores.map((score) => ({ ...score, score: 8 })) }
        : sheet,
    )
    const dashboard = selectDashboardViewModel({ ...snapshot, scoreSheets }, CYCLE_ID)
    const growthRows = dashboard?.taskRankings
      .find((ranking) => ranking.taskId === "task-growth-plan")
      ?.rows.filter((row) => tiedEngineerIds.has(row.id))

    expect(growthRows).toHaveLength(2)
    expect(growthRows?.[0]?.rank).toBe(growthRows?.[1]?.rank)
    expect(growthRows?.every((row) => row.isTied)).toBe(true)
  })

  it("Given assigned evaluations When no score exists or every evaluator submitted Then status is not started or complete", () => {
    // Given
    const dashboard = selectDashboardViewModel(createSeedSnapshot(), CYCLE_ID)

    // When
    const notStarted = dashboard?.evaluationRows.find((row) => row.name === "샘플 엔지니어 23")
    const completed = dashboard?.evaluationRows.find((row) => row.name === "샘플 엔지니어 01")
    const growth = completed?.tasks.find((task) => task.taskId === "task-growth-plan")

    // Then
    expect(notStarted?.status).toBe("not_started")
    expect(completed?.status).toBe("complete")
    expect(growth).toMatchObject({
      status: "complete",
      completedEvaluatorCount: 2,
      evaluatorCount: 2,
    })
  })

  it("Given unequal evaluator weights When task averages are calculated Then weighted and simple averages are both exposed", () => {
    // Given
    const snapshot = createSeedSnapshot()
    const assignments = snapshot.assignments.filter((assignment) =>
      assignment.engineerId === "engineer-01" && assignment.taskId === "task-growth-plan",
    )
    const scoreSheets = snapshot.scoreSheets.map((sheet) => {
      const evaluatorIndex = assignments.findIndex((assignment) => assignment.id === sheet.assignmentId)
      if (evaluatorIndex < 0) return sheet
      return {
        ...sheet,
        status: "submitted" as const,
        scores: sheet.scores.map((score) => ({ ...score, score: evaluatorIndex === 0 ? 10 : 0 })),
      }
    })

    // When
    const dashboard = selectDashboardViewModel(
      { ...snapshot, scoreSheets },
      CYCLE_ID,
      "생산 1팀",
    )
    const growth = dashboard?.categoryAverages.find((task) => task.id === "task-growth-plan")

    // Then
    expect(growth).toMatchObject({
      weightedScore: 78.8,
      unweightedScore: 77.3,
      sampleSize: 11,
    })
  })
})
