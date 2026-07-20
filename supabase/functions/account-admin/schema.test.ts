import { describe, expect, it } from "vitest"

import { requestSchema, validateRoleLink } from "./schema"

describe("account admin dual-role schema", () => {
  it("accepts a four-character password for the relaxed local policy", () => {
    expect(requestSchema.safeParse({
      operation: "reset_password",
      accountId: "00000000-0000-4000-8000-000000000001",
      password: "1234",
    }).success).toBe(true)
  })
  it("accepts evaluator and engineer links on one account", () => {
    const request = requestSchema.parse({
      operation: "create",
      username: "dual",
      password: "31019467",
      displayName: "복합 역할 사용자",
      role: "evaluator",
      roles: ["evaluator", "engineer"],
      evaluatorId: "evaluator-dual",
      engineerId: "engineer-dual",
      active: true,
    })

    expect(() => validateRoleLink(request)).not.toThrow()
  })

  it("keeps requests from the previously deployed single-role client valid", () => {
    const request = requestSchema.parse({
      operation: "update",
      accountId: "00000000-0000-4000-8000-000000000001",
      displayName: "기존 평가자",
      role: "evaluator",
      evaluatorId: "evaluator-existing",
      engineerId: null,
      active: true,
    })

    expect(() => validateRoleLink(request)).not.toThrow()
    expect(request.canViewInsights).toBe(false)
  })

  it("accepts insight access only for accounts with the evaluator role", () => {
    const evaluator = requestSchema.parse({
      operation: "update",
      accountId: "00000000-0000-4000-8000-000000000001",
      displayName: "박경철",
      role: "evaluator",
      roles: ["evaluator"],
      evaluatorId: "evaluator-lead",
      engineerId: null,
      canViewInsights: true,
      active: true,
    })
    const engineer = requestSchema.parse({
      operation: "update",
      accountId: "00000000-0000-4000-8000-000000000002",
      displayName: "엔지니어 전용",
      role: "engineer",
      roles: ["engineer"],
      evaluatorId: null,
      engineerId: "engineer-only",
      canViewInsights: true,
      active: true,
    })

    expect(() => validateRoleLink(evaluator)).not.toThrow()
    expect(() => validateRoleLink(engineer)).toThrow("ROLE_LINK_INVALID")
  })
})
