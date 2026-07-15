import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import {
  selectDashboardViewModel,
  selectEngineerResultSummaries,
} from "./index"

const CYCLE_ID = "cycle-2026-h1"

describe("engineer result selectors", () => {
  it("separates completed, in-progress, and unconfirmed engineers", () => {
    const summaries = selectEngineerResultSummaries(
      createSeedSnapshot(),
      CYCLE_ID,
    )

    expect(summaries).toHaveLength(24)
    expect(summaries.filter((entry) => entry.status === "complete")).toHaveLength(12)
    expect(summaries.filter((entry) => entry.status === "in_progress")).toHaveLength(8)
    expect(summaries.filter((entry) => entry.status === "unconfirmed")).toHaveLength(4)
  })

  it("keeps incomplete engineers out of weighted score ranking", () => {
    const dashboard = selectDashboardViewModel(createSeedSnapshot(), CYCLE_ID)

    expect(dashboard).not.toBeNull()
    expect(dashboard?.rankingRows).toHaveLength(12)
    expect(
      dashboard?.rankingRows.every(
        (row) => row.totalScore >= 0 && row.totalScore <= 100,
      ),
    ).toBe(true)
    expect(
      dashboard?.distribution.reduce((total, datum) => total + datum.count, 0),
    ).toBe(12)
    expect(dashboard?.distribution.map((datum) => datum.range)).toEqual([
      "0~59",
      "60~69",
      "70~79",
      "80~89",
      "90~100",
    ])
  })

  it("keeps every engineer out of final scoring when task weights do not total 100", () => {
    const snapshot = createSeedSnapshot()
    const invalidWeightSnapshot = {
      ...snapshot,
      engineerTaskWeights: [],
      tasks: snapshot.tasks.map((task) =>
        task.id === "task-growth-plan" ? { ...task, weight: 34 } : task,
      ),
    }

    const summaries = selectEngineerResultSummaries(
      invalidWeightSnapshot,
      CYCLE_ID,
    )
    const dashboard = selectDashboardViewModel(invalidWeightSnapshot, CYCLE_ID)

    expect(
      summaries.every(
        ({ result }) =>
          result.status === "incomplete" &&
          result.roundedFinalScore === null,
      ),
    ).toBe(true)
    expect(dashboard?.rankingRows).toEqual([])
    expect(
      dashboard?.distribution.reduce((total, datum) => total + datum.count, 0),
    ).toBe(0)
  })

  it("reports the sample completion metrics without merging missing states", () => {
    const dashboard = selectDashboardViewModel(createSeedSnapshot(), CYCLE_ID)

    expect(dashboard?.metrics.find((metric) => metric.id === "target")?.value).toBe(24)
    expect(
      dashboard?.metrics.find((metric) => metric.id === "completion-rate")?.value,
    ).toBe(50)
    expect(
      dashboard?.metrics.find((metric) => metric.id === "in-progress")?.value,
    ).toBe(8)
    expect(
      dashboard?.metrics.find((metric) => metric.id === "unconfirmed")?.value,
    ).toBe(4)
  })
})
