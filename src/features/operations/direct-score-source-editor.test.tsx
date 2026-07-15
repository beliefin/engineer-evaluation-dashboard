import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DirectScoreSourceEditor } from "./direct-score-source-editor"
import type { EngineerDirectScoreViewModel } from "./types"

afterEach(cleanup)

const ROW: EngineerDirectScoreViewModel = {
  engineerId: "engineer-01",
  engineerName: "샘플 엔지니어 01",
  employeeLabel: "SAMPLE-001",
  teamName: "생산 1팀",
  directTasks: [],
  languageRecords: [],
  certificationRecords: [],
}

function renderEditor(overrides?: Partial<EngineerDirectScoreViewModel>) {
  const callbacks = {
    onSaveLanguageRecord: vi.fn(() => true),
    onDeleteLanguageRecord: vi.fn(() => true),
    onSaveCertificationRecord: vi.fn(() => true),
    onDeleteCertificationRecord: vi.fn(() => true),
    onVerifySourceRecord: vi.fn(() => true),
  }
  render(
    <DirectScoreSourceEditor
      disabled={false}
      rows={[{ ...ROW, ...overrides }]}
      {...callbacks}
    />,
  )
  return callbacks
}

describe("DirectScoreSourceEditor", () => {
  it("stores a language result as source text and explains deferred conversion", async () => {
    const user = userEvent.setup()
    const callbacks = renderEditor()

    expect(screen.getByText("자동 환산 대기")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "어학 성적 추가" }))
    await user.type(screen.getByLabelText("시험명"), "OPIc")
    await user.type(screen.getByLabelText("점수 또는 등급"), "IH")
    await user.type(screen.getByLabelText("취득일"), "2026-03-14")
    await user.click(screen.getByRole("button", { name: "저장" }))

    expect(callbacks.onSaveLanguageRecord).toHaveBeenCalledWith({
      recordId: null,
      engineerId: "engineer-01",
      examName: "OPIc",
      result: "IH",
      acquiredOn: "2026-03-14",
      note: null,
    })
  })

  it("requires a language exam name and result", async () => {
    const user = userEvent.setup()
    const callbacks = renderEditor()

    await user.click(screen.getByRole("button", { name: "어학 성적 추가" }))
    await user.click(screen.getByRole("button", { name: "저장" }))

    expect(callbacks.onSaveLanguageRecord).not.toHaveBeenCalled()
  })

  it("asks for confirmation before deleting a certification record", async () => {
    const user = userEvent.setup()
    const callbacks = renderEditor({
      certificationRecords: [{
        id: "cert-01",
        certificateName: "산업안전기사",
        grade: "기사",
        acquiredOn: "2025-11-10",
        issuer: "한국산업인력공단",
        reviewStatus: "pending",
        sourceLabel: "본인 입력",
        updatedAtLabel: "2026. 07. 15. 12:00",
      }],
    })

    await user.click(screen.getByRole("button", {
      name: "샘플 엔지니어 01 산업안전기사 자격증 삭제",
    }))
    expect(screen.getByText("입력한 환산 점수는 변경되지 않습니다.", { exact: false })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "삭제" }))

    expect(callbacks.onDeleteCertificationRecord).toHaveBeenCalledWith("cert-01")
  })

  it("shows the operator review queue and verifies an engineer-authored record", async () => {
    // Given
    const user = userEvent.setup()
    const callbacks = renderEditor({
      languageRecords: [{
        id: "language-01",
        examName: "OPIc",
        result: "IH",
        acquiredOn: "2026-06-01",
        note: null,
        reviewStatus: "pending",
        sourceLabel: "본인 입력",
        updatedAtLabel: "2026. 07. 15. 12:00",
      }],
    })

    // When
    await user.click(screen.getByRole("button", {
      name: "샘플 엔지니어 01 OPIc 어학 성적 검토 완료",
    }))

    // Then
    expect(screen.getByText("검토 대기 1건")).toBeInTheDocument()
    expect(callbacks.onVerifySourceRecord).toHaveBeenCalledWith("language-01", "language")
  })
})
