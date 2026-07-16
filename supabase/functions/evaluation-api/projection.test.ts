import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "../../../src/data/seed"

import { snapshotSchema } from "./model"
import { projectSnapshot } from "./projection"

const PROFILE_BASE = {
  auth_user_id: "00000000-0000-4000-8000-000000000001",
  username: "tester",
  display_name: "테스트 사용자",
  active: true,
} as const

function snapshotWithAdjustments() {
  return snapshotSchema.parse({
    ...createSeedSnapshot(),
    scoreAdjustments: [
      {
        id: "adjustment-1",
        cycleId: "cycle-2026-h1",
        engineerId: "engineer-01",
        amount: 2,
        reason: "엔지니어 1 가점",
        createdAt: "2026-07-16T00:00:00.000Z",
        updatedAt: "2026-07-16T00:00:00.000Z",
      },
      {
        id: "adjustment-2",
        cycleId: "cycle-2026-h1",
        engineerId: "engineer-02",
        amount: -1,
        reason: "엔지니어 2 감점",
        createdAt: "2026-07-16T00:00:00.000Z",
        updatedAt: "2026-07-16T00:00:00.000Z",
      },
    ],
  })
}

describe("projectSnapshot score adjustment boundary", () => {
  it("shows an engineer only their own adjustments", () => {
    const projected = projectSnapshot(snapshotWithAdjustments(), {
      ...PROFILE_BASE,
      role: "engineer",
      engineer_id: "engineer-01",
      evaluator_id: null,
    })

    expect(projected.scoreAdjustments.map((entry) => entry.id)).toEqual(["adjustment-1"])
  })

  it("hides all score adjustments from evaluators", () => {
    const projected = projectSnapshot(snapshotWithAdjustments(), {
      ...PROFILE_BASE,
      role: "evaluator",
      engineer_id: null,
      evaluator_id: "evaluator-01",
    })

    expect(projected.scoreAdjustments).toEqual([])
  })

  it("shows an evaluator only schedule events linked to their assignments", () => {
    const snapshot = createSeedSnapshot()
    const owned = snapshot.assignments.find((entry) => entry.evaluatorId === "evaluator-01")
    const ownedKeys = new Set(snapshot.assignments
      .filter((entry) => entry.evaluatorId === "evaluator-01")
      .map((entry) => `${entry.engineerId}:${entry.taskId}`))
    const other = snapshot.assignments.find((entry) =>
      entry.evaluatorId !== "evaluator-01" && !ownedKeys.has(`${entry.engineerId}:${entry.taskId}`))
    if (owned === undefined || other === undefined) throw new RangeError("assignment fixture missing")
    const projected = projectSnapshot(snapshotSchema.parse({
      ...snapshot,
      scheduleEvents: [
        {
          id: "schedule-owned",
          cycleId: owned.cycleId,
          engineerId: owned.engineerId,
          taskId: owned.taskId,
          title: "평가 일정",
          date: "2026-07-16",
          startTime: "09:00",
          note: null,
          createdAt: "2026-07-15T00:00:00.000Z",
          updatedAt: "2026-07-15T00:00:00.000Z",
        },
        {
          id: "schedule-other",
          cycleId: other.cycleId,
          engineerId: other.engineerId,
          taskId: other.taskId,
          title: "다른 평가자 일정",
          date: "2026-07-16",
          startTime: "10:00",
          note: null,
          createdAt: "2026-07-15T00:00:00.000Z",
          updatedAt: "2026-07-15T00:00:00.000Z",
        },
      ],
    }), {
      ...PROFILE_BASE,
      role: "evaluator",
      engineer_id: null,
      evaluator_id: "evaluator-01",
    })

    expect(projected.scheduleEvents.map((event) => event.id)).toEqual(["schedule-owned"])
  })
})
