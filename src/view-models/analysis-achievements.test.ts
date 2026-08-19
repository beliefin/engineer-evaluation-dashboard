import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { selectAchievementSourceAnalysis } from "./analysis-achievements"

const CYCLE_ID = "cycle-2026-h1"
const ALL_FILTERS = { team: "all", category: "all", status: "all" } as const

describe("achievement source analysis", () => {
  it("counts distinct holders, current-year acquisitions, explicit none, and actual language results", () => {
    const seed = createSeedSnapshot()
    const first = seed.engineers[0]
    const second = seed.engineers[1]
    const third = seed.engineers[2]
    if (first === undefined || second === undefined || third === undefined) {
      throw new RangeError("seed requires at least three engineers")
    }
    const snapshot = {
      ...seed,
      certificationRecords: [
        { id: "cert-1", cycleId: CYCLE_ID, engineerId: first.id, certificateName: "산업안전기사", grade: "기사", acquiredOn: "2026-03-01", issuer: null, updatedAt: "2026-03-01T00:00:00.000Z" },
        { id: "cert-2", cycleId: CYCLE_ID, engineerId: second.id, certificateName: "산업안전기사", grade: "기사", acquiredOn: "2024-06-01", issuer: null, updatedAt: "2026-03-01T00:00:00.000Z" },
        { id: "cert-3", cycleId: CYCLE_ID, engineerId: second.id, certificateName: "가스기사", grade: "기사", acquiredOn: "2026-05-01", issuer: null, updatedAt: "2026-05-01T00:00:00.000Z" },
        { id: "cert-none", cycleId: CYCLE_ID, engineerId: third.id, certificateName: "보유 자격증 없음", noScore: true, grade: null, acquiredOn: null, issuer: null, updatedAt: "2026-03-01T00:00:00.000Z" },
      ],
      languageScoreRecords: [
        { id: "language-1", cycleId: CYCLE_ID, engineerId: first.id, examName: "OPIc", languageGroup: "english" as const, result: "IH", acquiredOn: "2026-02-01", note: null, updatedAt: "2026-02-01T00:00:00.000Z" },
        { id: "language-2", cycleId: CYCLE_ID, engineerId: second.id, examName: "OPIc", languageGroup: "english" as const, result: "IH", acquiredOn: "2025-02-01", note: null, updatedAt: "2026-02-01T00:00:00.000Z" },
        { id: "language-3", cycleId: CYCLE_ID, engineerId: second.id, examName: "OPIc", languageName: "일본어", languageGroup: "second_language" as const, result: "IM2", newlyAcquired: true, acquiredOn: "2026-04-01", note: null, updatedAt: "2026-04-01T00:00:00.000Z" },
        { id: "language-none", cycleId: CYCLE_ID, engineerId: third.id, examName: "보유 어학성적 없음", languageGroup: "english" as const, result: "0", noScore: true, acquiredOn: null, note: null, updatedAt: "2026-03-01T00:00:00.000Z" },
      ],
    }

    const result = selectAchievementSourceAnalysis(snapshot, CYCLE_ID, ALL_FILTERS)

    expect(result.evaluationYear).toBe("2026")
    expect(result.certificationRecordedEngineerCount).toBe(2)
    expect(result.certificationNoScoreEngineerCount).toBe(1)
    expect(result.certificationUnreportedEngineerCount).toBe(21)
    expect(result.certificationAcquiredThisYearEngineerCount).toBe(2)
    expect(result.certificationHoldings).toEqual([
      { certificateName: "산업안전기사", holderCount: 2, acquiredThisYearCount: 1, shareOfRecordedEngineers: 100 },
      { certificateName: "가스기사", holderCount: 1, acquiredThisYearCount: 1, shareOfRecordedEngineers: 50 },
    ])
    expect(result.languageRecordedEngineerCount).toBe(2)
    expect(result.languageNoScoreEngineerCount).toBe(1)
    expect(result.languageUnreportedEngineerCount).toBe(21)
    expect(result.languageAcquiredThisYearEngineerCount).toBe(2)
    expect(result.languageResults).toEqual([
      { key: "english:영어:OPIc:IH", scopeLabel: "영어", examName: "OPIc", result: "IH", holderCount: 2, shareOfRecordedEngineers: 100 },
      { key: "second_language:일본어:OPIc:IM2", scopeLabel: "일본어", examName: "OPIc", result: "IM2", holderCount: 1, shareOfRecordedEngineers: 50 },
    ])

    const teamFiltered = selectAchievementSourceAnalysis(snapshot, CYCLE_ID, {
      team: first.team,
      category: "all",
      status: "all",
    })
    expect(teamFiltered.eligibleEngineerCount).toBe(12)
    expect(teamFiltered.certificationRecordedEngineerCount).toBe(1)
    expect(teamFiltered.certificationNoScoreEngineerCount).toBe(1)

    const taskFiltered = selectAchievementSourceAnalysis(snapshot, CYCLE_ID, {
      team: "all",
      category: snapshot.tasks[0]?.id ?? "all",
      status: "all",
    })
    expect(taskFiltered).toEqual(result)

    const inProgress = selectAchievementSourceAnalysis(snapshot, CYCLE_ID, {
      team: "all",
      category: "all",
      status: "in_progress",
    })
    expect(inProgress.eligibleEngineerCount).toBe(8)
    expect(inProgress.certificationHoldings).toEqual([])
    expect(inProgress.languageResults).toEqual([])
  })
})
