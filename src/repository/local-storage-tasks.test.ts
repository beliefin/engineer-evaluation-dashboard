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

describe("LocalStorageEvaluationRepository task configuration", () => {
  it("Given one engineer's complete task allocation When saved Then it persists OTS and DX applicability by weight", () => {
    const repository = createRepository()
    const snapshot = repository.loadSnapshot()
    const engineer = snapshot.engineers[0]
    if (engineer === undefined) throw new RangeError("engineer missing")
    const weights = snapshot.tasks.map((task) => ({
      taskId: task.id,
      weight: task.id === "task-ots-scenario"
        ? 35
        : task.id === "task-dx-tool"
          ? 0
          : task.weight,
    }))

    const updated = repository.updateEngineerTaskWeights({
      cycleId: CYCLE_ID,
      engineerId: engineer.id,
      weights,
      actor: OPERATOR,
    })

    expect(updated.engineerTaskWeights.filter((entry) => entry.engineerId === engineer.id)).toEqual(
      weights.map((entry) => ({ ...entry, cycleId: CYCLE_ID, engineerId: engineer.id })),
    )
    expect(JSON.stringify(repository.loadSnapshot())).toContain('"taskId":"task-ots-scenario","weight":35')
  })

  it("blocks season defaults when optional task weights do not form a 100% personal allocation", () => {
    const repository = createRepository()
    const snapshot = repository.loadSnapshot()
    const engineer = snapshot.engineers[0]
    if (engineer === undefined) throw new RangeError("engineer missing")

    expect(() => repository.updateEngineerTaskWeights({
      cycleId: CYCLE_ID,
      engineerId: engineer.id,
      weights: snapshot.tasks.map((task) => ({ taskId: task.id, weight: task.weight })),
      useSeasonDefaults: true,
      actor: OPERATOR,
    })).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }))
  })

  it("Given an evaluator P/F task When saved Then assignments and blank sheets are synchronized for every engineer", () => {
    const repository = createRepository()
    const snapshot = repository.loadSnapshot()
    const evaluatorIds = snapshot.evaluators.slice(0, 2).map((evaluator) => evaluator.id)

    const updated = repository.saveEvaluationTask({
      taskId: null,
      cycleId: CYCLE_ID,
      name: "현장 안전 발표",
      description: "안전 기준 충족 여부를 판정합니다.",
      method: "evaluator_pass_fail",
      weight: 5,
      items: [],
      evaluatorWeights: evaluatorIds.map((evaluatorId, index) => ({
        evaluatorId,
        weight: index === 0 ? 2 : 1,
      })),
      actor: OPERATOR,
    })
    const task = updated.tasks.at(-1)
    if (task === undefined) throw new RangeError("task was not saved")
    const assignments = updated.assignments.filter((entry) => entry.taskId === task.id)
    const assignmentIds = new Set(assignments.map((entry) => entry.id))
    const sheets = updated.scoreSheets.filter((entry) => assignmentIds.has(entry.assignmentId))

    expect(task).toMatchObject({ name: "현장 안전 발표", method: "evaluator_pass_fail" })
    expect(assignments).toHaveLength(updated.engineers.length * evaluatorIds.length)
    expect(sheets).toHaveLength(assignments.length)
    expect(sheets.every((sheet) =>
      sheet.status === "draft" && sheet.scores.length === 0 && sheet.passResult === null
    )).toBe(true)
  })

  it("Given a new evaluator score task When evaluator and items change Then draft sheets follow the latest configuration", () => {
    const repository = createRepository()
    const snapshot = repository.loadSnapshot()
    const firstEvaluator = snapshot.evaluators[0]
    const secondEvaluator = snapshot.evaluators[1]
    if (firstEvaluator === undefined || secondEvaluator === undefined) {
      throw new RangeError("evaluators missing")
    }
    const created = repository.saveEvaluationTask({
      taskId: null,
      cycleId: CYCLE_ID,
      name: "개선 발표",
      description: "개선 효과를 평가합니다.",
      method: "evaluator_score",
      weight: 5,
      items: [
        {
          id: null,
          label: "문제 정의",
          section: "본론",
          criteria: [{ score: 7, description: "문제를 구체적으로 정의함." }],
        },
        { id: null, label: "개선 효과" },
      ],
      evaluatorWeights: [{ evaluatorId: firstEvaluator.id, weight: 1 }],
      actor: OPERATOR,
    })
    const task = created.tasks.at(-1)
    if (task === undefined) throw new RangeError("task was not created")
    expect(task.items[0]?.criteria).toEqual([
      { score: 7, description: "문제를 구체적으로 정의함." },
    ])

    const updated = repository.saveEvaluationTask({
      taskId: task.id,
      cycleId: CYCLE_ID,
      name: task.name,
      description: task.description,
      method: "evaluator_score",
      weight: task.weight,
      items: [
        { id: task.items[0]?.id ?? null, label: "문제 정의" },
        { id: null, label: "실행 가능성" },
        { id: null, label: "개선 효과" },
      ],
      evaluatorWeights: [{ evaluatorId: secondEvaluator.id, weight: 1 }],
      actor: OPERATOR,
    })
    const assignments = updated.assignments.filter((entry) => entry.taskId === task.id)
    const assignmentIds = new Set(assignments.map((entry) => entry.id))
    const sheets = updated.scoreSheets.filter((entry) => assignmentIds.has(entry.assignmentId))

    expect(new Set(assignments.map((entry) => entry.evaluatorId))).toEqual(new Set([secondEvaluator.id]))
    expect(sheets.every((sheet) => sheet.scores.length === 3)).toBe(true)
  })

  it("Given a task with submitted sheets When deleted Then it is protected from destructive configuration changes", () => {
    const repository = createRepository()
    const protectedTask = repository.loadSnapshot().tasks.find(
      (task) => task.id === "task-growth-plan",
    )
    if (protectedTask === undefined) throw new RangeError("protected task missing")

    expect(() => repository.deleteEvaluationTask({
      taskId: protectedTask.id,
      actor: OPERATOR,
    })).toThrowError(expect.objectContaining({ code: "TASK_LOCKED" }))
  })
})
