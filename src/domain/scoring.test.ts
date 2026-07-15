import { describe, expect, it } from "vitest"

import {
  calculateEngineerResult,
  calculateTaskResult,
  rankCompletedResults,
  scoreSheetValue,
} from "./scoring"
import type {
  DirectScore,
  EngineerResult,
  EvaluationTask,
  EvaluatorAssignment,
  ScoreSheet,
} from "./types"

const scoreTask = (
  id: string,
  weight: number,
  itemCount = 4,
): EvaluationTask => ({
  id,
  cycleId: "cycle-1",
  name: id,
  description: `${id} 설명`,
  method: "evaluator_score",
  weight,
  order: 1,
  items: Array.from({ length: itemCount }, (_, index) => ({
    id: `${id}-item-${index + 1}`,
    label: `평가 항목 ${index + 1}`,
    order: index + 1,
  })),
  evaluatorWeights: [
    { evaluatorId: "evaluator-a", weight: 3 },
    { evaluatorId: "evaluator-b", weight: 1 },
  ],
})

const assignment = (taskId: string, evaluatorId: string): EvaluatorAssignment => ({
  id: `${taskId}-${evaluatorId}`,
  cycleId: "cycle-1",
  engineerId: "engineer-1",
  evaluatorId,
  taskId,
})

const sheet = (
  assignmentId: string,
  scores: ReadonlyArray<number | null>,
  passResult: boolean | null = null,
  taskId = "task",
): ScoreSheet => ({
  id: `sheet-${assignmentId}`,
  assignmentId,
  status: "submitted",
  scores: scores.map((score, index) => ({ itemId: `${taskId}-item-${index + 1}`, score })),
  passResult,
  updatedAt: "2026-07-14T00:00:00.000Z",
  submittedAt: "2026-07-14T00:00:00.000Z",
})

const operatorResult = (
  taskId: string,
  score: number | null,
  passResult: boolean | null = null,
): DirectScore => ({
  id: `direct-${taskId}`,
  cycleId: "cycle-1",
  engineerId: "engineer-1",
  taskId,
  score,
  passResult,
  updatedAt: "2026-07-14T00:00:00.000Z",
})

describe("scoreSheetValue", () => {
  it("Given four rubric items When every score exists Then it normalizes the sum to 100", () => {
    const task = scoreTask("task", 50, 4)
    const value = scoreSheetValue(task, sheet("assignment", [10, 8, 6, 4]))

    expect(value).toBe(70)
  })

  it("Given a valid zero and a missing score When normalized Then only the missing score blocks completion", () => {
    const task = scoreTask("task", 50, 2)

    expect(scoreSheetValue(task, sheet("complete", [0, 10]))).toBe(50)
    expect(scoreSheetValue(task, sheet("missing", [null, 10]))).toBeNull()
  })
})

describe("calculateTaskResult", () => {
  it("Given evaluator weights When all score sheets are submitted Then it uses the normalized evaluator weights", () => {
    const task = scoreTask("task", 60)
    const assignments = [
      assignment(task.id, "evaluator-a"),
      assignment(task.id, "evaluator-b"),
    ]
    const sheets = [
      sheet(assignments[0]?.id ?? "", [8, 8, 8, 8]),
      sheet(assignments[1]?.id ?? "", [10, 10, 10, 10]),
    ]

    const result = calculateTaskResult(task, assignments, sheets, [])

    expect(result.status).toBe("complete")
    expect(result.score).toBe(85)
    expect(result.evaluators.map((entry) => entry.normalizedWeight)).toEqual([0.75, 0.25])
  })

  it("Given evaluator P/F When weighted decisions are submitted Then it converts pass to 100 and fail to 0", () => {
    const task: EvaluationTask = {
      ...scoreTask("pass-fail", 40, 0),
      method: "evaluator_pass_fail",
      items: [],
    }
    const assignments = [
      assignment(task.id, "evaluator-a"),
      assignment(task.id, "evaluator-b"),
    ]
    const sheets = [
      sheet(assignments[0]?.id ?? "", [], true),
      sheet(assignments[1]?.id ?? "", [], false),
    ]

    const result = calculateTaskResult(task, assignments, sheets, [])

    expect(result.score).toBe(75)
    expect(result.passCount).toBe(1)
    expect(result.evaluatorCount).toBe(2)
  })

  it("Given an assigned evaluator without a submission When calculated Then the task stays incomplete", () => {
    const task = scoreTask("task", 100)
    const assignments = [
      assignment(task.id, "evaluator-a"),
      assignment(task.id, "evaluator-b"),
    ]

    expect(calculateTaskResult(task, assignments, [sheet(assignments[0]?.id ?? "", [8, 8, 8, 8])], []).score).toBeNull()
  })
})

