import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import { CompletedRanking } from "./completed-ranking"
import { CategoryAverageChart } from "./category-average-chart"
import { EngineerEvaluationProgress } from "./engineer-evaluation-progress"
import { ScoreDistributionChart } from "./score-distribution-chart"
import type {
  CategoryAverageDatum,
  CompletedRankingRow,
  EngineerEvaluationProgressRow,
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

const CATEGORY_AVERAGES: readonly CategoryAverageDatum[] = [
  {
    id: "task-growth",
    label: "성장탐구계획서",
    weightedScore: 82.4,
    unweightedScore: 79.1,
    sampleSize: 11,
  },
]

const PROGRESS_ROWS: readonly EngineerEvaluationProgressRow[] = [
  {
    id: "engineer-1",
    href: "/engineers/detail?engineerId=engineer-1",
    name: "가상 엔지니어 1",
    employeeCode: "0001",
    team: "생산 1팀",
    status: "in_progress",
    completedTaskCount: 1,
    taskCount: 2,
    tasks: [
      {
        taskId: "task-growth",
        label: "성장탐구계획서",
        weight: 35,
        status: "complete",
        score: 82.4,
        completedEvaluatorCount: 2,
        evaluatorCount: 2,
      },
      {
        taskId: "task-language",
        label: "어학",
        weight: 10,
        status: "not_started",
        score: null,
        completedEvaluatorCount: null,
        evaluatorCount: null,
      },
    ],
  },
]

describe("dashboard presentation", () => {
  afterEach(() => cleanup())

  it("shows weighted and unweighted task averages with the same sample", () => {
    render(
      <CategoryAverageChart
        title="과제별 평균"
        description="완료된 과제만 집계"
        data={CATEGORY_AVERAGES}
      />
    )

    expect(screen.getAllByText("가중 평균").length).toBeGreaterThan(0)
    expect(screen.getAllByText("비가중 평균").length).toBeGreaterThan(0)
    expect(screen.getByText("82.4점")).toBeInTheDocument()
    expect(screen.getByText("79.1점")).toBeInTheDocument()
    expect(screen.getByText("11명")).toBeInTheDocument()
  })

  it("shows each engineer task completion and evaluator submission counts", () => {
    render(
      <EngineerEvaluationProgress
        rows={PROGRESS_ROWS}
        tasks={[
          { id: "task-growth", label: "성장탐구계획서" },
          { id: "task-language", label: "어학" },
        ]}
      />
    )

    expect(screen.getAllByText("가상 엔지니어 1").length).toBeGreaterThan(0)
    expect(screen.getAllByText("평가 완료").length).toBeGreaterThan(0)
    expect(screen.getAllByText("미진행").length).toBeGreaterThan(0)
    expect(screen.getAllByText(/평가자 2\/2/).length).toBeGreaterThan(0)
  })

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
