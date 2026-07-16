import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "../../../src/data/seed"

import { storedSnapshotSchema } from "./model"

describe("storedSnapshotSchema score adjustment compatibility", () => {
  it("restores an empty adjustment list when a version 6 snapshot predates the field", () => {
    const storedSnapshot = structuredClone(createSeedSnapshot())
    Reflect.deleteProperty(storedSnapshot, "scoreAdjustments")

    const restored = storedSnapshotSchema.parse(storedSnapshot)

    expect(restored.scoreAdjustments).toEqual([])
  })
})
