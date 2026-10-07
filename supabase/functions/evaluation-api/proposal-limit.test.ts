import { expect, it } from "vitest"
import { createSeedSnapshot } from "../../../src/data/seed"
import { snapshotSchema } from "./model"

it("accepts proposal 120 but rejects 121 and other tasks over 100", () => {
  const seed = createSeedSnapshot()
  const withScore = (taskId: string, score: number) => ({ ...seed, directScores: [{ id: "direct", cycleId: "cycle-2026-h1", engineerId: seed.engineers[0]!.id, taskId, score, passResult: null, updatedAt: "2026-10-07T00:00:00Z" }] })
  expect(snapshotSchema.safeParse(withScore("task-proposal", 120)).success).toBe(true)
  for (const score of [121, -1, Infinity, NaN]) expect(snapshotSchema.safeParse(withScore("task-proposal", score)).success).toBe(false)
  expect(snapshotSchema.safeParse(withScore("task-language", 101)).success).toBe(false)
})
