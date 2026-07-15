import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { selectAnalysisViewModel } from "./analysis"
import { selectOperationsViewModel } from "./operations"

const CYCLE_ID = "cycle-2026-h1"

describe("analysis and operations view models", () => {
  it("returns bounded dynamic task analysis with direct table alternatives", () => {
    const snapshot = createSeedSnapshot()

    const model = selectAnalysisViewModel(snapshot, CYCLE_ID)

    expect(model).not.toBeNull()
    expect(model?.categoryAverages.length).toBeGreaterThan(0)
    expect(model?.categoryAverages.every((entry) => entry.score >= 0 && entry.score <= 100)).toBe(true)
    expect(model?.categoryOptions.map((entry) => entry.label)).toContain("성장탐구계획서")
    expect(model?.rubricItemAverages.length).toBeGreaterThan(0)
    expect(model?.evaluatorDeviations.length).toBeGreaterThan(0)
    expect(model?.scoreDistributions.length).toBeGreaterThan(0)
    expect(model?.taskCompletionRates.length).toBeGreaterThan(0)
    expect(model?.teamTaskPerformance.length).toBeGreaterThan(0)
    expect(model?.highlights.map((entry) => entry.kind)).toEqual([
      "score-spread",
      "completion-bottleneck",
      "team-gap",
    ])
  })

  it("removes rubric and evaluator analysis for an operator-score task filter", () => {
    const snapshot = createSeedSnapshot()

    const model = selectAnalysisViewModel(snapshot, CYCLE_ID, {
      team: "all",
      category: "task-language",
      status: "all",
    })

    expect(model?.categoryAverages.map((entry) => entry.key)).toEqual(["task-language"])
    expect(model?.rubricItemAverages).toEqual([])
    expect(model?.evaluatorDeviations).toEqual([])
    expect(model?.scoreDistributions.map((entry) => entry.taskId)).toEqual(["task-language"])
    expect(model?.taskCompletionRates.map((entry) => entry.taskId)).toEqual(["task-language"])
  })

  it("projects season tasks, task weights, evaluator options and direct results", () => {
    const snapshot = createSeedSnapshot()

    const model = selectOperationsViewModel(snapshot, CYCLE_ID)

    expect(model?.tasks).toHaveLength(6)
    expect(model?.weightTotal).toBe(135)
    expect(model?.evaluatorOptions).toHaveLength(snapshot.evaluators.length)
    expect(model?.directScores[0]?.directTasks).toHaveLength(3)
    expect(model?.tasks.find((task) => task.taskId === "task-growth-plan")?.locked).toBe(true)
  })

  it("keeps evaluator weights scoped to each task configuration", () => {
    const snapshot = createSeedSnapshot()
    const growth = snapshot.tasks.find((task) => task.id === "task-growth-plan")
    const dx = snapshot.tasks.find((task) => task.id === "task-dx-tool")

    expect(growth?.evaluatorWeights).toHaveLength(5)
    expect(dx?.evaluatorWeights).toHaveLength(5)
    expect(growth?.evaluatorWeights.reduce((total, entry) => total + entry.weight, 0)).toBe(100)
  })
})
