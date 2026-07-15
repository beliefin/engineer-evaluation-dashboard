import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EvaluatorDeviationChart } from "./evaluator-deviation-chart"
import { TeamTaskPerformanceMatrix } from "./team-task-performance-matrix"

describe("analysis visual fallbacks", () => {
  it("explains an all-zero evaluator deviation instead of rendering an empty chart", () => {
    render(
      <EvaluatorDeviationChart
        data={[{
          evaluatorId: "evaluator-1",
          evaluatorLabel: "평가자 1",
          averageScore: 80,
          meanAbsoluteDeviation: 0,
          sheetCount: 3,
        }]}
      />,
    )

    expect(screen.getByText("모든 평가자 편차 0.0점")).toBeInTheDocument()
  })

  it("labels the team matrix as a keyboard-scrollable region", () => {
    render(
      <TeamTaskPerformanceMatrix
        data={[{
          teamId: "생산 1팀",
          teamLabel: "생산 1팀",
          taskId: "task-1",
          taskLabel: "성장 과제",
          metric: "score",
          score: 82,
          overallScore: 80,
          delta: 2,
          completedCount: 10,
        }]}
      />,
    )

    expect(screen.getByText("↔ 좌우로 스크롤해 모든 과제 보기")).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "팀별 과제 성과표 가로 스크롤 영역" }))
      .toHaveAttribute("tabindex", "0")
  })
})
