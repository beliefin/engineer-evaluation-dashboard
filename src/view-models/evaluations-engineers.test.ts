import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import {
  selectAssignedEvaluations,
  selectEngineerDetail,
  selectEvaluationScoreForm,
} from "./index"

const CYCLE_ID = "cycle-2026-h1"

describe("evaluator-facing selectors", () => {
  it("returns every active-cycle assignment for an operator and identifies its evaluator", () => {
    const snapshot = createSeedSnapshot()
    const assignments = selectAssignedEvaluations(snapshot, CYCLE_ID)

    expect(assignments).toHaveLength(snapshot.assignments.length)
    expect(assignments.every((entry) => entry.evaluatorName.length > 0)).toBe(true)
    expect(new Set(assignments.map((entry) => entry.evaluatorId)).size).toBe(
      snapshot.evaluators.length,
    )
  })

  it("derives assignment status from submitted and partial score sheets", () => {
    const snapshot = createSeedSnapshot()
    const assignments = selectAssignedEvaluations(
      snapshot,
      CYCLE_ID,
      "evaluator-04",
    )

    const evaluatorAssignmentIds = new Set(snapshot.assignments
      .filter((entry) => entry.evaluatorId === "evaluator-04")
      .map((entry) => entry.id))
    const submittedCount = snapshot.scoreSheets.filter((sheet) =>
      evaluatorAssignmentIds.has(sheet.assignmentId) && sheet.status === "submitted").length
    expect(assignments).toHaveLength(evaluatorAssignmentIds.size)
    expect(assignments.filter((entry) => entry.status === "submitted")).toHaveLength(submittedCount)
    expect(assignments.filter((entry) => entry.status === "in_progress")).toHaveLength(
      evaluatorAssignmentIds.size - submittedCount,
    )
    expect(new Set(assignments.map((entry) => entry.categoryLabel))).toEqual(
      new Set(["성장탐구계획서", "OTS 시나리오 제작", "DX 툴 활용"]),
    )
  })

  it("builds a locked score form without evaluator weight data", () => {
    const snapshot = createSeedSnapshot()
    const submitted = snapshot.assignments.find(
      (assignment) => assignment.evaluatorId === "evaluator-04",
    )
    const form = selectEvaluationScoreForm(snapshot, submitted?.id ?? "missing")

    expect(form?.locked).toBe(true)
    expect(form?.items).toHaveLength(10)
    expect(form?.evaluatorName).toBeTruthy()
    expect(form).not.toHaveProperty("weight")
    expect(form).not.toHaveProperty("otherEvaluators")
  })

  it("shows an anonymous recent-presenter benchmark for the same task", () => {
    const seed = createSeedSnapshot()
    const taskId = "task-growth-plan"
    const currentAssignment = seed.assignments.find((assignment) =>
      assignment.engineerId === "engineer-04" && assignment.taskId === taskId)
    if (currentAssignment === undefined) throw new RangeError("assignment fixture missing")
    const scheduleEvents = ["engineer-01", "engineer-02", "engineer-03", "engineer-04"]
      .map((engineerId, index) => ({
        id: `benchmark-schedule-${index}`,
        cycleId: CYCLE_ID,
        engineerId,
        taskId,
        title: "성장탐구계획서 발표",
        date: `2026-07-${String(index + 1).padStart(2, "0")}`,
        startTime: "09:00",
        note: null,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      }))

    const form = selectEvaluationScoreForm(
      { ...seed, scheduleEvents, evaluationBenchmarks: [] },
      currentAssignment.id,
    )

    expect(form?.benchmark).toMatchObject({ sampleSize: 3 })
    expect(form?.benchmark?.averageScore).toBeGreaterThan(0)
    expect(form?.benchmark?.minScore).toBeLessThanOrEqual(form?.benchmark?.maxScore ?? 0)
  })
})

describe("engineer detail role boundary", () => {
  it("shows evaluator details only to an operator", () => {
    const snapshot = createSeedSnapshot()
    const operator = selectEngineerDetail(
      snapshot,
      CYCLE_ID,
      "engineer-01",
      "operator",
    )
    const approver = selectEngineerDetail(
      snapshot,
      CYCLE_ID,
      "engineer-01",
      "approver",
    )

    expect(operator?.evaluatorScores).toHaveLength(
      snapshot.assignments.filter((entry) => entry.engineerId === "engineer-01").length,
    )
    expect(approver?.evaluatorScores).toEqual([])
    expect(operator?.evaluatorScores.every((entry) => entry.normalizedRatioPercent > 0)).toBe(true)
    expect(operator?.categories.find((category) => category.key === "task-dx-tool")?.reflectionRatioPercent).toBe(35)
    expect(operator?.categories.some((category) => category.key === "task-ots-scenario")).toBe(false)
  })

  it("keeps a missing direct score distinct from a valid zero", () => {
    const snapshot = {
      ...createSeedSnapshot(),
      directScoreRules: [],
    }
    const proposal = snapshot.directScores.find(
      (score) => score.engineerId === "engineer-19" && score.taskId === "task-proposal",
    )
    expect(proposal?.score).toBeNull()

    const detail = selectEngineerDetail(
      snapshot,
      CYCLE_ID,
      "engineer-19",
      "operator",
    )
    expect(detail?.result.status).toBe("unconfirmed")
    expect(detail?.result.finalScore).toBeNull()

    const withZero = {
      ...snapshot,
      directScores: snapshot.directScores.map((score) =>
        score.engineerId === "engineer-19" && score.taskId === "task-proposal"
          ? { ...score, score: 0 }
          : score,
      ),
    }
    const completed = selectEngineerDetail(
      withZero,
      CYCLE_ID,
      "engineer-19",
      "operator",
    )
    const zeroProposal = completed?.categories.find(
      (category) => category.key === "task-proposal",
    )
    expect(zeroProposal?.status).toBe("complete")
    expect(zeroProposal?.rawScore).toBe(0)
    expect(completed?.result.status).toBe("complete")
  })

  it("shows the weighted base score and operator adjustment breakdown", () => {
    const snapshot = createSeedSnapshot()
    const before = selectEngineerDetail(snapshot, CYCLE_ID, "engineer-01", "operator")
    if (before?.result.status !== "complete") throw new RangeError("complete fixture missing")
    const adjusted = selectEngineerDetail({
      ...snapshot,
      scoreAdjustments: [{
        id: "adjustment-1",
        cycleId: CYCLE_ID,
        engineerId: "engineer-01",
        amount: 3,
        reason: "우수 발표 가점",
        createdAt: "2026-07-16T00:00:00.000Z",
        updatedAt: "2026-07-16T00:00:00.000Z",
      }],
    }, CYCLE_ID, "engineer-01", "operator")
    if (adjusted?.result.status !== "complete") throw new RangeError("adjusted fixture missing")

    expect(adjusted.result.baseScore).toBeCloseTo(before.result.finalScore)
    expect(adjusted.result.adjustmentTotal).toBe(3)
    expect(adjusted.result.finalScore).toBe(Math.min(100, before.result.finalScore + 3))
    expect(adjusted.result.adjustments).toEqual([
      expect.objectContaining({ amount: 3, reason: "우수 발표 가점" }),
    ])
  })
})
