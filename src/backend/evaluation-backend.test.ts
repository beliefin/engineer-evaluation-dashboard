import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { createRemoteRequest } from "./evaluation-backend"

describe("createRemoteRequest", () => {
  it("Given an evaluator draft command When serialized Then only the owned sheet payload is sent", () => {
    const snapshot = createSeedSnapshot()
    const sheet = snapshot.scoreSheets[0]
    expect(sheet).toBeDefined()

    const request = createRemoteRequest(
      { type: "sheet", operation: "save_draft", sheetId: sheet?.id ?? "" },
      snapshot,
      3,
    )

    expect(request).toEqual({
      operation: "save_draft",
      baseRevision: 3,
      sheetId: sheet?.id,
      scores: sheet?.scores,
      passResult: sheet?.passResult,
    })
    expect(request).not.toHaveProperty("snapshot")
  })

  it("Given an operator mutation When serialized Then the validated snapshot is committed with revision", () => {
    const snapshot = createSeedSnapshot()
    const request = createRemoteRequest(
      { type: "operator", action: "task_saved", targetId: "task-1" },
      snapshot,
      8,
    )

    expect(request).toMatchObject({
      operation: "operator_commit",
      baseRevision: 8,
      action: "task_saved",
      targetId: "task-1",
      snapshot,
    })
  })

  it("Given a score adjustment command When serialized Then no whole snapshot is sent", () => {
    const request = createRemoteRequest(
      {
        type: "score_adjustment_save",
        adjustment: {
          adjustmentId: null,
          cycleId: "cycle-2026-h1",
          engineerId: "engineer-01",
          amount: 2.5,
          reason: "특별 기여",
        },
      },
      createSeedSnapshot(),
      12,
    )

    expect(request).toEqual({
      operation: "save_score_adjustment",
      baseRevision: 12,
      adjustment: {
        adjustmentId: null,
        cycleId: "cycle-2026-h1",
        engineerId: "engineer-01",
        amount: 2.5,
        reason: "특별 기여",
      },
    })
    expect(request).not.toHaveProperty("snapshot")
  })
})
