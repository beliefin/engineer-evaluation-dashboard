import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { EvaluationTaskDialog } from "./evaluation-task-dialog"

afterEach(cleanup)

describe("EvaluationTaskDialog", () => {
  it("평가 항목별 점수 기준을 작성해 과제 설정에 저장한다", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(() => true)
    render(
      <EvaluationTaskDialog
        disabled={false}
        evaluators={[]}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole("button", { name: "과제 추가" }))
    await user.type(screen.getByLabelText("과제명"), "성장/탐구 계획서")
    await user.click(screen.getByText("평가기준 0개 편집"))
    await user.click(screen.getByRole("button", { name: "평가 항목 1 평가기준 추가" }))
    const scoreInput = screen.getByRole("spinbutton", { name: "평가 항목 1 기준 1 점수" })
    fireEvent.change(scoreInput, { target: { value: "7" } })
    await user.type(
      screen.getByRole("textbox", { name: "평가 항목 1 기준 1 설명" }),
      "업무와 연결된 구체적인 목표가 제시됨.",
    )
    await user.click(screen.getByRole("button", { name: "과제 저장" }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      items: [expect.objectContaining({
        criteria: [{ score: 7, description: "업무와 연결된 구체적인 목표가 제시됨." }],
      })],
    }))
  })

  it("keeps the typed rubric label while React processes the state update", async () => {
    const user = userEvent.setup()
    render(
      <EvaluationTaskDialog
        disabled={false}
        evaluators={[{ id: "evaluator-01", name: "샘플 평가자 1", employeeCode: "EVAL-001" }]}
        onSave={vi.fn(() => true)}
      />,
    )

    await user.click(screen.getByRole("button", { name: "과제 추가" }))
    const rubricInput = screen.getByRole("textbox", { name: "평가 항목 1" })
    await user.clear(rubricInput)
    await user.type(rubricInput, "문제 정의")
    await user.click(screen.getByRole("checkbox", { name: "샘플 평가자 1 평가 참여" }))
    const weightInput = screen.getByRole("spinbutton", { name: "샘플 평가자 1 가중치" })
    await user.clear(weightInput)
    await user.type(weightInput, "2")

    expect(rubricInput).toHaveValue("문제 정의")
    expect(weightInput).toHaveValue(2)
  })
})
