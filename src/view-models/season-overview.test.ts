import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"
import type { EvaluationTask } from "@/domain"

import { selectSeasonOverview } from "./season-overview"

describe("selectSeasonOverview", () => {
  it("builds the current season cover and counts OTS or DX once in the personal 100 percent route", () => {
    const snapshot = createSeedSnapshot()

    const model = selectSeasonOverview(snapshot, "cycle-2026-h1")

    expect(model?.cycle.name).toBe("2026 상반기")
    expect(model?.configuredWeightTotal).toBe(135)
    expect(model?.effectiveWeightTotal).toBe(100)
    expect(model?.composition.map((entry) => entry.label)).toEqual([
      "성장탐구계획서",
      "선택형 심화 과제",
      "어학",
      "자격증",
      "고등급제안",
    ])
    expect(model?.composition[1]).toMatchObject({
      kind: "alternative",
      weight: 35,
      options: ["OTS 시나리오 제작", "DX 툴 활용"],
    })
  })

  it("derives task guidance from known task context and configured rubric labels", () => {
    const snapshot = createSeedSnapshot()

    const model = selectSeasonOverview(snapshot, "cycle-2026-h1")
    const growth = model?.tasks.find((task) => task.name === "성장탐구계획서")
    const ots = model?.tasks.find((task) => task.name === "OTS 시나리오 제작")

    expect(growth?.process.map((step) => step.title)).toEqual([
      "목표 수립",
      "활동 수행",
      "발표·평가",
    ])
    expect(growth?.focusItems).toContain("주제의 전략적 적합성과 집중도")
    expect(ots?.output).toContain("시나리오 표준 기획서")
    expect(ots?.methodLabel).toBe("평가자 점수형")
  })

  it("keeps newly configured tasks understandable without season-specific copy", () => {
    const snapshot = createSeedSnapshot()
    const customTask: EvaluationTask = {
      id: "task-custom",
      cycleId: "cycle-2026-h1",
      name: "현장 개선 실천",
      description: "현장 개선 아이디어를 실행하고 결과를 확인합니다.",
      method: "operator_pass_fail",
      weight: 5,
      order: 99,
      items: [{
        id: "custom-item-1",
        label: "현장 적용 가능성",
        order: 1,
        section: null,
        criteria: [],
      }],
    }

    const model = selectSeasonOverview({
      ...snapshot,
      tasks: [...snapshot.tasks, customTask],
    }, "cycle-2026-h1")
    const task = model?.tasks.find((entry) => entry.id === customTask.id)

    expect(task).toMatchObject({
      purpose: customTask.description,
      methodLabel: "운영자 P/F형",
      focusItems: ["현장 적용 가능성"],
    })
    expect(task?.process).toHaveLength(3)
  })

  it("returns null when the selected season does not exist", () => {
    expect(selectSeasonOverview(createSeedSnapshot(), "missing-cycle")).toBeNull()
  })
})
