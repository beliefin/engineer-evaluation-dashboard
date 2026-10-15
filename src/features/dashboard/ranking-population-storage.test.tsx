import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { CompletedRanking } from "./completed-ranking"
import type { CompletedRankingRow } from "./dashboard-view-models"

const ROWS: readonly CompletedRankingRow[] = [
  { id: "engineer-a", href: "/engineers/a", name: "Engineer A", rank: 1, status: "confirmed", team: "Team A", totalScore: 90 },
  { id: "engineer-b", href: "/engineers/b", name: "Engineer B", rank: 2, status: "confirmed", team: "Team B", totalScore: 80 },
]

const storageKey = "ranking-population-test:account-a:cycle-a"

function renderRanking() {
  return render(
    <CompletedRanking
      description="Ranking"
      populationSelectable
      populationStorageKey={storageKey}
      populationRows={ROWS}
      rows={ROWS}
      title="Ranking"
    />,
  )
}

describe("ranking population persistence", () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(cleanup)

  it("restores only an explicitly saved population after reopening", async () => {
    // Given
    const user = userEvent.setup()
    const firstRender = renderRanking()
    await user.click(screen.getByRole("button", { name: "순위 대상 관리" }))

    // When
    await user.click(screen.getByRole("checkbox", { name: "Engineer B 순위 포함" }))
    await user.click(screen.getByRole("button", { name: "선택 저장" }))
    firstRender.unmount()
    renderRanking()
    await user.click(screen.getByRole("button", { name: "순위 대상 관리" }))

    // Then
    expect(screen.getByRole("checkbox", { name: "Engineer A 순위 포함" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Engineer B 순위 포함" })).not.toBeChecked()
  })
})
