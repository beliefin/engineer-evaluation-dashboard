import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import type { RelativeRankingCandidate } from "@/view-models/relative-ranking"

import { RelativeRankingSection } from "./relative-ranking-section"

const CANDIDATES: readonly RelativeRankingCandidate[] = [
  {
    engineerId: "engineer-a",
    engineerName: "Engineer A",
    employeeCode: "1001",
    team: "Team A",
    department: "Department A",
    position: "Engineer",
    score: 80,
    scoreStatus: "confirmed",
    completedTaskCount: 2,
    taskCount: 2,
  },
  {
    engineerId: "engineer-b",
    engineerName: "Engineer B",
    employeeCode: "1002",
    team: "Team B",
    department: "Department B",
    position: "Engineer",
    score: 70,
    scoreStatus: "confirmed",
    completedTaskCount: 2,
    taskCount: 2,
  },
]

function renderRanking(accountId = "account-a", cycleId = "cycle-a") {
  return render(
    <RelativeRankingSection
      accountId={accountId}
      candidates={CANDIDATES}
      cycleId={cycleId}
      seasonLabel="Season A"
    />,
  )
}

describe("relative ranking selection persistence", () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(cleanup)

  it("restores only an explicitly saved selection after a reload", async () => {
    // Given
    const user = userEvent.setup()
    const firstRender = renderRanking()

    // When
    await user.click(screen.getByRole("checkbox", { name: "Engineer B 분석 포함" }))
    await user.click(screen.getByRole("button", { name: "선택 저장" }))
    firstRender.unmount()
    renderRanking()

    // Then
    expect(screen.getByRole("checkbox", { name: "Engineer A 분석 포함" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Engineer B 분석 포함" })).not.toBeChecked()
  })

  it("keeps an explicitly saved empty selection and scopes it by account and season", async () => {
    // Given
    const user = userEvent.setup()
    const firstRender = renderRanking()

    // When
    await user.click(screen.getByRole("button", { name: "전체 해제" }))
    await user.click(screen.getByRole("button", { name: "선택 저장" }))
    firstRender.unmount()
    renderRanking()

    // Then
    expect(screen.getByRole("checkbox", { name: "Engineer A 분석 포함" })).not.toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Engineer B 분석 포함" })).not.toBeChecked()

    cleanup()
    renderRanking("account-b", "cycle-a")
    expect(screen.getByRole("checkbox", { name: "Engineer A 분석 포함" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Engineer B 분석 포함" })).toBeChecked()
  })
})
