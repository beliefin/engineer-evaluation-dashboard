import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { EngineerTaskWeightPanel } from "./engineer-task-weight-panel"

const ROWS = [{
  engineerId: "engineer-01",
  engineerName: "샘플 엔지니어 01",
  employeeLabel: "SAMPLE-001",
  teamName: "생산 1팀",
  customized: true,
  tasks: [
    { taskId: "growth", taskName: "성장탐구계획서", method: "evaluator_score", defaultWeight: 35, weight: 35 },
    { taskId: "ots", taskName: "OTS 시나리오 제작", method: "evaluator_score", defaultWeight: 35, weight: 35 },
    { taskId: "dx", taskName: "DX 툴 활용", method: "evaluator_score", defaultWeight: 35, weight: 0 },
    { taskId: "direct", taskName: "기타 점수", method: "operator_score", defaultWeight: 30, weight: 30 },
  ],
}] as const

const SEASON_DEFAULT_ROWS = [{
  engineerId: "engineer-02",
  engineerName: "샘플 엔지니어 02",
  employeeLabel: "SAMPLE-002",
  teamName: "생산 2팀",
  customized: false,
  seasonDefaultsEnabled: true,
  tasks: [
    { taskId: "growth", taskName: "성장탐구계획서", method: "evaluator_score", defaultWeight: 35, weight: 35 },
    { taskId: "ots", taskName: "OTS 시나리오 제작", method: "evaluator_score", defaultWeight: 35, weight: 35 },
    { taskId: "dx", taskName: "DX 툴 활용", method: "evaluator_score", defaultWeight: 35, weight: 35 },
    { taskId: "direct", taskName: "기타 점수", method: "operator_score", defaultWeight: 30, weight: 30 },
  ],
}] as const

describe("EngineerTaskWeightPanel", () => {
  afterEach(cleanup)

  it("switches an engineer from OTS to DX and saves the complete 100% allocation", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(() => true)
    render(<EngineerTaskWeightPanel disabled={false} onSave={onSave} rows={ROWS} />)

    const ots = screen.getByRole("spinbutton", { name: "OTS 시나리오 제작 가중치" })
    const dx = screen.getByRole("spinbutton", { name: "DX 툴 활용 가중치" })
    await user.clear(ots)
    await user.type(ots, "0")
    await user.clear(dx)
    await user.type(dx, "35")
    await user.click(screen.getByRole("button", { name: "개인별 가중치 저장" }))

    expect(onSave).toHaveBeenCalledWith("engineer-01", [
      { taskId: "growth", weight: 35 },
      { taskId: "ots", weight: 0 },
      { taskId: "dx", weight: 35 },
      { taskId: "direct", weight: 30 },
    ])
  })

  it("requires an individual selection when season defaults exceed 100%", () => {
    render(<EngineerTaskWeightPanel disabled={false} onSave={vi.fn(() => true)} rows={SEASON_DEFAULT_ROWS} />)

    expect(screen.getByText(/시즌 기본값 합계가 135%/)).toBeVisible()
    expect(screen.getByRole("button", { name: "개인별 가중치 저장" })).toBeDisabled()
  })
})
