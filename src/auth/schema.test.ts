import { describe, expect, it } from "vitest"

import {
  authAccountRecordSchema,
  createAccountInputSchema,
  passwordSchema,
  usernameSchema,
} from "./schema"

import { accountEmailForUsername } from "./account-email"

describe("passwordSchema", () => {
  it("accepts a four-character numeric password", () => {
    expect(passwordSchema.safeParse("1234").success).toBe(true)
  })
  it("Given letters and numbers When no special character is present Then the password is accepted", () => {
    expect(passwordSchema.safeParse("Engineer2026").success).toBe(true)
  })

  it("Given an eight-digit employee code When used as a password Then it is accepted", () => {
    expect(passwordSchema.safeParse("31014241").success).toBe(true)
  })
})

describe("usernameSchema", () => {
  it("Given a Korean display name When used as a username Then it is accepted", () => {
    expect(usernameSchema.safeParse("박경철").success).toBe(true)
  })
})

describe("accountEmailForUsername", () => {
  it("Given a Korean username When mapped for Supabase Auth Then it uses an ASCII local part", () => {
    expect(accountEmailForUsername("박경철", "example.supabase.co"))
      .toBe("u-eb-b0-95-ea-b2-bd-ec-b2-a0@example.supabase.co")
  })

  it("Given the existing operator username When mapped Then its legacy email remains unchanged", () => {
    expect(accountEmailForUsername("operator", "example.supabase.co"))
      .toBe("operator@example.supabase.co")
  })
})

describe("createAccountInputSchema", () => {
  it("accepts one account linked to both an evaluator and an engineer", () => {
    const parsed = createAccountInputSchema.parse({
      username: "dual-role",
      password: "31019467",
      displayName: "김영래",
      role: "evaluator",
      roles: ["evaluator", "engineer"],
      evaluatorId: "evaluator-kim",
      engineerId: "engineer-kim",
      active: true,
    })

    expect(parsed.roles).toEqual(["evaluator", "engineer"])
    expect(parsed.evaluatorId).toBe("evaluator-kim")
    expect(parsed.engineerId).toBe("engineer-kim")
  })

  it("allows an evaluator account to receive dashboard and analysis access", () => {
    const parsed = createAccountInputSchema.parse({
      username: "lead-evaluator",
      password: "4241",
      displayName: "박경철",
      role: "evaluator",
      roles: ["evaluator"],
      evaluatorId: "evaluator-lead",
      engineerId: null,
      canViewInsights: true,
      active: true,
    })

    expect(parsed.canViewInsights).toBe(true)
  })

  it("rejects insight access for an account without the evaluator role", () => {
    const result = createAccountInputSchema.safeParse({
      username: "engineer-only",
      password: "4242",
      displayName: "엔지니어 전용",
      role: "engineer",
      roles: ["engineer"],
      evaluatorId: null,
      engineerId: "engineer-only",
      canViewInsights: true,
      active: true,
    })

    expect(result.success).toBe(false)
  })
})

describe("authAccountRecordSchema", () => {
  it("restores legacy accounts with insight access disabled", () => {
    const parsed = authAccountRecordSchema.parse({
      id: "legacy-account",
      username: "legacy",
      displayName: "기존 평가자",
      role: "evaluator",
      roles: ["evaluator"],
      evaluatorId: "evaluator-legacy",
      engineerId: null,
      active: true,
      mustChangePassword: false,
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z",
      passwordSalt: "salt",
      passwordHash: "hash",
    })

    expect(parsed.canViewInsights).toBe(false)
  })
})
