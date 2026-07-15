import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ReopenSheetPanel } from "./reopen-sheet-panel"
import type { SubmittedSheetViewModel } from "./types"

const SUBMITTED_SHEET: SubmittedSheetViewModel = {
  sheetId: "score-sheet-001",
  engineerName: "김하늘",
  evaluatorName: "박평가",
  categoryLabel: "성장탐구계획서",
  submittedAtLabel: "2026. 7. 14. 오후 2:40",
}

afterEach(cleanup)

function getFirstReopenButton(): HTMLElement {
  const button = screen.getAllByRole("button", { name: "재오픈" }).at(0)

  if (button === undefined) {
    throw new Error("Reopen button was not rendered")
  }

  return button
}

describe("ReopenSheetPanel", () => {
  it("공백뿐인 사유로는 제출 평가 잠금을 해제할 수 없다", async () => {
    // Given
    const user = userEvent.setup()
    const onReopen = vi.fn()
    render(
      <ReopenSheetPanel
        disabled={false}
        onReopen={onReopen}
        sheets={[SUBMITTED_SHEET]}
      />
    )

    // When
    await user.click(getFirstReopenButton())
    const dialog = screen.getByRole("dialog", { name: "제출 평가 재오픈" })
    const reasonInput = within(dialog).getByRole("textbox", {
      name: "재오픈 사유",
    })
    await user.type(reasonInput, "   ")

    // Then
    expect(within(dialog).getByRole("button", { name: "잠금 해제" })).toBeDisabled()
    expect(onReopen).not.toHaveBeenCalled()
  })

  it("유효한 사유를 정규화해 재오픈 동작으로 전달하고 대화상자를 닫는다", async () => {
    // Given
    const user = userEvent.setup()
    const onReopen = vi.fn()
    render(
      <ReopenSheetPanel
        disabled={false}
        onReopen={onReopen}
        sheets={[SUBMITTED_SHEET]}
      />
    )
    expect(screen.getByText("1건 잠금")).toBeInTheDocument()

    // When
    await user.click(getFirstReopenButton())
    const dialog = screen.getByRole("dialog", { name: "제출 평가 재오픈" })
    await user.type(
      within(dialog).getByRole("textbox", { name: "재오픈 사유" }),
      "  평가 항목 3 수정 필요  "
    )
    await user.click(within(dialog).getByRole("button", { name: "잠금 해제" }))

    // Then
    expect(onReopen).toHaveBeenCalledOnce()
    expect(onReopen).toHaveBeenCalledWith(
      "score-sheet-001",
      "평가 항목 3 수정 필요"
    )
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "제출 평가 재오픈" })
      ).not.toBeInTheDocument()
    })
  })
})
