import { describe, expect, it } from "vitest"

import { formatDecimal, formatScore } from "./format"

describe("analysis number formatting", () => {
  it("separates the decimal value from the score unit for composed labels", () => {
    expect(formatDecimal(80.45)).toBe("80.5")
    expect(formatScore(80.45)).toBe("80.5점")
  })
})
