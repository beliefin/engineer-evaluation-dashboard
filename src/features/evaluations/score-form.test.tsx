import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ScoreInputRow } from "./score-input-row"
import { EvaluationScoreForm } from "./evaluation-score-form"
import type { EvaluationScoreFormViewModel } from "./types"

afterEach(cleanup)

function makeViewModel(
  values: readonly (number | null)[],
  locked = false
): EvaluationScoreFormViewModel {
  return {
    assignmentId: "assignment-01",
    cycleLabel: "2026 상반기 역량평가",
    categoryLabel: "DX 툴 활용",
    description: "과제 평가 안내",
    method: "evaluator_score",
    engineerName: "김하늘",
    teamName: "생산 1팀",
    evaluatorName: "박평가",
    proxyEntry: false,
    items: values.map((value, itemIndex) => ({
      id: `item-${itemIndex + 1}`,
      index: itemIndex + 1,
      label: `평가 항목 ${itemIndex + 1}`,
      section: null,
      criteria: [],
      value,
    })),
    passResult: null,
    autosaveStatus: "saved",
    lastSavedAtLabel: "오후 2:31",
    submittedAtLabel: locked ? "2026. 7. 14. 오후 2:40" : null,
    submitted: locked,
    locked,
    unlockRequestPending: false,
  }
}

describe("ScoreInputRow", () => {
  it("평가항목을 펼치면 점수별 세부 평가기준을 확인할 수 있다", async () => {
    const user = userEvent.setup()

    render(
      <ScoreInputRow
        assignmentId="assignment-01"
        item={{
          id: "item-1",
          index: 1,
          label: "주제의 전략적 적합성과 집중도",
          section: "서론",
          criteria: [
            { score: 3, description: "목표가 불분명함." },
            { score: 9, description: "목표가 명확하고 기대되는 모습이 잘 그려짐." },
          ],
          value: null,
        }}
        locked={false}
        onChange={vi.fn()}
      />,
    )

    await user.click(screen.getByText("주제의 전략적 적합성과 집중도"))

    expect(screen.getByText("3점")).toBeVisible()
    expect(screen.getByText("목표가 명확하고 기대되는 모습이 잘 그려짐.")).toBeVisible()
  })

  it("0~10 사이 정수만 변경값으로 전달한다", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <ScoreInputRow
        assignmentId="assignment-01"
        item={{ id: "item-1", index: 1, label: "평가 항목 1", section: null, criteria: [], value: null }}
        locked={false}
        onChange={onChange}
      />
    )

    const input = screen.getByRole("spinbutton", { name: "평가 항목 1 점수" })
    fireEvent.change(input, { target: { value: "11" } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText("0에서 10 사이의 정수를 입력해 주세요.")).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, "10")
    expect(onChange).toHaveBeenLastCalledWith(10)
  })

  it("위아래 화살표 키로 경계 안에서 점수를 조정한다", () => {
    const onChange = vi.fn()

    render(
      <ScoreInputRow
        assignmentId="assignment-01"
        item={{ id: "item-1", index: 1, label: "평가 항목 1", section: null, criteria: [], value: 5 }}
        locked={false}
        onChange={onChange}
      />
    )

    const input = screen.getByRole("spinbutton", { name: "평가 항목 1 점수" })
    fireEvent.keyDown(input, { key: "ArrowUp" })
    fireEvent.keyDown(input, { key: "ArrowDown" })

    expect(onChange).toHaveBeenNthCalledWith(1, 6)
    expect(onChange).toHaveBeenNthCalledWith(2, 5)
  })
})

