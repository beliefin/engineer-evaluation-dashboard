import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ScoreAdjustmentPanel } from "./score-adjustment-panel"

afterEach(cleanup)

const ROW = {
  engineerId: "engineer-1",
  engineerName: "이창준",
  employeeLabel: "31019432",
  teamName: "생산 1팀",
  baseScore: 82.25,
  adjustmentTotal: 2,
  finalScore: 84.25,
  adjustments: [{
    id: "adjustment-1",
    amount: 2,
    reason: "우수 발표 가점",
    updatedAtLabel: "2026. 07. 16. 09:00",
  }],
} as const

describe("ScoreAdjustmentPanel", () => {
  it("requires a non-zero signed amount and reason before saving", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(() => true)
    render(
      <ScoreAdjustmentPanel
        disabled={false}
        onDelete={vi.fn(() => true)}
        onSave={onSave}
        rows={[ROW]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "가·감점 반영" }))
    expect(screen.getByText("0이 아닌 가점 또는 감점 값을 입력해 주세요.")).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText("가·감점 값"))
    await user.type(screen.getByLabelText("가·감점 값"), "-3.5")
    await user.type(screen.getByLabelText("적용 사유"), "발표 시간 기준 미준수")
    await user.click(screen.getByRole("button", { name: "가·감점 반영" }))

    expect(onSave).toHaveBeenCalledWith({
      adjustmentId: null,
      engineerId: "engineer-1",
      amount: -3.5,
      reason: "발표 시간 기준 미준수",
    })
  })

  it("shows base, adjustment, adjusted total, and a deletion confirmation", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn(() => true)
    render(
      <ScoreAdjustmentPanel
        disabled={false}
        onDelete={onDelete}
        onSave={vi.fn(() => true)}
        rows={[ROW]}
      />,
    )

    expect(screen.getByText("82.25")).toBeInTheDocument()
    expect(screen.getAllByText("+2.00").length).toBeGreaterThan(0)
    expect(screen.getByText("84.25")).toBeInTheDocument()
    expect(screen.getByText("우수 발표 가점")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "우수 발표 가점 삭제" }))
    await user.click(screen.getByRole("button", { name: "삭제" }))
    expect(onDelete).toHaveBeenCalledWith("adjustment-1")
  })
})
