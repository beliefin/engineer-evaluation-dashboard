import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DirectScoreRulePanel } from "./direct-score-rule-panel"

afterEach(cleanup)

describe("DirectScoreRulePanel", () => {
  it("saves an editable certification score-table row", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(() => true)
    render(
      <DirectScoreRulePanel
        disabled={false}
        onSave={onSave}
        operatorTasks={[{ taskId: "task-certification", taskName: "자격증" }]}
        rules={[]}
      />,
    )

    await user.selectOptions(screen.getByLabelText("연결 과제"), "task-certification")
    await user.selectOptions(screen.getByLabelText("원천 종류"), "certification")
    await user.type(screen.getByLabelText("규칙 이름"), "산업안전기사")
    await user.type(screen.getByLabelText("기준값"), "산업안전기사")
    await user.type(screen.getByLabelText("분야"), "안전")
    await user.type(screen.getByLabelText("난이도"), "상")
    await user.type(screen.getByLabelText("업무연관성"), "매우높음")
    await user.clear(screen.getByLabelText("기본 점수"))
    await user.type(screen.getByLabelText("기본 점수"), "22")
    await user.clear(screen.getByLabelText("신규취득 가산점"))
    await user.type(screen.getByLabelText("신규취득 가산점"), "15")
    await user.click(screen.getByRole("button", { name: "환산 규칙 저장" }))

    expect(onSave).toHaveBeenCalledWith({
      ruleId: null,
      taskId: "task-certification",
      kind: "certification",
      label: "산업안전기사",
      field: "certificateName",
      operator: "equals",
      value: "산업안전기사",
      ruleType: "base",
      score: 22,
      bonus: 15,
      enabled: true,
      category: "안전",
      difficulty: "상",
      workRelevance: "매우높음",
    })
  })
})