describe("EvaluationScoreForm", () => {
  it("P/F 과제는 결과 한 개를 선택해 제출한다", async () => {
    const user = userEvent.setup()
    const onPassResultChange = vi.fn()
    const onSubmit = vi.fn()
    const model: EvaluationScoreFormViewModel = {
      ...makeViewModel([]),
      method: "evaluator_pass_fail",
      passResult: true,
    }

    render(
      <EvaluationScoreForm
        viewModel={model}
        onScoreChange={vi.fn()}
        onPassResultChange={onPassResultChange}
        onSave={vi.fn()}
        onSubmit={onSubmit}
        onRequestUnlock={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Fail" }))
    expect(onPassResultChange).toHaveBeenCalledWith(false)
    await user.click(screen.getByRole("button", { name: "제출 및 잠금" }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("미완료 평가지는 제출을 차단하고 남은 항목 수를 알린다", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const values = [10, 9, 8, 7, 6, 5, 4, 3, 2, null]

    render(
      <EvaluationScoreForm
        viewModel={makeViewModel(values)}
        onScoreChange={vi.fn()}
        onPassResultChange={vi.fn()}
        onSave={vi.fn()}
        onSubmit={onSubmit}
        onRequestUnlock={vi.fn()}
      />
    )

    expect(screen.getByText("1개 남음")).toBeInTheDocument()
    const submit = screen.getByRole("button", { name: "제출 및 잠금" })
    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("10개 점수가 모두 유효하면 제출할 수 있다", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <EvaluationScoreForm
        viewModel={makeViewModel([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])}
        onScoreChange={vi.fn()}
        onPassResultChange={vi.fn()}
        onSave={vi.fn()}
        onSubmit={onSubmit}
        onRequestUnlock={vi.fn()}
      />
    )

    expect(screen.getByText("55.0")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "제출 및 잠금" }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("제출 완료 평가지는 입력과 동작을 잠근다", () => {
    render(
      <EvaluationScoreForm
        viewModel={makeViewModel([10, 9, 8, 7, 6, 5, 4, 3, 2, 1], true)}
        onScoreChange={vi.fn()}
        onPassResultChange={vi.fn()}
        onSave={vi.fn()}
        onSubmit={vi.fn()}
        onRequestUnlock={vi.fn()}
      />
    )

    expect(screen.getByText("제출 완료되어 잠겼습니다")).toBeInTheDocument()
    expect(
      screen.getByText(/운영자에게 잠금 해제를 요청하세요/),
    ).toBeInTheDocument()
    for (const input of screen.getAllByRole("spinbutton")) {
      expect(input).toBeDisabled()
    }
    expect(screen.getByRole("button", { name: "임시저장" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "제출 및 잠금" })).toBeDisabled()
  })

  it("평가자가 제출 후 수정 사유를 적어 잠금 해제를 요청한다", async () => {
    const user = userEvent.setup()
    const onRequestUnlock = vi.fn()
    render(
      <EvaluationScoreForm
        viewModel={makeViewModel([10, 9, 8, 7, 6, 5, 4, 3, 2, 1], true)}
        onScoreChange={vi.fn()}
        onPassResultChange={vi.fn()}
        onSave={vi.fn()}
        onSubmit={vi.fn()}
        onRequestUnlock={onRequestUnlock}
      />,
    )

    await user.click(screen.getByRole("button", { name: "잠금 해제 요청" }))
    const dialog = screen.getByRole("dialog", { name: "평가 잠금 해제 요청" })
    await user.type(
      screen.getByRole("textbox", { name: "수정 요청 사유" }),
      "평가 항목 3 점수 오입력",
    )
    await user.click(screen.getByRole("button", { name: "요청 보내기" }))

    expect(onRequestUnlock).toHaveBeenCalledWith("평가 항목 3 점수 오입력")
    expect(dialog).not.toBeInTheDocument()
  })

  it("운영자 대리 입력임을 평가자 이름과 함께 명확히 알린다", () => {
    render(
      <EvaluationScoreForm
        viewModel={{
          ...makeViewModel([null, null, null, null, null, null, null, null, null, null]),
          proxyEntry: true,
        }}
        onScoreChange={vi.fn()}
        onPassResultChange={vi.fn()}
        onSave={vi.fn()}
        onSubmit={vi.fn()}
        onRequestUnlock={vi.fn()}
      />,
    )

    expect(screen.getByText("운영자 대리 입력 · 박평가")).toBeInTheDocument()
    expect(
      screen.getByText(/운영자 입력은 저장 후에도 잠기지 않아 계속 수정할 수 있습니다/),
    ).toBeInTheDocument()
  })
})
