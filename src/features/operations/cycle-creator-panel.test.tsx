import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CycleCreatorPanel } from "./cycle-creator-panel"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("CycleCreatorPanel", () => {
  it("collects a new season and keeps configuration copy enabled by default", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn(() => true)
    render(
      <CycleCreatorPanel
        cycleCount={1}
        cycleLocked={false}
        cycleLabel="2026 상반기"
        cycleStatus="active"
        disabled={false}
        endsAt="2026-06-30"
        onCreate={onCreate}
        onSetLock={vi.fn(() => true)}
        onUpdate={vi.fn(() => true)}
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
        cycleLocked={false}
        cycleLabel="2026 상반기"
        cycleStatus="active"
        disabled={false}
        endsAt="2026-06-30"
        onCreate={onCreate}
        onSetLock={vi.fn(() => true)}
        onUpdate={vi.fn(() => true)}
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

  it("edits settings and toggles the season lock", async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn(() => true)
    const onSetLock = vi.fn(() => true)
    vi.spyOn(window, "confirm").mockReturnValue(true)
    render(
      <CycleCreatorPanel
        cycleCount={2}
        cycleLabel="2026 상반기"
        cycleLocked={false}
        cycleStatus="active"
        disabled={false}
        endsAt="2026-06-30"
        onCreate={vi.fn(() => true)}
        onSetLock={onSetLock}
        onUpdate={onUpdate}
        onDelete={vi.fn(() => true)}
        startsAt="2026-01-02"
      />,
    )

    await user.click(screen.getByRole("button", { name: "설정 수정" }))
    const nameInput = screen.getByLabelText("평가 시즌명")
    await user.clear(nameInput)
    await user.type(nameInput, "2026 하반기")
    await user.click(screen.getByRole("button", { name: "설정 저장" }))
    expect(onUpdate).toHaveBeenCalledWith({
      name: "2026 하반기",
      status: "active",
      startsAt: "2026-01-02",
      endsAt: "2026-06-30",
    })

    await user.click(screen.getByRole("button", { name: "시즌 잠금" }))
    expect(onSetLock).toHaveBeenCalledWith(true)
  })
})
