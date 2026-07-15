import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CycleCreatorPanel } from "./cycle-creator-panel"

afterEach(cleanup)

describe("CycleCreatorPanel", () => {
  it("collects a new season and keeps configuration copy enabled by default", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn(() => true)
    render(
      <CycleCreatorPanel
        cycleCount={1}
        cycleLabel="2026 상반기"
        cycleStatus="active"
        disabled={false}
        endsAt="2026-06-30"
        onCreate={onCreate}
        startsAt="2026-01-02"
      />,
    )

    await user.click(screen.getByRole("button", { name: "평가 시즌 만들기" }))
    await user.type(screen.getByLabelText("평가 시즌명"), "2026 하반기")
    await user.type(screen.getByLabelText("시작일"), "2026-07-01")
    await user.type(screen.getByLabelText("종료일"), "2026-12-31")
    await user.click(screen.getByRole("button", { name: "시즌 만들기" }))

    expect(onCreate).toHaveBeenCalledWith({
      name: "2026 하반기",
      status: "setup",
      startsAt: "2026-07-01",
      endsAt: "2026-12-31",
      copyConfiguration: true,
    })
  })

  it("blocks an end date earlier than the start date", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn(() => true)
    render(
      <CycleCreatorPanel
        cycleCount={1}
        cycleLabel="2026 상반기"
        cycleStatus="active"
        disabled={false}
        endsAt="2026-06-30"
        onCreate={onCreate}
        startsAt="2026-01-02"
      />,
    )

    await user.click(screen.getByRole("button", { name: "평가 시즌 만들기" }))
    await user.type(screen.getByLabelText("평가 시즌명"), "기간 오류")
    await user.type(screen.getByLabelText("시작일"), "2026-12-31")
    await user.type(screen.getByLabelText("종료일"), "2026-07-01")
    await user.click(screen.getByRole("button", { name: "시즌 만들기" }))

    expect(screen.getByRole("alert")).toHaveTextContent("평가 종료일은 시작일보다 빠를 수 없습니다.")
    expect(onCreate).not.toHaveBeenCalled()
  })
})
