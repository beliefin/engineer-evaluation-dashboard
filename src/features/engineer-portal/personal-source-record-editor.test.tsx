import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PersonalSourceRecordEditor } from "./personal-source-record-editor"

afterEach(cleanup)

describe("PersonalSourceRecordEditor", () => {
  it("saves a language record for the linked engineer and explains deferred conversion", async () => {
    // Given
    const onSaveLanguageRecord = vi.fn(() => true)
    render(
      <PersonalSourceRecordEditor
        certificationRecords={[]}
        disabled={false}
        engineerId="engineer-01"
        engineerName="샘플 엔지니어 01"
        languageRecords={[]}
        onDeleteCertificationRecord={vi.fn(() => true)}
        onDeleteLanguageRecord={vi.fn(() => true)}
        onSaveCertificationRecord={vi.fn(() => true)}
        onSaveLanguageRecord={onSaveLanguageRecord}
      />,
    )
    const user = userEvent.setup()

    // When
    await user.click(screen.getByRole("button", { name: "어학 성적 추가" }))
    await user.type(screen.getByLabelText("시험명"), "OPIc")
    await user.type(screen.getByLabelText("점수 또는 등급"), "IH")
    await user.click(screen.getByRole("button", { name: "저장" }))

    // Then
    expect(screen.getByText("환산식 미적용")).toBeInTheDocument()
    expect(onSaveLanguageRecord).toHaveBeenCalledWith({
      recordId: null,
      engineerId: "engineer-01",
      examName: "OPIc",
      result: "IH",
      acquiredOn: null,
      note: null,
    })
  })

  it("shows that an engineer-authored record is waiting for operator review", () => {
    // Given
    render(
      <PersonalSourceRecordEditor
        certificationRecords={[]}
        disabled={false}
        engineerId="engineer-01"
        engineerName="샘플 엔지니어 01"
        languageRecords={[{
          id: "language-01",
          examName: "OPIc",
          result: "IH",
          acquiredOn: "2026-06-01",
          note: null,
          reviewStatus: "pending",
          sourceLabel: "본인 입력",
          updatedAtLabel: "2026. 07. 15. 12:00",
        }]}
        onDeleteCertificationRecord={vi.fn(() => true)}
        onDeleteLanguageRecord={vi.fn(() => true)}
        onSaveCertificationRecord={vi.fn(() => true)}
        onSaveLanguageRecord={vi.fn(() => true)}
      />,
    )

    // Then
    expect(screen.getByText("운영자 검토 대기")).toBeInTheDocument()
    expect(screen.getByText("본인 입력 · 2026. 07. 15. 12:00")).toBeInTheDocument()
  })
})
