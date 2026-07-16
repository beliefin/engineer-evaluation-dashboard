import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import {
  createTestIdFactory,
  FailingStorage,
  FIXED_NOW,
  MemoryStorage,
} from "./test-utils"
import { RepositoryError } from "./types"

const OPERATOR = { id: "operator-01", role: "operator" } as const
const APPROVER = { id: "approver-01", role: "approver" } as const
const CYCLE_ID = "cycle-2026-h1"

function createRepository(storage: MemoryStorage | FailingStorage) {
  return createLocalStorageEvaluationRepository({
    storage,
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

describe("LocalStorageEvaluationRepository operations", () => {
  it("stores a valid one-decimal operator score without changing sibling tasks", () => {
    const repository = createRepository(new MemoryStorage())
    const before = repository.loadSnapshot()
    const engineerId = before.engineers[0]?.id ?? "missing-engineer"
    const siblingBefore = before.directScores.find(
      (entry) => entry.engineerId === engineerId && entry.taskId === "task-language",
    )?.score

    const updated = repository.updateDirectScore({
      cycleId: CYCLE_ID,
      engineerId,
      taskId: "task-proposal",
      score: 82.5,
      passResult: null,
      actor: OPERATOR,
    })

    expect(updated.directScores.find(
      (entry) => entry.engineerId === engineerId && entry.taskId === "task-proposal",
    )?.score).toBe(82.5)
    expect(updated.directScores.find(
      (entry) => entry.engineerId === engineerId && entry.taskId === "task-language",
    )?.score).toBe(siblingBefore)
    expect(updated.auditEvents.at(-1)?.type).toBe("direct_score_updated")
  })

  it("stores and clears an operator P/F result", () => {
    const repository = createRepository(new MemoryStorage())
    const snapshot = repository.saveEvaluationTask({
      taskId: null,
      cycleId: CYCLE_ID,
      name: "필수 안전교육",
      description: "",
      method: "operator_pass_fail",
      weight: 1,
      items: [],
      actor: OPERATOR,
    })
    const task = snapshot.tasks.at(-1)
    const engineerId = snapshot.engineers[0]?.id
    if (task === undefined || engineerId === undefined) throw new RangeError("fixture missing")

    const passed = repository.updateDirectScore({
      cycleId: CYCLE_ID,
      engineerId,
      taskId: task.id,
      score: null,
      passResult: true,
      actor: OPERATOR,
    })
    expect(passed.directScores.find(
      (entry) => entry.engineerId === engineerId && entry.taskId === task.id,
    )?.passResult).toBe(true)
  })

  it("rejects direct scores with more than one decimal place", () => {
    const storage = new MemoryStorage()
    const repository = createRepository(storage)
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"

    const action = () => repository.updateDirectScore({
      cycleId: CYCLE_ID,
      engineerId,
      taskId: "task-language",
      score: 82.55,
      passResult: null,
      actor: OPERATOR,
    })

    expect(action).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }))
    expect(storage.storedValue()).toBeNull()
  })

  it("keeps task configuration operator-only", () => {
    const repository = createRepository(new MemoryStorage())
    const action = () => repository.saveEvaluationTask({
      taskId: null,
      cycleId: CYCLE_ID,
      name: "승인자 생성 불가",
      description: "",
      method: "operator_score",
      weight: 1,
      items: [],
      actor: APPROVER,
    })

    expect(action).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
  })

  it("resets every change to a clean canonical seed", () => {
    const repository = createRepository(new MemoryStorage())
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"
    repository.updateDirectScore({
      cycleId: CYCLE_ID,
      engineerId,
      taskId: "task-proposal",
      score: 55,
      passResult: null,
      actor: OPERATOR,
    })

    const reset = repository.resetDemoData()

    expect(reset).toEqual(createSeedSnapshot())
    expect(repository.resetDemoData()).toEqual(reset)
  })

  it("converts browser write failures into a typed repository error", () => {
    const seed = createSeedSnapshot()
    const repository = createRepository(new FailingStorage(JSON.stringify(seed)))
    const engineerId = seed.engineers[0]?.id ?? "missing-engineer"

    const action = () => repository.updateDirectScore({
      cycleId: CYCLE_ID,
      engineerId,
      taskId: "task-proposal",
      score: 55,
      passResult: null,
      actor: OPERATOR,
    })

    expect(action).toThrowError(RepositoryError)
    expect(action).toThrowError(expect.objectContaining({ code: "STORAGE_WRITE_FAILED" }))
  })
})
