import { render, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CompletedRanking } from "./completed-ranking"
import type {
  CompletedRankingRow,
  RankingSortState,
} from "./dashboard-view-models"

const RANKING_ROWS: readonly CompletedRankingRow[] = [
  {
    id: "engineer-high",
    href: "/engineers/engineer-high",
    rank: 1,
    name: "가상 엔지니어 고득점",
    team: "공정기술팀",
    totalScore: 92.4,
    status: "confirmed",
  },
  {
    id: "engineer-low",
    href: "/engineers/engineer-low",
    rank: 2,
    name: "가상 엔지니어 저득점",
    team: "설비기술팀",
    totalScore: 84.2,
    status: "confirmed",
  },
  {
    id: "engineer-middle",
    href: "/engineers/engineer-middle",
    rank: 3,
    name: "가상 엔지니어 중간점수",
    team: "인프라기술팀",
    totalScore: 88.5,
    status: "confirmed",
    isTied: true,
  },
  {
    id: "engineer-pending",
    href: "/engineers/engineer-pending",
    rank: null,
    name: "가상 엔지니어 미진행",
    team: "공정기술팀",
    totalScore: null,
    status: "not_started",
  },
]

describe("completed ranking sorting", () => {
  it("recalculates ranks after an engineer is excluded from the population", async () => {
    const user = userEvent.setup()
    const view = render(
      <CompletedRanking
        description="선택 인원 기준 현재 순위"
        populationSelectable
        rows={RANKING_ROWS}
        title="전체 종합 순위"
      />
    )

    await user.click(within(view.container).getByRole("button", { name: "순위 대상 관리" }))
    await user.click(within(document.body).getByRole("checkbox", { name: "가상 엔지니어 고득점 순위 포함" }))
    await user.click(within(document.body).getByRole("button", { name: "확인" }))

    const table = within(view.container).getByRole("table")
    expect(within(table).queryByText("가상 엔지니어 고득점")).not.toBeInTheDocument()
    expect(within(table).getByText("가상 엔지니어 중간점수").closest("tr")).toHaveTextContent("1위")
  })

  it("orders visible desktop rows by total score when the total header is selected", async () => {
    const user = userEvent.setup()
    const view = render(
      <CompletedRanking
        title="완료자 순위"
        description="최종 점수가 확정된 엔지니어"
        rows={RANKING_ROWS}
      />
    )
    const table = within(view.container).getByRole("table")
    const givenInitialOrder = within(table)
      .getAllByRole("link")
      .map((link) => link.textContent)

    expect(givenInitialOrder).toEqual([
      "가상 엔지니어 고득점",
      "가상 엔지니어 저득점",
      "가상 엔지니어 중간점수",
      "가상 엔지니어 미진행",
    ])

    await user.click(
      within(table).getByRole("button", {
        name: /^종합 점수, 현재 정렬 안 됨/,
      })
    )

    const sortedOrder = within(table)
      .getAllByRole("link")
      .map((link) => link.textContent)
    expect(sortedOrder).toEqual([
      "가상 엔지니어 저득점",
      "가상 엔지니어 중간점수",
      "가상 엔지니어 고득점",
      "가상 엔지니어 미진행",
    ])
  })

  it("restores controlled sorting from the provided state", () => {
    // Given
    const view = render(
      <CompletedRanking
        title="Completed ranking"
        description="Confirmed engineers"
        rows={RANKING_ROWS}
        sorting={{ key: "totalScore", direction: "asc" }}
      />
    )
    const table = within(view.container).getByRole("table")

    // When
    const orderedHrefs = within(table)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))

    // Then
    expect(orderedHrefs).toEqual([
      "/engineers/engineer-low",
      "/engineers/engineer-middle",
      "/engineers/engineer-high",
      "/engineers/engineer-pending",
    ])
  })

  it("reports descending direction when the controlled ascending column is selected", async () => {
    // Given
    const user = userEvent.setup()
    const onSortingChange = vi.fn<(next: RankingSortState) => void>()
    const view = render(
      <CompletedRanking
        title="Completed ranking"
        description="Confirmed engineers"
        rows={RANKING_ROWS}
        sorting={{ key: "totalScore", direction: "asc" }}
        onSortingChange={onSortingChange}
      />
    )
    const table = within(view.container).getByRole("table")
    // When
    await user.click(within(table).getByRole("button", { name: /^종합 점수/ }))

    // Then
    expect(onSortingChange).toHaveBeenCalledWith({
      key: "totalScore",
      direction: "desc",
    })
  })
})
