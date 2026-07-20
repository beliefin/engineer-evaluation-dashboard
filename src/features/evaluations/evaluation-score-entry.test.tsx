import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { EvaluationScoreForm } from "./evaluation-score-form"
import { ScoreInputRow } from "./score-input-row"
import type { EvaluationScoreFormViewModel } from "./types"

afterEach(cleanup)

function makeViewModel(
  assignmentId: string,
  values: readonly (number | null)[],
): EvaluationScoreFormViewModel {
  return {
    assignmentId,
    cycleLabel: "2026년 평가",
    categoryLabel: "성장탐구계획서",
    description: "과제 평가 안내",
    method: "evaluator_score",
    engineerName: "평가 대상",
    teamName: "생산 1팀",
    evaluatorName: "평가자",
    proxyEntry: true,
    submitted: false,
    unlockRequestPending: false,
    items: values.map((value, index) => ({
      id: `item-${index + 1}`,
      index: index + 1,
      label: `평가 항목 ${index + 1}`,
      section: null,
      criteria: [],
      value,
    })),
    passResult: null,
    autosaveStatus: "idle",
    lastSavedAtLabel: null,
    submittedAtLabel: null,
    locked: false,
  }
}

function formProps(viewModel: EvaluationScoreFormViewModel) {
  return {
    viewModel,
    onScoreChange: vi.fn(),
    onScoresChange: vi.fn(),
    onPassResultChange: vi.fn(),
    onSave: vi.fn(),
    onSubmit: vi.fn(),
    onRequestUnlock: vi.fn(),
  }
}

describe("evaluation score entry", () => {
  it("clears an unsaved row draft when the operator switches evaluators", async () => {
    // Given
    const user = userEvent.setup()
    const first = formProps(makeViewModel("assignment-01", [null]))
    const view = render(<EvaluationScoreForm {...first} />)
    await user.type(screen.getByLabelText("평가 항목 1 점수"), "9")

    // When
    const second = formProps(makeViewModel("assignment-02", [null]))
    view.rerender(<EvaluationScoreForm {...second} />)

    // Then
    expect(screen.getByLabelText("평가 항목 1 점수")).toHaveDisplayValue("")
  })

  it("loads the selected evaluator's saved score after switching evaluators", async () => {
    // Given
    const user = userEvent.setup()
    const first = formProps(makeViewModel("assignment-01", [null]))
    const view = render(<EvaluationScoreForm {...first} />)
    await user.type(screen.getByLabelText("평가 항목 1 점수"), "9")

    // When
    const second = formProps(makeViewModel("assignment-02", [7]))
    view.rerender(<EvaluationScoreForm {...second} />)

    // Then
    expect(screen.getByLabelText("평가 항목 1 점수")).toHaveDisplayValue("7")
  })

  it("uses a text input so the mouse wheel cannot change a score", () => {
    // Given / When
    render(
      <ScoreInputRow
        assignmentId="assignment-01"
        item={{ id: "item-1", index: 1, label: "평가 항목 1", section: null, criteria: [], value: 5 }}
        locked={false}
        onChange={vi.fn()}
      />,
    )

    // Then
    expect(screen.getByLabelText("평가 항목 1 점수")).toHaveAttribute("type", "text")
  })

  it("applies tab and line separated TSV scores in one batch", async () => {
    // Given
    const user = userEvent.setup()
    const props = formProps(makeViewModel("assignment-01", [null, null, null]))
    render(<EvaluationScoreForm {...props} />)

    // When
    fireEvent.change(screen.getByRole("textbox", { name: "TSV 점수" }), {
      target: { value: "9\t8\n7" },
    })
    await user.click(screen.getByRole("button", { name: "점수 일괄 적용" }))

    // Then
    expect(props.onScoresChange).toHaveBeenCalledOnce()
    expect(props.onScoresChange).toHaveBeenCalledWith([9, 8, 7])
  })

  it("rejects TSV input with missing or invalid scores", async () => {
    // Given
    const user = userEvent.setup()
    const props = formProps(makeViewModel("assignment-01", [null, null, null]))
    render(<EvaluationScoreForm {...props} />)
    const input = screen.getByRole("textbox", { name: "TSV 점수" })

    // When
    fireEvent.change(input, { target: { value: "9\t8" } })
    await user.click(screen.getByRole("button", { name: "점수 일괄 적용" }))

    // Then
    expect(screen.getByText(/3개 점수가 필요합니다/)).toBeInTheDocument()
    expect(props.onScoresChange).not.toHaveBeenCalled()

    // When
    fireEvent.change(input, { target: { value: "9\t11\t7" } })
    await user.click(screen.getByRole("button", { name: "점수 일괄 적용" }))

    // Then
    expect(screen.getByText(/2번째 값은 0에서 10 사이의 정수/)).toBeInTheDocument()
    expect(props.onScoresChange).not.toHaveBeenCalled()
  })
})
