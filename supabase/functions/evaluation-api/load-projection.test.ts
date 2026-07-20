import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "../../../src/data/seed"

import { profileSchema, snapshotSchema } from "./model"
import { projectRequestedSnapshot } from "./load-projection"

const SNAPSHOT = snapshotSchema.parse(createSeedSnapshot())

function evaluatorProfile(canViewInsights: boolean) {
  return profileSchema.parse({
    auth_user_id: "00000000-0000-4000-8000-000000000001",
    username: "lead-evaluator",
    display_name: "박경철",
    role: "evaluator",
    roles: ["evaluator"],
    evaluator_id: "evaluator-01",
    engineer_id: null,
    can_view_insights: canViewInsights,
    active: true,
  })
}

describe("projectRequestedSnapshot", () => {
  it("returns aggregate-only insight data to a granted evaluator", () => {
    const projected = projectRequestedSnapshot(SNAPSHOT, evaluatorProfile(true), "insights")

    expect(projected.engineers).toHaveLength(SNAPSHOT.engineers.length)
    expect(projected.directScores.length).toBeGreaterThan(0)
    expect(projected.evaluators).toEqual([])
    expect(projected.assignments).toEqual([])
    expect(projected.scoreSheets).toEqual([])
    expect(projected.auditEvents).toEqual([])
  })

  it("rejects an evaluator without insight access", () => {
    expect(() => projectRequestedSnapshot(SNAPSHOT, evaluatorProfile(false), "insights"))
      .toThrow("현황·분석 열람 권한이 필요합니다.")
  })

  it("keeps the evaluator's normal evaluation projection separate", () => {
    const projected = projectRequestedSnapshot(SNAPSHOT, evaluatorProfile(true), "default")

    expect(projected.evaluators.map((entry) => entry.id)).toEqual(["evaluator-01"])
    expect(projected.assignments.every((entry) => entry.evaluatorId === "evaluator-01")).toBe(true)
  })
})
