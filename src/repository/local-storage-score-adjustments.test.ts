import { describe, expect, it } from "vitest"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"

const OPERATOR = { id: "operator-01", role: "operator" } as const
const APPROVER = { id: "approver-01", role: "approver" } as const
const CYCLE_ID = "cycle-2026-h1"

function createRepository() {
  return createLocalStorageEvaluationRepository({
    storage: new MemoryStorage(),
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

describe("LocalStorageEvaluationRepository score adjustments", () => {
  it("stores a signed adjustment with a mandatory reason and audit event", () => {
    const repository = createRepository()
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"

    const updated = repository.saveScoreAdjustment({
      adjustmentId: null,
      cycleId: CYCLE_ID,
      engineerId,
      amount: -3.5,
      reason: "발표 시간 기준 미준수",
      actor: OPERATOR,
    })

    expect(updated.scoreAdjustments).toEqual([
      expect.objectContaining({ engineerId, amount: -3.5, reason: "발표 시간 기준 미준수" }),
    ])
    expect(updated.auditEvents.at(-1)).toEqual(expect.objectContaining({
      type: "score_adjustment_saved",
      reason: "발표 시간 기준 미준수",
    }))
  })

  it("deletes an existing adjustment and records the original reason", () => {
    const repository = createRepository()
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"
    const saved = repository.saveScoreAdjustment({
      adjustmentId: null,
      cycleId: CYCLE_ID,
      engineerId,
      amount: 2,
      reason: "추가 기여 인정",
      actor: OPERATOR,
    })
    const adjustmentId = saved.scoreAdjustments[0]?.id ?? "missing-adjustment"

    const deleted = repository.deleteScoreAdjustment({ adjustmentId, actor: OPERATOR })

    expect(deleted.scoreAdjustments).toEqual([])
    expect(deleted.auditEvents.at(-1)).toEqual(expect.objectContaining({
      type: "score_adjustment_deleted",
      targetId: adjustmentId,
      reason: "추가 기여 인정",
    }))
  })

  it("rejects zero amounts, blank reasons, and non-operator actors", () => {
    const repository = createRepository()
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"
    const base = {
      adjustmentId: null,
      cycleId: CYCLE_ID,
      engineerId,
      amount: 1,
      reason: "가점 사유",
      actor: OPERATOR,
    } as const

    expect(() => repository.saveScoreAdjustment({ ...base, amount: 0 })).toThrowError(
      expect.objectContaining({ code: "INVALID_INPUT" }),
    )
    expect(() => repository.saveScoreAdjustment({ ...base, reason: " " })).toThrowError(
      expect.objectContaining({ code: "INVALID_INPUT" }),
    )
    expect(() => repository.saveScoreAdjustment({ ...base, actor: APPROVER })).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    )
  })
})
