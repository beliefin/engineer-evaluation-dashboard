import { describe, expect, it } from "vitest"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"

const OPERATOR = { id: "operator-01", role: "operator" } as const

function createRepository() {
  return createLocalStorageEvaluationRepository({
    storage: new MemoryStorage(),
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

describe("LocalStorageEvaluationRepository evaluator lifecycle", () => {
  it("updates roster fields without replacing linked evaluation data", () => {
    const repository = createRepository()
    const before = repository.loadSnapshot()
    const evaluator = before.evaluators[0]
    expect(evaluator).toBeDefined()
    if (evaluator === undefined) return
    const assignmentIds = before.assignments
      .filter((assignment) => assignment.evaluatorId === evaluator.id)
      .map((assignment) => assignment.id)

    const updated = repository.updateEvaluator({
      cycleId: "cycle-2026-h1",
      evaluatorId: evaluator.id,
      employeeCode: "V-EDIT-001",
      displayName: "수정 평가자",
      team: "생산 2팀",
      actor: OPERATOR,
    })

    expect(updated.evaluators.find((entry) => entry.id === evaluator.id)).toEqual({
      id: evaluator.id,
      employeeCode: "V-EDIT-001",
      displayName: "수정 평가자",
      team: "생산 2팀",
    })
    expect(updated.assignments.filter((assignment) => assignment.evaluatorId === evaluator.id))
      .toHaveLength(assignmentIds.length)
    expect(updated.scoreSheets.filter((sheet) => assignmentIds.includes(sheet.assignmentId)))
      .toHaveLength(assignmentIds.length)
    expect(updated.auditEvents.at(-1)).toEqual(
      expect.objectContaining({ type: "evaluator_updated", targetId: evaluator.id }),
    )
  })

  it("rejects a duplicate employee code while editing", () => {
    const repository = createRepository()
    const [evaluator, duplicate] = repository.loadSnapshot().evaluators
    expect(evaluator).toBeDefined()
    expect(duplicate).toBeDefined()
    if (evaluator === undefined || duplicate === undefined) return

    expect(() => repository.updateEvaluator({
      cycleId: "cycle-2026-h1",
      evaluatorId: evaluator.id,
      employeeCode: duplicate.employeeCode,
      displayName: evaluator.displayName,
      team: evaluator.team,
      actor: OPERATOR,
    })).toThrowError(expect.objectContaining({ code: "DUPLICATE_EMPLOYEE_CODE" }))
  })

  it("deletes an evaluator and all assignments owned through that evaluator", () => {
    const repository = createRepository()
    const before = repository.loadSnapshot()
    const evaluator = before.evaluators[0]
    expect(evaluator).toBeDefined()
    if (evaluator === undefined) return
    const assignmentIds = new Set(before.assignments
      .filter((assignment) => assignment.evaluatorId === evaluator.id)
      .map((assignment) => assignment.id))

    const updated = repository.deleteEvaluator({
      cycleId: "cycle-2026-h1",
      evaluatorId: evaluator.id,
      actor: OPERATOR,
    })

    expect(updated.evaluators.some((entry) => entry.id === evaluator.id)).toBe(false)
    expect(updated.tasks.some((task) =>
      task.evaluatorWeights.some((entry) => entry.evaluatorId === evaluator.id))).toBe(false)
    expect(updated.assignments.some((entry) => entry.evaluatorId === evaluator.id)).toBe(false)
    expect(updated.scoreSheets.some((sheet) => assignmentIds.has(sheet.assignmentId))).toBe(false)
    expect(updated.auditEvents.at(-1)).toEqual(
      expect.objectContaining({ type: "evaluator_deleted", targetId: evaluator.id }),
    )
  })
})
