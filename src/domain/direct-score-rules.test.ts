import { describe, expect, it } from "vitest"

import { convertDirectScoreRecord, highestConvertedDirectScore } from "./direct-score-rules"
import type { DirectScoreRule, LanguageScoreRecord } from "./types"

const record: LanguageScoreRecord = {
  id: "language-1",
  cycleId: "cycle-1",
  engineerId: "engineer-1",
  examName: "TOEIC",
  result: "850",
  acquiredOn: null,
  note: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const rule = (input: Partial<DirectScoreRule>): DirectScoreRule => ({
  id: "rule-1",
  cycleId: "cycle-1",
  taskId: "task-language",
  kind: "language",
  label: "TOEIC 800",
  field: "result",
  operator: "gte",
  value: "800",
  ruleType: "base",
  score: 80,
  bonus: 0,
  enabled: true,
  order: 1,
  ...input,
})

describe("direct score rules", () => {
  it("converts a numeric threshold and adds matching bonuses", () => {
    expect(convertDirectScoreRecord(record, [
      rule({}),
      rule({ id: "rule-2", label: "TOEIC bonus", ruleType: "bonus", operator: "equals", field: "examName", value: "TOEIC", bonus: 5 }),
    ])).toBe(85)
  })

  it("returns the highest converted record and ignores disabled rules", () => {
    expect(highestConvertedDirectScore([record], [rule({ enabled: false })])).toBeNull()
  })
})
