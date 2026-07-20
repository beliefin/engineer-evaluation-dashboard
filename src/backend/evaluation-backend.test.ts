import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"
import { evaluationSnapshotSchema } from "@/domain"

import { createRemoteRequest } from "./evaluation-backend"

describe("createRemoteRequest", () => {
  it("accepts precise evaluator aggregates returned to engineer accounts", () => {
    const snapshot = createSeedSnapshot()
    const directScore = snapshot.directScores[0]
    expect(directScore).toBeDefined()

    const projected = {
      ...snapshot,
      directScores: snapshot.directScores.map((entry) =>
        entry.id === directScore?.id
          ? { ...entry, score: 85.72222222222223 }
          : entry),
    }

    expect(evaluationSnapshotSchema.safeParse(projected).success).toBe(true)
  })

  it("Given an evaluator draft command When serialized Then only the owned sheet payload is sent", () => {
    const snapshot = createSeedSnapshot()
    const sheet = snapshot.scoreSheets[0]
    expect(sheet).toBeDefined()

    const request = createRemoteRequest(
      { type: "sheet", operation: "save_draft", sheetId: sheet?.id ?? "" },
      snapshot,
      3,
      "evaluator",
    )

    expect(request).toEqual({
      operation: "save_draft",
      activeRole: "evaluator",
      baseRevision: 3,
      sheetId: sheet?.id,
      scores: sheet?.scores,
      passResult: sheet?.passResult,
    })
    expect(request).not.toHaveProperty("snapshot")
  })

  it("Given an operator draft command When serialized Then the same sheet-scoped payload is sent", () => {
    const snapshot = createSeedSnapshot()
    const sheet = snapshot.scoreSheets[0]
    expect(sheet).toBeDefined()

    const request = createRemoteRequest(
      { type: "sheet", operation: "save_draft", sheetId: sheet?.id ?? "" },
      snapshot,
      7,
      "operator",
    )

    expect(request).toEqual({
      operation: "save_draft",
      activeRole: "operator",
      baseRevision: 7,
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
      "operator",
    )

    expect(request).toMatchObject({
      operation: "operator_commit",
      activeRole: "operator",
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
      "operator",
    )

    expect(request).toEqual({
      operation: "save_score_adjustment",
      activeRole: "operator",
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

  it("serializes a multi-engineer schedule as a scoped backend command", () => {
    const request = createRemoteRequest(
      {
        type: "schedule_create",
        cycleId: "cycle-2026-h1",
        engineerIds: ["engineer-01", "engineer-02"],
        fields: {
          taskId: "task-growth-plan",
          title: "성장탐구 발표",
          date: "2026-07-16",
          startTime: "09:00",
          note: null,
        },
      },
      createSeedSnapshot(),
      13,
      "operator",
    )

    expect(request).toEqual({
      operation: "create_schedule_events",
      activeRole: "operator",
      baseRevision: 13,
      cycleId: "cycle-2026-h1",
      engineerIds: ["engineer-01", "engineer-02"],
      taskId: "task-growth-plan",
      title: "성장탐구 발표",
      date: "2026-07-16",
      startTime: "09:00",
      note: null,
    })
    expect(request).not.toHaveProperty("snapshot")
  })
})
