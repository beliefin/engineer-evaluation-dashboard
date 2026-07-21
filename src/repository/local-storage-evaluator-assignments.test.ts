import { describe, expect, it } from "vitest"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"

const OPERATOR = { id: "operator-01", role: "operator" } as const
const CYCLE_ID = "cycle-2026-h1"

function createRepository() {
  return createLocalStorageEvaluationRepository({
    storage: new MemoryStorage(),
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

describe("LocalStorageEvaluationRepository evaluator assignments", () => {
  it("stores a season evaluator preset without creating assignments", () => {
    const repository = createRepository()
    const snapshot = repository.loadSnapshot()
    const evaluators = snapshot.evaluators.slice(0, 3)
    if (evaluators.length < 3) throw new RangeError("evaluator fixture missing")
    const assignmentCount = snapshot.assignments.length

    const updated = repository.updateEvaluatorPreset({
      cycleId: CYCLE_ID,
      evaluatorWeights: evaluators.map((evaluator, index) => ({
        evaluatorId: evaluator.id,
        weight: index === 0 ? 3 : 2,
      })),
      actor: OPERATOR,
    })

    expect(updated.cycles.find((cycle) => cycle.id === CYCLE_ID)?.evaluatorPreset).toEqual([
      { evaluatorId: evaluators[0]?.id, weight: 3 },
      { evaluatorId: evaluators[1]?.id, weight: 2 },
      { evaluatorId: evaluators[2]?.id, weight: 2 },
    ])
    expect(updated.assignments).toHaveLength(assignmentCount)
  })

  it("creates obligations only for evaluators explicitly assigned to one engineer and task", () => {
    const repository = createRepository()
    const created = repository.saveEvaluationTask({
      taskId: null,
      cycleId: CYCLE_ID,
      name: "개인 배정 검증 과제",
      description: "",
      method: "evaluator_score",
      weight: 1,
      items: [{ id: null, label: "평가 항목" }],
      actor: OPERATOR,
    })
    const snapshot = repository.loadSnapshot()
    const engineer = snapshot.engineers[0]
    const otherEngineer = snapshot.engineers[1]
    const task = created.tasks.at(-1)
    const evaluators = snapshot.evaluators.slice(0, 2)
    if (engineer === undefined || otherEngineer === undefined || task === undefined || evaluators.length < 2) {
      throw new RangeError("assignment fixture missing")
    }

    const updated = repository.updateEvaluatorAssignments({
      cycleId: CYCLE_ID,
      engineerId: engineer.id,
      taskId: task.id,
      evaluatorWeights: evaluators.map((evaluator, index) => ({
        evaluatorId: evaluator.id,
        weight: index === 0 ? 2 : 1,
      })),
      actor: OPERATOR,
    })

    const assignments = updated.assignments.filter((entry) =>
      entry.engineerId === engineer.id && entry.taskId === task.id)
    expect(assignments.map((entry) => ({ evaluatorId: entry.evaluatorId, weight: entry.weight })))
      .toEqual(evaluators.map((evaluator, index) => ({
        evaluatorId: evaluator.id,
        weight: index === 0 ? 2 : 1,
      })))
    expect(updated.assignments.some((entry) =>
      entry.engineerId === otherEngineer.id && entry.taskId === task.id &&
      evaluators.some((evaluator) => evaluator.id === entry.evaluatorId))).toBe(false)
  })

  it("removes an untouched assignment but protects an assignment with entered scores", () => {
    const repository = createRepository()
    const created = repository.saveEvaluationTask({
      taskId: null,
      cycleId: CYCLE_ID,
      name: "배정 보호 검증 과제",
      description: "",
      method: "evaluator_score",
      weight: 1,
      items: [{ id: null, label: "평가 항목" }],
      actor: OPERATOR,
    })
    const snapshot = repository.loadSnapshot()
    const engineer = snapshot.engineers[0]
    const task = created.tasks.at(-1)
    const evaluator = snapshot.evaluators[0]
    if (engineer === undefined || task === undefined || evaluator === undefined) {
      throw new RangeError("assignment fixture missing")
    }

    const assigned = repository.updateEvaluatorAssignments({
      cycleId: CYCLE_ID,
      engineerId: engineer.id,
      taskId: task.id,
      evaluatorWeights: [{ evaluatorId: evaluator.id, weight: 1 }],
      actor: OPERATOR,
    })
    const assignment = assigned.assignments.find((entry) =>
      entry.engineerId === engineer.id && entry.taskId === task.id && entry.evaluatorId === evaluator.id)
    const sheet = assigned.scoreSheets.find((entry) => entry.assignmentId === assignment?.id)
    if (assignment === undefined || sheet === undefined) throw new RangeError("score sheet missing")

    repository.saveDraft({
      sheetId: sheet.id,
      scores: sheet.scores.map((entry, index) => ({ ...entry, score: index === 0 ? 7 : null })),
      passResult: null,
      actor: OPERATOR,
    })

    expect(() => repository.updateEvaluatorAssignments({
      cycleId: CYCLE_ID,
      engineerId: engineer.id,
      taskId: task.id,
      evaluatorWeights: [],
      actor: OPERATOR,
    })).toThrowError(expect.objectContaining({ code: "TASK_LOCKED" }))
  })
})
