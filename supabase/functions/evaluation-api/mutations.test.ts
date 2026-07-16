import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "../../../src/data/seed"

import type { Profile, Snapshot } from "./model"
import { mergeOperatorSnapshot, mutateScoreAdjustment } from "./mutations"

const OPERATOR: Profile = {
  auth_user_id: "11111111-1111-4111-8111-111111111111",
  username: "operator",
  display_name: "운영자",
  role: "operator",
  evaluator_id: null,
  engineer_id: null,
  active: true,
}

function snapshotWithAdjustment(): Snapshot {
  const snapshot = createSeedSnapshot()
  return {
    ...snapshot,
    scoreAdjustments: [{
      id: "adjustment-1",
      cycleId: "cycle-2026-h1",
      engineerId: "engineer-01",
      amount: 2.5,
      reason: "특별 기여",
      createdAt: "2026-07-16T00:00:00.000Z",
      updatedAt: "2026-07-16T00:00:00.000Z",
    }],
  }
}

describe("score adjustment server mutations", () => {
  it("preserves canonical adjustments during a generic operator commit", () => {
    const current = snapshotWithAdjustment()
    const requested = { ...current, scoreAdjustments: [] }

    expect(mergeOperatorSnapshot(current, requested).scoreAdjustments).toEqual(current.scoreAdjustments)
  })

  it("saves an adjustment and records its reason in the audit log", () => {
    const updated = mutateScoreAdjustment(createSeedSnapshot(), OPERATOR, {
      operation: "save_score_adjustment",
      baseRevision: 4,
      adjustment: {
        adjustmentId: null,
        cycleId: "cycle-2026-h1",
        engineerId: "engineer-01",
        amount: -1.5,
        reason: "제출 기한 지연",
      },
    })

    expect(updated.scoreAdjustments).toHaveLength(1)
    expect(updated.scoreAdjustments[0]).toMatchObject({ amount: -1.5, reason: "제출 기한 지연" })
    expect(updated.auditEvents.at(-1)).toMatchObject({
      type: "score_adjustment_saved",
      reason: "제출 기한 지연",
    })
  })

  it("deletes an adjustment and keeps the original reason in the audit log", () => {
    const updated = mutateScoreAdjustment(snapshotWithAdjustment(), OPERATOR, {
      operation: "delete_score_adjustment",
      baseRevision: 5,
      adjustmentId: "adjustment-1",
    })

    expect(updated.scoreAdjustments).toEqual([])
    expect(updated.auditEvents.at(-1)).toMatchObject({
      type: "score_adjustment_deleted",
      reason: "특별 기여",
    })
  })
})
