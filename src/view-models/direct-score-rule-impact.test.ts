import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { selectDirectScoreRuleImpact } from "./direct-score-rule-impact"

const CYCLE_ID = "cycle-2026-h1"

describe("selectDirectScoreRuleImpact", () => {
  it("previews task and final-score changes against current season source records", () => {
    const seed = createSeedSnapshot()
    const taskId = "task-certification"
    const snapshot = {
      ...seed,
      directScoreRules: [{
        id: "rule-certification",
        cycleId: CYCLE_ID,
        taskId,
        kind: "certification" as const,
        label: "산업안전기사",
        field: "certificateName" as const,
        operator: "equals" as const,
        value: "산업안전기사",
        ruleType: "base" as const,
        score: 10,
        rawScore: null,
        bonus: 0,
        enabled: true,
        order: 1,
      }],
      certificationRecords: [{
        id: "certification-record-1",
        cycleId: CYCLE_ID,
        engineerId: "engineer-01",
        certificateName: "산업안전기사",
        grade: null,
        acquiredOn: "2025-06-01",
        issuer: null,
        updatedAt: "2026-07-17T00:00:00.000Z",
      }],
    }

    const impact = selectDirectScoreRuleImpact(snapshot, CYCLE_ID, {
      ruleId: "rule-certification",
      taskId,
      kind: "certification",
      label: "산업안전기사",
      field: "certificateName",
      operator: "equals",
      value: "산업안전기사",
      ruleType: "base",
      score: 20,
      bonus: 0,
      enabled: true,
    })

    expect(impact.affectedCount).toBe(1)
    expect(impact.rows[0]).toMatchObject({
      engineerId: "engineer-01",
      currentTaskScore: 10,
      proposedTaskScore: 20,
    })
  })
})