describe("calculateEngineerResult", () => {
  it("Given engineer-specific OTS and DX weights When calculated Then only that engineer's applicable task contributes", () => {
    const operatorTask = (id: string, weight: number): EvaluationTask => ({
      ...scoreTask(id, weight, 0),
      method: "operator_score",
      items: [],
      evaluatorWeights: [],
    })
    const growth = operatorTask("growth", 35)
    const ots = operatorTask("ots", 17.5)
    const dx = operatorTask("dx", 17.5)
    const direct = operatorTask("direct", 30)
    const tasks = [growth, ots, dx, direct]
    const directScores = [
      operatorResult(growth.id, 80),
      operatorResult(ots.id, 100),
      operatorResult(dx.id, 60),
      operatorResult(direct.id, 90),
    ]

    const otsResult = calculateEngineerResult({
      cycleId: "cycle-1",
      engineerId: "engineer-ots",
      tasks,
      assignments: [],
      sheets: [],
      directScores,
      engineerTaskWeights: [
        { cycleId: "cycle-1", engineerId: "engineer-ots", taskId: growth.id, weight: 35 },
        { cycleId: "cycle-1", engineerId: "engineer-ots", taskId: ots.id, weight: 35 },
        { cycleId: "cycle-1", engineerId: "engineer-ots", taskId: dx.id, weight: 0 },
        { cycleId: "cycle-1", engineerId: "engineer-ots", taskId: direct.id, weight: 30 },
      ],
    })
    const dxResult = calculateEngineerResult({
      cycleId: "cycle-1",
      engineerId: "engineer-dx",
      tasks,
      assignments: [],
      sheets: [],
      directScores,
      engineerTaskWeights: [
        { cycleId: "cycle-1", engineerId: "engineer-dx", taskId: growth.id, weight: 35 },
        { cycleId: "cycle-1", engineerId: "engineer-dx", taskId: ots.id, weight: 0 },
        { cycleId: "cycle-1", engineerId: "engineer-dx", taskId: dx.id, weight: 35 },
        { cycleId: "cycle-1", engineerId: "engineer-dx", taskId: direct.id, weight: 30 },
      ],
    })

    expect(otsResult.taskResults.map((result) => result.taskId)).toEqual(["growth", "ots", "direct"])
    expect(otsResult.finalScore).toBe(90)
    expect(dxResult.taskResults.map((result) => result.taskId)).toEqual(["growth", "dx", "direct"])
    expect(dxResult.finalScore).toBe(76)
  })

  it("Given dynamic evaluator and operator tasks totaling 100% When every result exists Then it computes the weighted final score", () => {
    const evaluated = scoreTask("growth", 60)
    const operator: EvaluationTask = {
      ...scoreTask("language", 40, 0),
      method: "operator_score",
      items: [],
      evaluatorWeights: [],
    }
    const assignments = [
      assignment(evaluated.id, "evaluator-a"),
      assignment(evaluated.id, "evaluator-b"),
    ]
    const sheets = [
      sheet(assignments[0]?.id ?? "", [8, 8, 8, 8], null, evaluated.id),
      sheet(assignments[1]?.id ?? "", [10, 10, 10, 10], null, evaluated.id),
    ]

    const result = calculateEngineerResult({
      cycleId: "cycle-1",
      engineerId: "engineer-1",
      tasks: [evaluated, operator],
      assignments,
      sheets,
      directScores: [operatorResult(operator.id, 90)],
    })

    expect(result.status).toBe("complete")
    expect(result.finalScore).toBe(87)
    expect(result.roundedFinalScore).toBe(87)
  })

  it("Given task weights not totaling 100% When every response exists Then ranking remains unconfirmed", () => {
    const operator: EvaluationTask = {
      ...scoreTask("language", 90, 0),
      method: "operator_pass_fail",
      items: [],
      evaluatorWeights: [],
    }
    const result = calculateEngineerResult({
      cycleId: "cycle-1",
      engineerId: "engineer-1",
      tasks: [operator],
      assignments: [],
      sheets: [],
      directScores: [operatorResult(operator.id, null, true)],
    })

    expect(result.status).toBe("incomplete")
    expect(result.finalScore).toBeNull()
    expect(rankCompletedResults([result])).toEqual([])
  })
})

describe("rankCompletedResults", () => {
  it("Given rounded ties When ranked Then it uses competition ranking", () => {
    const result = (engineerId: string, score: number): EngineerResult => ({
      cycleId: "cycle-1",
      engineerId,
      status: "complete",
      taskResults: [],
      contributions: {},
      finalScore: score,
      roundedFinalScore: Math.round((score + Number.EPSILON) * 100) / 100,
    })

    expect(rankCompletedResults([
      result("a", 92.126),
      result("b", 88.004),
      result("c", 88.003),
      result("d", 79.999),
    ]).map((entry) => entry.rank)).toEqual([1, 2, 2, 4])
  })
})
