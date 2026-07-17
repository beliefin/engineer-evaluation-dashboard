import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import { DerivedScoreRulePanel } from "./derived-score-rule-panel"

afterEach(cleanup)

describe("DerivedScoreRulePanel", () => {
  it.each([
    ["점수를 받을 엔지니어", "engineer-target", "파생 점수 과제", "task-derived"],
    ["파생 점수 과제", "task-derived", "평균 원천 과제", "task-source"],
    ["평균 원천 과제", "task-source", "점수를 받을 엔지니어", "engineer-target"],
  ] as const)("keeps the form available after selecting %s and %s", async (
    firstLabel,
    firstValue,
    secondLabel,
    secondValue,
  ) => {
    const user = userEvent.setup()
    render(
      <DerivedScoreRulePanel
        derivedTasks={[{ taskId: "task-derived", taskName: "OTS 시나리오 제작 교육" }]}
        disabled={false}
        engineers={[
          { engineerId: "engineer-target", engineerName: "대상 엔지니어", teamName: "생산 1팀" },
          { engineerId: "engineer-source", engineerName: "원천 엔지니어", teamName: "생산 2팀" },
        ]}
        rules={[]}
        sourceTasks={[{ taskId: "task-source", taskName: "성장탐구계획서" }]}
      />,
    )

    const firstSelect = screen.getByLabelText(firstLabel)
    const secondSelect = screen.getByLabelText(secondLabel)
    await user.selectOptions(firstSelect, firstValue)
    await user.selectOptions(secondSelect, secondValue)

    expect(firstSelect).toHaveValue(firstValue)
    expect(secondSelect).toHaveValue(secondValue)
  })
})
