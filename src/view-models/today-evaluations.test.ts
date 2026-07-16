import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { selectScheduledEvaluations } from "./today-evaluations"

describe("selectScheduledEvaluations", () => {
  it("returns only the selected date and evaluator assignment", () => {
    const snapshot = createSeedSnapshot()
    const owned = snapshot.assignments.find((entry) => entry.evaluatorId === "evaluator-01")
    const ownedKeys = new Set(snapshot.assignments
      .filter((entry) => entry.evaluatorId === "evaluator-01")
      .map((entry) => `${entry.engineerId}:${entry.taskId}`))
    const other = snapshot.assignments.find((entry) =>
      entry.evaluatorId !== "evaluator-01" && !ownedKeys.has(`${entry.engineerId}:${entry.taskId}`))
    if (owned === undefined || other === undefined) throw new RangeError("assignment fixture missing")
    const withSchedules = {
      ...snapshot,
      scheduleEvents: [
        {
          id: "today-owned",
          cycleId: owned.cycleId,
          engineerId: owned.engineerId,
          taskId: owned.taskId,
          title: "오늘 평가",
          date: "2026-07-16",
          startTime: "09:00",
          note: null,
          createdAt: "2026-07-15T00:00:00.000Z",
          updatedAt: "2026-07-15T00:00:00.000Z",
        },
        {
          id: "other-evaluator",
          cycleId: other.cycleId,
          engineerId: other.engineerId,
          taskId: other.taskId,
          title: "다른 평가",
          date: "2026-07-16",
          startTime: "10:00",
          note: null,
          createdAt: "2026-07-15T00:00:00.000Z",
          updatedAt: "2026-07-15T00:00:00.000Z",
        },
      ],
    }

    const selected = selectScheduledEvaluations(
      withSchedules,
      owned.cycleId,
      "evaluator-01",
      "2026-07-16",
    )

    expect(selected).toEqual([
      expect.objectContaining({
        assignmentId: owned.id,
        engineerId: owned.engineerId,
        taskId: owned.taskId,
        date: "2026-07-16",
      }),
    ])
  })
})
