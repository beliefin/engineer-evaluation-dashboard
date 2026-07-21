import { render, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CompletedRanking } from "./completed-ranking"
import type { CompletedRankingRow } from "./dashboard-view-models"

const TEAM_ONE: CompletedRankingRow = {
  id: "team-one", href: "/engineers/team-one", rank: 1, name: "생산1 엔지니어",
  team: "생산 1팀", totalScore: 90, status: "confirmed",
}
const TEAM_TWO: CompletedRankingRow = {
  id: "team-two", href: "/engineers/team-two", rank: 2, name: "생산2 엔지니어",
  team: "생산 2팀", totalScore: 80, status: "confirmed",
}

describe("ranking population persistence", () => {
  it("keeps exclusions while the visible team changes within the same season", async () => {
    const user = userEvent.setup()
    const view = render(
      <CompletedRanking
        description="현재 시즌 순위"
        populationResetKey="season-1"
        populationRows={[TEAM_ONE, TEAM_TWO]}
        populationSelectable
        rows={[TEAM_ONE]}
        title="생산 1팀 종합 순위"
      />,
    )

    await user.click(within(view.container).getByRole("button", { name: "순위 대상 관리" }))
    await user.click(within(document.body).getByRole("checkbox", { name: "생산2 엔지니어 순위 포함" }))
    await user.click(within(document.body).getByRole("button", { name: "확인" }))

    view.rerender(
      <CompletedRanking
        description="현재 시즌 순위"
        populationResetKey="season-1"
        populationRows={[TEAM_ONE, TEAM_TWO]}
        populationSelectable
        rows={[TEAM_TWO]}
        title="생산 2팀 종합 순위"
      />,
    )
    await user.click(within(view.container).getByRole("button", { name: "순위 대상 관리" }))

    expect(within(document.body).getByRole("checkbox", { name: "생산2 엔지니어 순위 포함" })).not.toBeChecked()
    expect(within(document.body).getByRole("checkbox", { name: "생산1 엔지니어 순위 포함" })).toBeChecked()
  })
})
