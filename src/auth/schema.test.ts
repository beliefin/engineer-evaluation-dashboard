import { describe, expect, it } from "vitest"

import { passwordSchema, usernameSchema } from "./schema"

import { accountEmailForUsername } from "./account-email"

describe("passwordSchema", () => {
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
