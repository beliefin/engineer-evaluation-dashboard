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
      "성장·탐구 계획서",
      "선택 과제",
      "어학",
      "자격증",
      "고등급 제안",
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
      "주제와 목표 정하기",
      "탐구하고 적용하기",
      "결과 발표하고 보완하기",
    ])
    expect(growth?.focusItems).toContain("주제의 전략적 적합성과 집중도")
    expect(ots?.output).toContain("그대로 실행할 수 있는 OTS 시나리오 기획서")
    expect(ots?.methodLabel).toBe("평가자 점수 입력")
  })

  it("keeps education-only OTS work outside the general 100 percent evaluation", () => {
    const snapshot = createSeedSnapshot()
    const educationTask: EvaluationTask = {
      id: "task-ots-education",
      cycleId: "cycle-2026-h1",
      name: "OTS 시나리오 제작 교육",
      description: "교육 담당자가 진행하는 OTS 시나리오 제작 교육입니다.",
      method: "derived_score",
      weight: 70,
      order: 7,
      items: [],
    }

    const model = selectSeasonOverview({
      ...snapshot,
      tasks: [...snapshot.tasks, educationTask],
    }, "cycle-2026-h1")

    expect(model?.effectiveWeightTotal).toBe(100)
    expect(model?.composition).toHaveLength(5)
    expect(model?.composition.map((entry) => entry.weight)).toEqual([35, 35, 10, 10, 10])
    expect(model?.tasks.some((task) => task.id === educationTask.id)).toBe(false)
    expect(model?.educationTasks).toEqual([
      expect.objectContaining({
        id: educationTask.id,
        name: educationTask.name,
        weight: 70,
      }),
    ])
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
      methodLabel: "운영자 P/F 입력",
      focusItems: ["현장 적용 가능성"],
    })
    expect(task?.process).toHaveLength(3)
  })

  it("returns null when the selected season does not exist", () => {
    expect(selectSeasonOverview(createSeedSnapshot(), "missing-cycle")).toBeNull()
  })
})
