import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import {
  selectAnalysisHighlights,
  selectTaskCompletionRates,
  selectTaskScoreDistributions,
  selectTeamTaskPerformance,
  summarizeScoreDistribution,
} from "./analysis-insights"

const CYCLE_ID = "cycle-2026-h1"
const ALL_FILTERS = { team: "all", category: "all", status: "all" } as const

describe("analysis insight derivations", () => {
  it("summarizes the score range and interpolated quartiles without hiding spread", () => {
    expect(summarizeScoreDistribution([10, 20, 30, 40])).toEqual({
      minimum: 10,
      firstQuartile: 17.5,
      median: 25,
      thirdQuartile: 32.5,
      maximum: 40,
    })
  })

  it("derives bounded task distributions and completion rates from the active cohort", () => {
    const snapshot = createSeedSnapshot()

    const distributions = selectTaskScoreDistributions(snapshot, CYCLE_ID, ALL_FILTERS)
    const completionRates = selectTaskCompletionRates(snapshot, CYCLE_ID, ALL_FILTERS)

    expect(distributions.length).toBeGreaterThan(0)
    expect(distributions.every((entry) => (
      entry.minimum <= entry.firstQuartile &&
      entry.firstQuartile <= entry.median &&
      entry.median <= entry.thirdQuartile &&
      entry.thirdQuartile <= entry.maximum &&
      entry.minimum >= 0 &&
      entry.maximum <= 100
    ))).toBe(true)
    expect(completionRates).toHaveLength(snapshot.tasks.filter((task) => task.cycleId === CYCLE_ID).length)
    expect(completionRates.every((entry) => (
      entry.completedCount <= entry.eligibleCount &&
      entry.completionRate >= 0 &&
      entry.completionRate <= 100
    ))).toBe(true)
  })

  it("compares each team task average with the season-wide task baseline", () => {
    const snapshot = createSeedSnapshot()

    const cells = selectTeamTaskPerformance(snapshot, CYCLE_ID, ALL_FILTERS)

    expect(new Set(cells.map((entry) => entry.teamLabel))).toEqual(
      new Set(["생산 1팀", "생산 2팀"]),
    )
    expect(cells.every((entry) => (
      entry.delta === Math.round((entry.score - entry.overallScore) * 10) / 10
    ))).toBe(true)
    expect(cells.every((entry) => entry.completedCount > 0)).toBe(true)
  })

  it("keeps the matrix baseline season-wide when progress status is filtered", () => {
    const snapshot = createSeedSnapshot()
    const allCells = selectTeamTaskPerformance(snapshot, CYCLE_ID, ALL_FILTERS)
    const completedCells = selectTeamTaskPerformance(snapshot, CYCLE_ID, {
      ...ALL_FILTERS,
      status: "complete",
    })
    const baselineByTask = new Map(
      allCells.map((entry) => [entry.taskId, entry.overallScore]),
    )

    expect(completedCells.length).toBeGreaterThan(0)
    expect(completedCells.every((entry) => (
      entry.overallScore === baselineByTask.get(entry.taskId)
    ))).toBe(true)
  })

  it("keeps every added insight synchronized with the selected task filter", () => {
    const snapshot = createSeedSnapshot()
    const filters = {
      team: "all",
      category: "task-growth-plan",
      status: "all",
    } as const

    const distributions = selectTaskScoreDistributions(snapshot, CYCLE_ID, filters)
    const completionRates = selectTaskCompletionRates(snapshot, CYCLE_ID, filters)
    const cells = selectTeamTaskPerformance(snapshot, CYCLE_ID, filters)

    expect(distributions.map((entry) => entry.taskId)).toEqual(["task-growth-plan"])
    expect(completionRates.map((entry) => entry.taskId)).toEqual(["task-growth-plan"])
    expect(new Set(cells.map((entry) => entry.taskId))).toEqual(new Set(["task-growth-plan"]))
  })

  it("identifies the widest score spread, weakest completion, and largest team gap", () => {
    const snapshot = createSeedSnapshot()
    const distributions = selectTaskScoreDistributions(snapshot, CYCLE_ID, ALL_FILTERS)
    const completionRates = selectTaskCompletionRates(snapshot, CYCLE_ID, ALL_FILTERS)
    const cells = selectTeamTaskPerformance(snapshot, CYCLE_ID, ALL_FILTERS)

    const highlights = selectAnalysisHighlights(distributions, completionRates, cells)

    expect(highlights.map((entry) => entry.kind)).toEqual([
      "score-spread",
      "completion-bottleneck",
      "team-gap",
    ])
    expect(highlights.every((entry) => entry.value.length > 0 && entry.detail.length > 0)).toBe(true)
  })
})
