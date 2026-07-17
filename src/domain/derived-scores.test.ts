import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { calculateSeasonResults } from "./scoring"
import type { DerivedScoreRule, EvaluationTask } from "./types"

const CYCLE_ID = "cycle-2026-h1"
const SOURCE_TASK_ID = "task-growth-plan"

function derivedTask(): EvaluationTask {
  return {
    id: "task-coaching-average",
    cycleId: CYCLE_ID,
    name: "육성 인원 평균",
    description: "선택한 육성 인원의 확정 점수 평균",
    method: "derived_score",
    weight: 10,
    order: 7,
    items: [],
  }
}

function rule(sourceEngineerIds: readonly string[]): DerivedScoreRule {
  return {
    id: "derived-rule-1",
    cycleId: CYCLE_ID,
    taskId: "task-coaching-average",
    targetEngineerId: "engineer-24",
    sourceTaskId: SOURCE_TASK_ID,
    sourceEngineerIds,
    aggregation: "average",
  }
}

describe("calculateSeasonResults linked scores", () => {
  it("uses the average only after every selected source result is complete", () => {
    const seed = createSeedSnapshot()
    const sourceResults = calculateSeasonResults(seed, CYCLE_ID)
    const expected = ["engineer-01", "engineer-02"].map((engineerId) =>
      sourceResults
        .find((result) => result.engineerId === engineerId)
        ?.taskResults.find((result) => result.taskId === SOURCE_TASK_ID)?.score,
    )
    if (expected.some((score) => score === null || score === undefined)) {
      throw new RangeError("complete source fixture missing")
    }
    const snapshot = {
      ...seed,
      tasks: [...seed.tasks, derivedTask()],
      derivedScoreRules: [rule(["engineer-01", "engineer-02"])],
      engineerTaskWeights: [
        ...seed.engineerTaskWeights.map((entry) =>
          entry.engineerId === "engineer-24" && entry.taskId === "task-proposal"
            ? { ...entry, weight: 0 }
            : entry,
        ),
        {
          cycleId: CYCLE_ID,
          engineerId: "engineer-24",
          taskId: "task-coaching-average",
          weight: 10,
        },
      ],
    }

    const result = calculateSeasonResults(snapshot, CYCLE_ID)
      .find((entry) => entry.engineerId === "engineer-24")
      ?.taskResults.find((entry) => entry.taskId === "task-coaching-average")

    expect(result?.status).toBe("complete")
    expect(result?.score).toBeCloseTo(((expected[0] ?? 0) + (expected[1] ?? 0)) / 2)
  })

  it("keeps the linked task incomplete when one selected source has no confirmed result", () => {
    const seed = createSeedSnapshot()
    const snapshot = {
      ...seed,
      tasks: [...seed.tasks, derivedTask()],
      derivedScoreRules: [rule(["engineer-01", "engineer-23"])],
    }

    const result = calculateSeasonResults(snapshot, CYCLE_ID)
      .find((entry) => entry.engineerId === "engineer-24")
      ?.taskResults.find((entry) => entry.taskId === "task-coaching-average")

    expect(result?.status).toBe("incomplete")
    expect(result?.score).toBeNull()
  })
})
