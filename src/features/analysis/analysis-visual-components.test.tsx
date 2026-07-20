import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EvaluatorDeviationChart } from "./evaluator-deviation-chart"
import { RubricItemChart } from "./rubric-item-chart"
import { TeamTaskPerformanceMatrix } from "./team-task-performance-matrix"

describe("analysis visual fallbacks", () => {
  it("separates rubric averages and evaluator deviations by task", () => {
    render(
      <>
        <RubricItemChart
          data={[
            { taskId: "task-growth", taskLabel: "성장 과제", itemNumber: 1, label: "기획", score: 80, responseCount: 3 },
            { taskId: "task-dx", taskLabel: "DX 과제", itemNumber: 1, label: "활용", score: 90, responseCount: 3 },
          ]}
        />
        <EvaluatorDeviationChart
          data={[
            { taskId: "task-growth", taskLabel: "성장 과제", evaluatorId: "evaluator-1", evaluatorLabel: "평가자 1", averageScore: 80, meanAbsoluteDeviation: 2, sheetCount: 3 },
            { taskId: "task-dx", taskLabel: "DX 과제", evaluatorId: "evaluator-1", evaluatorLabel: "평가자 1", averageScore: 90, meanAbsoluteDeviation: 3, sheetCount: 3 },
          ]}
        />
      </>,
    )

    expect(screen.getAllByRole("heading", { name: "성장 과제" })).toHaveLength(2)
    expect(screen.getAllByRole("heading", { name: "DX 과제" })).toHaveLength(2)
  })

  it("explains an all-zero evaluator deviation instead of rendering an empty chart", () => {
    render(
      <EvaluatorDeviationChart
        data={[{
          taskId: "task-growth",
          taskLabel: "성장 과제",
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
