import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { EvaluationTaskDialog } from "./evaluation-task-dialog"

describe("EvaluationTaskDialog", () => {
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
