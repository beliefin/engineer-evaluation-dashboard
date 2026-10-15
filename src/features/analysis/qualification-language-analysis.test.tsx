import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { QualificationLanguageAnalysis } from "./qualification-language-analysis"

describe("qualification and language source analysis", () => {
  it("shows actual certification holdings, current-year acquisitions, and language results", () => {
    const { rerender } = render(
      <QualificationLanguageAnalysis
        data={{
          evaluationYear: "2026",
          eligibleEngineerCount: 10,
          certificationRecordedEngineerCount: 7,
          certificationNoScoreEngineerCount: 1,
          certificationUnreportedEngineerCount: 2,
          certificationTypeCount: 2,
          certificationAcquiredThisYearEngineerCount: 3,
          certificationHoldings: [
            { certificateName: "산업안전기사", holderCount: 4, acquiredThisYearCount: 2, shareOfRecordedEngineers: 57.1 },
            { certificateName: "가스기사", holderCount: 2, acquiredThisYearCount: 1, shareOfRecordedEngineers: 28.6 },
          ],
          languageRecordedEngineerCount: 6,
          languageNoScoreEngineerCount: 2,
          languageUnreportedEngineerCount: 2,
          languageExamCount: 2,
          languageAcquiredThisYearEngineerCount: 2,
          languageResults: [
            { key: "english:영어:OPIc:IH", scopeLabel: "영어", examName: "OPIc", result: "IH", holderCount: 3, shareOfRecordedEngineers: 50 },
            { key: "second_language:일본어:OPIc:IM2", scopeLabel: "일본어", examName: "OPIc", result: "IM2", holderCount: 1, shareOfRecordedEngineers: 16.7 },
          ],
        }}
      />,
    )

    expect(screen.getByRole("heading", { name: "자격·어학 원천 내역" })).toBeInTheDocument()
    expect(screen.getByText("산업안전기사")).toBeInTheDocument()
    expect(screen.getByText("2026년 신규 2명")).toBeInTheDocument()
    expect(screen.getByText("영어 · OPIc")).toBeInTheDocument()
    expect(screen.getByText("IH")).toBeInTheDocument()
    const languagePanel = screen.getByRole("heading", {
      name: "어학 시험·성적 분포",
    }).closest("article")
    expect(languagePanel).toHaveTextContent("없음 응답 2명 · 미입력 2명")

    rerender(
      <QualificationLanguageAnalysis
        data={{
          evaluationYear: "2026",
          eligibleEngineerCount: 10,
          certificationRecordedEngineerCount: 0,
          certificationNoScoreEngineerCount: 0,
          certificationUnreportedEngineerCount: 10,
          certificationTypeCount: 0,
          certificationAcquiredThisYearEngineerCount: 0,
          certificationHoldings: [],
          languageRecordedEngineerCount: 0,
          languageNoScoreEngineerCount: 0,
          languageUnreportedEngineerCount: 10,
          languageExamCount: 0,
          languageAcquiredThisYearEngineerCount: 0,
          languageResults: [],
        }}
      />,
    )
    expect(screen.getByText("현재 필터에 실제 자격증 기록이 없습니다.")).toBeVisible()
    expect(screen.getByText("현재 필터에 실제 어학 성적 기록이 없습니다.")).toBeVisible()
  })
})

describe("qualification and language source analysis expansion", () => {
  it("keeps long lists compact until the user asks to see more", async () => {
    const user = userEvent.setup()
    const certificationHoldings = Array.from({ length: 5 }, (_, index) => ({
      certificateName: `cert-${index + 1}`,
      holderCount: 5 - index,
      acquiredThisYearCount: 0,
      shareOfRecordedEngineers: 20,
    }))
    const languageResults = Array.from({ length: 5 }, (_, index) => ({
      key: `english:exam:${index + 1}`,
      scopeLabel: "English",
      examName: "Exam",
      result: String(index + 1),
      holderCount: 5 - index,
      shareOfRecordedEngineers: 20,
    }))
    render(<QualificationLanguageAnalysis data={{
      evaluationYear: "2026",
      eligibleEngineerCount: 5,
      certificationRecordedEngineerCount: 5,
      certificationNoScoreEngineerCount: 0,
      certificationUnreportedEngineerCount: 0,
      certificationTypeCount: 5,
      certificationAcquiredThisYearEngineerCount: 0,
      certificationHoldings,
      languageRecordedEngineerCount: 5,
      languageNoScoreEngineerCount: 0,
      languageUnreportedEngineerCount: 0,
      languageExamCount: 5,
      languageAcquiredThisYearEngineerCount: 0,
      languageResults,
    }} />)

    expect(screen.queryByText("cert-5")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "더 보기" }))
    expect(screen.getByText("cert-5")).toBeVisible()
    expect(screen.getByRole("button", { name: "접기" })).toHaveAttribute("aria-expanded", "true")
  })
})
