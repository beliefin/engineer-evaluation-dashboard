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

const SHARED_OVERVIEW_PROFILES = [
  evaluatorProfile(false),
  profileSchema.parse({
    auth_user_id: "00000000-0000-4000-8000-000000000002",
    username: "engineer-user",
    display_name: "엔지니어 사용자",
    role: "engineer",
    roles: ["engineer"],
    evaluator_id: null,
    engineer_id: "engineer-01",
    can_view_insights: false,
    active: true,
  }),
  profileSchema.parse({
    auth_user_id: "00000000-0000-4000-8000-000000000003",
    username: "approver-user",
    display_name: "승인자 사용자",
    role: "approver",
    roles: ["approver"],
    evaluator_id: null,
    engineer_id: null,
    can_view_insights: false,
    active: true,
  }),
] as const

describe("projectRequestedSnapshot", () => {
  it.each(SHARED_OVERVIEW_PROFILES)(
    "returns the same guide-safe season data to $role accounts",
    (profile) => {
      const projected = projectRequestedSnapshot(SNAPSHOT, profile, "overview")

      expect(projected.cycles).toEqual(SNAPSHOT.cycles)
      expect(projected.tasks).toEqual(SNAPSHOT.tasks)
      expect(projected.engineers).toEqual([])
      expect(projected.evaluators).toEqual([])
      expect(projected.assignments).toEqual([])
      expect(projected.scoreSheets).toEqual([])
      expect(projected.directScores).toEqual([])
      expect(projected.auditEvents).toEqual([])
    },
  )

  it("returns complete read-only insight data to a granted evaluator", () => {
    const projected = projectRequestedSnapshot(SNAPSHOT, evaluatorProfile(true), "insights")

    expect(projected.engineers).toHaveLength(SNAPSHOT.engineers.length)
    expect(projected.directScores.length).toBeGreaterThan(0)
    expect(projected.evaluators).toEqual(SNAPSHOT.evaluators)
    expect(projected.assignments).toEqual(SNAPSHOT.assignments)
    expect(projected.scoreSheets).toEqual(SNAPSHOT.scoreSheets)
    expect(projected.unlockRequests).toEqual([])
    expect(projected.scheduleEvents).toEqual([])
    expect(projected.departmentCatalog).toEqual([])
    expect(projected.evaluationBenchmarks).toEqual([])
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
