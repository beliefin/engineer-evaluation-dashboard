import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { EvaluationCalendar } from "./evaluation-calendar"
import type { CalendarEventView, CalendarEngineer } from "./types"

const ENGINEERS: readonly CalendarEngineer[] = [
  { id: "engineer-1", displayName: "김새벽", team: "생산 1팀" },
  { id: "engineer-2", displayName: "이바다", team: "생산 2팀" },
]

const EVENTS: readonly CalendarEventView[] = [
  {
    id: "event-1",
    engineerId: "engineer-1",
    engineerName: "김새벽",
    title: "성장탐구 발표",
    date: "2026-07-14",
    startTime: "09:00",
    note: "2층 회의실",
  },
]

afterEach(cleanup)

function renderCalendar(overrides: { readonly readOnly?: boolean } = {}) {
  const callbacks = {
    onMonthChange: vi.fn(),
    onCreate: vi.fn(() => true),
    onUpdate: vi.fn(() => true),
    onDelete: vi.fn(() => true),
  }
  render(
    <EvaluationCalendar
      engineers={ENGINEERS}
      events={EVENTS}
      month="2026-07"
      readOnly={overrides.readOnly ?? false}
      {...callbacks}
    />,
  )
  return callbacks
}

describe("EvaluationCalendar", () => {
  it("changes month with explicit accessible controls", async () => {
    const callbacks = renderCalendar()

    await userEvent.click(screen.getByRole("button", { name: "이전 달" }))
    await userEvent.click(screen.getByRole("button", { name: "다음 달" }))

    expect(callbacks.onMonthChange).toHaveBeenNthCalledWith(1, "2026-06")
    expect(callbacks.onMonthChange).toHaveBeenNthCalledWith(2, "2026-08")
    expect(screen.getAllByText("2026년 7월").length).toBeGreaterThan(0)
  })

  it("creates a schedule after validating native date and time inputs", async () => {
    const callbacks = renderCalendar()
    await userEvent.click(screen.getByRole("button", { name: "일정 추가" }))

    expect(screen.getByRole("dialog")).toHaveClass("overflow-hidden")
    expect(screen.getByRole("group", { name: "일정 입력 항목" })).toHaveClass("overflow-y-auto")
    expect(screen.getByRole("button", { name: "일정 저장" }).closest("[data-slot=dialog-footer]")).toHaveClass("shrink-0")

    await userEvent.selectOptions(screen.getByLabelText("엔지니어"), "engineer-2")
    await userEvent.type(screen.getByLabelText("일정 제목"), "OTS 발표")
    fireEvent.change(screen.getByLabelText("발표일"), { target: { value: "2026-07-21" } })
    fireEvent.change(screen.getByLabelText("시작 시간"), { target: { value: "14:30" } })
    await userEvent.type(screen.getByLabelText("메모"), "대회의실")
    await userEvent.click(screen.getByRole("button", { name: "일정 저장" }))

    expect(callbacks.onCreate).toHaveBeenCalledWith({
      engineerId: "engineer-2",
      title: "OTS 발표",
      date: "2026-07-21",
      startTime: "14:30",
      note: "대회의실",
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("blocks an incomplete schedule and links the error to its field", async () => {
    const callbacks = renderCalendar()
    await userEvent.click(screen.getByRole("button", { name: "일정 추가" }))
    await userEvent.click(screen.getByRole("button", { name: "일정 저장" }))

    expect(callbacks.onCreate).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("일정 제목을 입력해 주세요")
    expect(screen.getByLabelText("일정 제목")).toHaveAttribute("aria-invalid", "true")
  })

  it("edits and deletes an existing schedule", async () => {
    const callbacks = renderCalendar()
    const monthlyGrid = screen.getByRole("table", { name: "월간 발표 일정" })
    await userEvent.click(within(monthlyGrid).getByRole("button", { name: /김새벽.*성장탐구 발표/ }))

    const titleInput = screen.getByLabelText("일정 제목")
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, "성장탐구 최종 발표")
    await userEvent.click(screen.getByRole("button", { name: "변경사항 저장" }))

    expect(callbacks.onUpdate).toHaveBeenCalledWith("event-1", {
      engineerId: "engineer-1",
      title: "성장탐구 최종 발표",
      date: "2026-07-14",
      startTime: "09:00",
      note: "2층 회의실",
    })

    await userEvent.click(within(monthlyGrid).getByRole("button", { name: /김새벽.*성장탐구 발표/ }))
    await userEvent.click(screen.getByRole("button", { name: "일정 삭제" }))
    expect(screen.getByRole("alertdialog", { name: "일정을 삭제할까요?" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "삭제 확인" }))

    expect(callbacks.onDelete).toHaveBeenCalledWith("event-1")
  })

  it("returns to the unchanged edit form when deletion is canceled", async () => {
    renderCalendar()
    const monthlyGrid = screen.getByRole("table", { name: "월간 발표 일정" })
    await userEvent.click(within(monthlyGrid).getByRole("button", { name: /김새벽.*성장탐구 발표/ }))
    const titleInput = screen.getByLabelText("일정 제목")
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, "검토 중인 발표 제목")
    await userEvent.click(screen.getByRole("button", { name: "일정 삭제" }))
    await userEvent.click(screen.getByRole("button", { name: "취소" }))

    expect(screen.getByRole("dialog", { name: "발표 일정 수정" })).toBeInTheDocument()
    expect(screen.getByLabelText("일정 제목")).toHaveValue("검토 중인 발표 제목")
  })

  it("exposes a view-only calendar without mutation controls", () => {
    renderCalendar({ readOnly: true })

    expect(screen.queryByRole("button", { name: "일정 추가" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /김새벽.*성장탐구 발표/ })).not.toBeInTheDocument()
    expect(screen.getAllByText("성장탐구 발표").length).toBeGreaterThan(0)
    const agenda = screen.getByRole("complementary", { name: "이달 일정" })
    expect(within(agenda).getByText("성장탐구 발표")).toHaveClass("break-words")
    expect(within(agenda).getByText("성장탐구 발표")).not.toHaveClass("truncate")
    expect(screen.getByText("읽기 전용")).toBeInTheDocument()
  })

  it("keeps the dialog open and announces a callback failure", async () => {
    const callbacks = renderCalendar()
    callbacks.onCreate.mockReturnValue(false)
    await userEvent.click(screen.getByRole("button", { name: "일정 추가" }))
    await userEvent.selectOptions(screen.getByLabelText("엔지니어"), "engineer-1")
    await userEvent.type(screen.getByLabelText("일정 제목"), "DX 발표")
    await userEvent.click(screen.getByRole("button", { name: "일정 저장" }))

    expect(screen.getByRole("alert")).toHaveTextContent("일정을 저장하지 못했습니다")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("announces a failed deletion without closing the confirmation", async () => {
    const callbacks = renderCalendar()
    callbacks.onDelete.mockReturnValue(false)
    const monthlyGrid = screen.getByRole("table", { name: "월간 발표 일정" })
    await userEvent.click(within(monthlyGrid).getByRole("button", { name: /김새벽.*성장탐구 발표/ }))
    await userEvent.click(screen.getByRole("button", { name: "일정 삭제" }))
    await userEvent.click(screen.getByRole("button", { name: "삭제 확인" }))

    expect(screen.getByRole("alert")).toHaveTextContent("일정을 삭제하지 못했습니다")
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })
})
