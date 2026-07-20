import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import {
  calculateRelativeRanking,
  selectRelativeRankingCandidates,
  type RelativeRankingCandidate,
} from "./relative-ranking"

const CYCLE_ID = "cycle-2026-h1"

function candidates(scores: readonly number[]): readonly RelativeRankingCandidate[] {
  return scores.map((score, index) => ({
    engineerId: `engineer-${String(index + 1).padStart(2, "0")}`,
    engineerName: `엔지니어 ${index + 1}`,
    employeeCode: String(1000 + index),
    team: index % 2 === 0 ? "생산 1팀" : "생산 2팀",
    department: index % 2 === 0 ? "전자약품담당" : "ECH1담당",
    position: "프로",
    score,
    scoreStatus: "confirmed",
    completedTaskCount: 3,
    taskCount: 3,
  }))
}

describe("relative ranking", () => {
  it.each([
    { size: 40, c: 8, b: 20, sa: 12 },
    { size: 10, c: 2, b: 5, sa: 3 },
    { size: 7, c: 1, b: 4, sa: 2 },
  ])("allocates $size people into stable 20/50/30 bands", ({ size, c, b, sa }) => {
    const result = calculateRelativeRanking(candidates(
      Array.from({ length: size }, (_, index) => 50 + index),
    ))

    expect(result.gradeCounts).toEqual({ c, b, sa })
    expect(result.points).toHaveLength(size)
    expect(result.points[0]).toMatchObject({
      ascendingPosition: 1,
      standardRank: size,
      grade: "C",
    })
    expect(result.points.at(-1)).toMatchObject({
      ascendingPosition: size,
      standardRank: 1,
      grade: "SA",
    })
  })

  it("recalculates positions and promotes the next people when top scorers are excluded", () => {
    const allCandidates = candidates([60, 65, 70, 72, 74, 76, 78, 80, 90, 95])
    const full = calculateRelativeRanking(allCandidates)
    const reduced = calculateRelativeRanking(allCandidates.slice(0, 8))

    expect(full.points.find((point) => point.score === 78)?.grade).toBe("B")
    expect(reduced.points.find((point) => point.score === 78)).toMatchObject({
      grade: "SA",
      standardRank: 2,
    })
    expect(reduced.selectedCount).toBe(8)
  })

  it("flags equal scores that cross either nominal grade boundary", () => {
    const result = calculateRelativeRanking(candidates([
      60, 65, 65, 70, 72, 74, 80, 80, 80, 90,
    ]))

    expect(result.boundaryTies).toEqual([
      { boundary: "CB", score: 65, count: 2 },
      { boundary: "BSA", score: 80, count: 3 },
    ])
    expect(result.cbDensityCount).toBe(2)
    expect(result.bsaDensityCount).toBe(3)
    expect(result.points.filter((point) => point.isBoundaryTie)).toHaveLength(5)
  })

  it("keeps competition ranks for ties while nominal bands stay position based", () => {
    const result = calculateRelativeRanking(candidates([70, 80, 80, 90]))
    const tied = result.points.filter((point) => point.score === 80)

    expect(tied.map((point) => point.standardRank)).toEqual([2, 2])
    expect(tied.map((point) => point.topPercentile)).toEqual([50, 50])
    expect(tied.map((point) => point.ascendingPosition)).toEqual([2, 3])
  })

  it("returns an explicit analysis-unavailable state for a single person", () => {
    const result = calculateRelativeRanking(candidates([88]))

    expect(result.gradeCounts).toEqual({ c: 0, b: 0, sa: 0 })
    expect(result.points[0]?.grade).toBe("unavailable")
    expect(result.warning).toContain("상대평가를 계산할 수 없습니다")
    expect(result.bCutoff).toBeNull()
    expect(result.saCutoff).toBeNull()
  })

  it("includes unfinished people with a real partial score without inventing zero scores", () => {
    const snapshot = createSeedSnapshot()
    const result = selectRelativeRankingCandidates(snapshot, CYCLE_ID)
    const partial = result.filter((candidate) => candidate.scoreStatus === "partial")
    const noScore = result.filter((candidate) => candidate.scoreStatus === "none")

    expect(partial.length).toBeGreaterThan(0)
    expect(partial.every((candidate) => candidate.score !== null && candidate.score > 0)).toBe(true)
    expect(noScore.length).toBeGreaterThan(0)
    expect(noScore.every((candidate) => candidate.score === null)).toBe(true)
  })
})
