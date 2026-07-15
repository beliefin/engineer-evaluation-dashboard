import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CompletedRanking } from "./completed-ranking"
import { ScoreDistributionChart } from "./score-distribution-chart"
import type {
  CompletedRankingRow,
  ScoreDistributionDatum,
} from "./dashboard-view-models"

const DISTRIBUTION: readonly ScoreDistributionDatum[] = [
  { range: "0~59", count: 1 },
  { range: "60~69", count: 2 },
  { range: "70~79", count: 3 },
  { range: "80~89", count: 4 },
  { range: "90~100", count: 5 },
]

const ROWS: readonly CompletedRankingRow[] = [
  {
    id: "engineer-1",
    href: "/engineers/engineer-1",
    rank: 1,
    name: "가상 엔지니어 1",
    team: "공정기술팀",
    totalScore: 91.05,
    status: "confirmed",
  },
  {
    id: "engineer-2",
    href: "/engineers/engineer-2",
    rank: 2,
    name: "가상 엔지니어 2",
    team: "설비기술팀",
    totalScore: 87.1,
    status: "tied",
  },
]

describe("dashboard presentation", () => {
  it("keeps weighted score bins inside the 0 to 100 range", () => {
    render(
      <ScoreDistributionChart
        title="가중 총점 분포"
        description="완료자만 포함"
        data={DISTRIBUTION}
      />
    )

    expect(screen.getByText("0~59점")).toBeInTheDocument()
    expect(screen.getByText("90~100점")).toBeInTheDocument()
    expect(screen.getByText("분포 표 데이터 보기")).toBeInTheDocument()
  })

  it("filters the completed ranking by engineer name", async () => {
    const user = userEvent.setup()
    render(
      <CompletedRanking
        title="완료자 순위"
        description="최종 점수가 확정된 엔지니어"
        rows={ROWS}
      />
    )
    const searchInputs = screen.getAllByRole("searchbox", {
      name: "이름 검색",
    })
    const searchInput = searchInputs[0]

    if (!searchInput) {
      throw new Error("Ranking search input was not rendered")
    }

    await user.type(searchInput, "엔지니어 2")

    expect(screen.queryByText("가상 엔지니어 1")).not.toBeInTheDocument()
    expect(screen.getAllByText("가상 엔지니어 2")).toHaveLength(2)
    expect(screen.getAllByText("검색 결과 1명")).toHaveLength(2)
  })
})
