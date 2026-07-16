import { describe, expect, it } from "vitest"

import { toLocalDateValue } from "./today-evaluations-screen"

describe("toLocalDateValue", () => {
  it("uses the browser-local calendar day for the default evaluation date", () => {
    const localMidnight = new Date(2026, 6, 16, 0, 5, 0)

    expect(toLocalDateValue(localMidnight)).toBe("2026-07-16")
  })
})
