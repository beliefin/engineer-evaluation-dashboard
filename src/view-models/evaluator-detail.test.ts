import { describe, expect, it } from "vitest"

import { CYCLE_ID } from "@/data/seed-fixtures"
import { createSeedSnapshot } from "@/data/seed"

import { selectEvaluatorDetail } from "./evaluator-detail"

function withItemScore(score: number) {
  return (entry: Readonly<{ itemId: string; score: number | null }>) => ({
    ...entry,
    score,
  })
}

describe("evaluator detail analysis", () => {
  it("summarizes submitted score level, peer residuals, tasks and rubric items", () => {
    const snapshot = createSeedSnapshot()
    const group = snapshot.assignments.filter((assignment) =>
      assignment.engineerId === "engineer-02" &&
      assignment.taskId === "task-growth-plan")
    const selectedEvaluatorId = group[0]?.evaluatorId
    expect(selectedEvaluatorId).toBeDefined()
    if (selectedEvaluatorId === undefined) return

    const scoreSheets = snapshot.scoreSheets.map((sheet) => {
      const index = group.findIndex((assignment) => assignment.id === sheet.assignmentId)
      if (index === -1) return sheet
      return {
        ...sheet,
        status: "submitted" as const,
        scores: sheet.scores.map(withItemScore(index === 0 ? 10 : 6)),
      }
    })

    const model = selectEvaluatorDetail(
      { ...snapshot, scoreSheets },
      CYCLE_ID,
      selectedEvaluatorId,
    )

    expect(model).not.toBeNull()
    expect(model?.summary.submittedCount).toBeGreaterThan(0)
    expect(model?.summary.uniqueEngineerCount).toBeGreaterThan(0)
    expect(model?.summary.averageScore).not.toBeNull()
    expect(model?.taskTendencies.length).toBeGreaterThan(0)
    expect(model?.itemProfiles.length).toBeGreaterThan(0)
    expect(model?.recentEvaluations.some((entry) =>
      entry.engineerId === "engineer-02" &&
      entry.taskId === "task-growth-plan" &&
      entry.residual === 40 &&
      entry.isOutlier)).toBe(true)
    expect(model?.summary.meanSignedResidual).toBeGreaterThan(0)
    expect(model?.characteristics.length).toBeGreaterThanOrEqual(3)
  })

  it("excludes draft sheets from submitted evaluation metrics", () => {
    const snapshot = createSeedSnapshot()
    const evaluatorId = snapshot.evaluators[0]?.id
    expect(evaluatorId).toBeDefined()
    if (evaluatorId === undefined) return
    const assignmentIds = new Set(snapshot.assignments
      .filter((assignment) => assignment.evaluatorId === evaluatorId)
      .map((assignment) => assignment.id))
    const scoreSheets = snapshot.scoreSheets.map((sheet) =>
      assignmentIds.has(sheet.assignmentId)
        ? { ...sheet, status: "draft" as const, submittedAt: null }
        : sheet)

    const model = selectEvaluatorDetail(
      { ...snapshot, scoreSheets },
      CYCLE_ID,
      evaluatorId,
    )

    expect(model?.summary.assignedCount).toBeGreaterThan(0)
    expect(model?.summary.submittedCount).toBe(0)
    expect(model?.summary.averageScore).toBeNull()
    expect(model?.recentEvaluations).toHaveLength(0)
  })

  it("returns null for an evaluator outside the roster", () => {
    expect(selectEvaluatorDetail(createSeedSnapshot(), CYCLE_ID, "missing")).toBeNull()
  })
})
