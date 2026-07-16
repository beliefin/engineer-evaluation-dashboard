import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "../../../src/data/seed"

import { activateProfileRole, profileSchema, storedSnapshotSchema } from "./model"

describe("storedSnapshotSchema score adjustment compatibility", () => {
  it("restores an empty adjustment list when a version 6 snapshot predates the field", () => {
    const storedSnapshot = structuredClone(createSeedSnapshot())
    Reflect.deleteProperty(storedSnapshot, "scoreAdjustments")

    const restored = storedSnapshotSchema.parse(storedSnapshot)

    expect(restored.scoreAdjustments).toEqual([])
  })

  it("accepts custom departments and restores their reusable catalog", () => {
    const storedSnapshot = structuredClone(createSeedSnapshot())
    storedSnapshot.engineers[0] = {
      ...storedSnapshot.engineers[0]!,
      department: "신공정지원담당",
    }
    storedSnapshot.departmentCatalog = [{ team: "생산 1팀", name: "신공정지원담당" }]

    const restored = storedSnapshotSchema.parse(storedSnapshot)

    expect(restored.engineers[0]?.department).toBe("신공정지원담당")
    expect(restored.departmentCatalog).toContainEqual({ team: "생산 1팀", name: "신공정지원담당" })
  })
})

describe("dual-role profile activation", () => {
  const profile = profileSchema.parse({
    auth_user_id: "00000000-0000-4000-8000-000000000001",
    username: "dual",
    display_name: "복합 역할 사용자",
    role: "evaluator",
    roles: ["evaluator", "engineer"],
    evaluator_id: "evaluator-dual",
    engineer_id: "engineer-dual",
    active: true,
  })

  it("activates either assigned role for the same authenticated profile", () => {
    expect(activateProfileRole(profile, "engineer")).toMatchObject({
      role: "engineer",
      roles: ["evaluator", "engineer"],
      engineer_id: "engineer-dual",
    })
  })

  it("rejects a role that is not assigned to the profile", () => {
    expect(() => activateProfileRole(profile, "operator")).toThrow("PROFILE_ROLE_FORBIDDEN")
  })
})
