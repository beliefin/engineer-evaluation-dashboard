import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CYCLE_ID } from "@/data/seed-fixtures"
import { createSeedSnapshot } from "@/data/seed"
import { selectEvaluatorDetail } from "@/view-models/evaluator-detail"

import { EvaluatorProfile } from "./evaluator-profile"

describe("EvaluatorProfile", () => {
  it("shows score level, consistency, task, item and recent evaluation evidence", () => {
    const snapshot = createSeedSnapshot()
    const evaluatorId = snapshot.evaluators[0]?.id
    if (evaluatorId === undefined) throw new Error("seed evaluator is required")
    const model = selectEvaluatorDetail(snapshot, CYCLE_ID, evaluatorId)
    if (model === null) throw new Error("evaluator detail model is required")

    render(<EvaluatorProfile model={model} />)

    expect(screen.getByRole("heading", { name: model.evaluator.displayName })).toBeInTheDocument()
    expect(screen.getByText("제출 평가")).toBeInTheDocument()
    expect(screen.getByText("편차 안정성")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "과제별 평가 성향" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "평가 항목별 경향" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "최근 평가 이력" })).toBeInTheDocument()

    const taskSelect = screen.getByLabelText("평가 과제")
    const taskOptions = Array.from(taskSelect.querySelectorAll("option"))
    if (taskOptions.length > 1) {
      const nextTaskId = taskOptions[1]?.value
      if (nextTaskId === undefined) throw new Error("second task option is required")
      fireEvent.change(taskSelect, { target: { value: nextTaskId } })
      expect(taskSelect).toHaveValue(nextTaskId)
    }
  })
})
