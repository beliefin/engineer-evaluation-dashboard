import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import type { RelativeRankingCandidate } from "@/view-models/relative-ranking"

import { RelativeRankingSection } from "./relative-ranking-section"

function createCandidates(): readonly RelativeRankingCandidate[] {
  return [
    ...Array.from({ length: 10 }, (_, index): RelativeRankingCandidate => ({
      engineerId: `engineer-${index + 1}`,
      engineerName: `엔지니어 ${index + 1}`,
      employeeCode: String(2000 + index),
      team: index < 5 ? "생산 1팀" : "생산 2팀",
      department: index < 5 ? "전자약품담당" : "ECH1담당",
      position: "프로",
      score: 60 + index * 3,
      scoreStatus: index === 4 ? "partial" : "confirmed",
      completedTaskCount: index === 4 ? 2 : 3,
      taskCount: 3,
    })),
    {
      engineerId: "engineer-none",
      engineerName: "미진행 엔지니어",
      employeeCode: "2999",
      team: "생산 2팀",
      department: "ECH2담당",
      position: "프로",
      score: null,
      scoreStatus: "none",
      completedTaskCount: 0,
      taskCount: 3,
    },
  ]
}

function metricValue(label: string): Element | null {
  return screen.getByText(label, { selector: "dt" }).nextElementSibling
}

describe("RelativeRankingSection", () => {
  afterEach(() => cleanup())

  it("selects every scored engineer and recalculates bands when one is excluded", async () => {
    const user = userEvent.setup()
    render(<RelativeRankingSection candidates={createCandidates()} seasonLabel="2026년 엔지니어 역량평가" />)

    expect(metricValue("선택 인원")).toHaveTextContent("10명")
    expect(metricValue("S/A")).toHaveTextContent("3명")
    expect(metricValue("B")).toHaveTextContent("5명")
    expect(metricValue("C")).toHaveTextContent("2명")

    await user.click(screen.getByRole("checkbox", { name: "엔지니어 10 분석 포함" }))

    expect(metricValue("선택 인원")).toHaveTextContent("9명")
    expect(metricValue("S/A")).toHaveTextContent("3명")
    expect(metricValue("B")).toHaveTextContent("4명")
    expect(metricValue("C")).toHaveTextContent("2명")
    expect(metricValue("S/A 진입")).toHaveTextContent("78.0점")
    expect(metricValue("B 진입")).toHaveTextContent("66.0점")
    expect(metricValue("S/A 경계차")).toHaveTextContent("3.0점")
    expect(metricValue("C/B 경계차")).toHaveTextContent("3.0점")
  })

  it("labels partial scores and prevents no-score people from being selected", () => {
    render(<RelativeRankingSection candidates={createCandidates()} seasonLabel="2026년 엔지니어 역량평가" />)

    expect(screen.getAllByText("부분점수").length).toBeGreaterThan(0)
    expect(screen.getByRole("checkbox", { name: "미진행 엔지니어 분석 포함" })).toBeDisabled()
    expect(screen.getByText("점수 없음")).toBeInTheDocument()
  })
})
