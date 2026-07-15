import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { EvaluatorWeightPanel } from "./evaluator-weight-panel"
import type { EvaluatorWeightViewModel } from "./types"

const ROWS: readonly EvaluatorWeightViewModel[] = [
  {
    assignmentId: "assignment-01",
    engineerId: "engineer-01",
    engineerName: "샘플 엔지니어 01",
    employeeLabel: "SAMPLE-001",
    teamName: "공정기술 1팀",
    evaluatorId: "evaluator-01",
    evaluatorName: "샘플 평가자 01",
    categoryKey: "growth_plan",
    categoryLabel: "성장탐구계획서",
    rawWeight: 50,
    normalizedRatio: 0.5,
  },
  {
    assignmentId: "assignment-02",
    engineerId: "engineer-02",
    engineerName: "샘플 엔지니어 02",
    employeeLabel: "SAMPLE-002",
    teamName: "공정기술 2팀",
    evaluatorId: "evaluator-01",
    evaluatorName: "샘플 평가자 01",
    categoryKey: "growth_plan",
    categoryLabel: "성장탐구계획서",
    rawWeight: 50,
    normalizedRatio: 0.5,
  },
]

describe("EvaluatorWeightPanel", () => {
  it("updates only the concrete assignment selected by the operator", async () => {
    // Given
    const user = userEvent.setup()
    const onWeightChange = vi.fn()
    render(
      <EvaluatorWeightPanel
        disabled={false}
        onWeightChange={onWeightChange}
        rows={ROWS}
      />,
    )

    // When
    const input = screen.getAllByRole("spinbutton", {
      name: "샘플 엔지니어 01 샘플 평가자 01 성장탐구계획서 원시 가중치",
    })[0]
    if (input === undefined) throw new RangeError("weight input was not rendered")
    await user.clear(input)
    await user.type(input, "45")

    // Then
    expect(onWeightChange).toHaveBeenLastCalledWith("assignment-01", 45)
    expect(onWeightChange).not.toHaveBeenCalledWith("assignment-02", 45)
  })
})
