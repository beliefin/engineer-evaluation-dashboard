import { describe, expect, it } from "vitest"

import { evaluationRequestSchema } from "./request-schema"

describe("evaluation request schema", () => {
  it("parses ordinary load requests independently of schedule validation", () => {
    expect(evaluationRequestSchema.parse({
      operation: "load",
      activeRole: "engineer",
      view: "default",
    })).toEqual({
      operation: "load",
      activeRole: "engineer",
      view: "default",
    })
  })

  it("defaults single-person schedule requests to non-parallel", () => {
    expect(evaluationRequestSchema.parse({
      operation: "create_schedule_events",
      activeRole: "operator",
      baseRevision: 1,
      cycleId: "cycle-1",
      engineerIds: ["engineer-1"],
      taskId: "task-1",
      title: "발표",
      date: "2026-07-23",
      startTime: null,
      note: null,
    })).toMatchObject({ parallel: false })
  })
})
