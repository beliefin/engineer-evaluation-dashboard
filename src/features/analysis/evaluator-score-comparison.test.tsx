import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EvaluatorScoreComparison } from "./evaluator-score-comparison"
import type {
  EvaluatorCalibrationDatum,
  EvaluatorScoreComparisonDatum,
} from "./types"

const comparisons: readonly EvaluatorScoreComparisonDatum[] = [
  {
    taskId: "task-growth",
    taskLabel: "성장 과제",
    engineerId: "engineer-1",
    engineerLabel: "엔지니어 1",
    teamLabel: "생산 1팀",
    consensusScore: 80,
    minimumScore: 70,
    maximumScore: 100,
    scoreRange: 30,
    submittedCount: 3,
    outlierCount: 1,
    observations: [
      { evaluatorId: "evaluator-1", evaluatorLabel: "평가자 1", score: 100, deltaFromConsensus: 20, isOutlier: true },
      { evaluatorId: "evaluator-2", evaluatorLabel: "평가자 2", score: 70, deltaFromConsensus: -10, isOutlier: true },
      { evaluatorId: "evaluator-3", evaluatorLabel: "평가자 3", score: 70, deltaFromConsensus: -10, isOutlier: true },
    ],
  },
  {
    taskId: "task-growth",
    taskLabel: "성장 과제",
    engineerId: "engineer-2",
    engineerLabel: "엔지니어 2",
    teamLabel: "생산 2팀",
    consensusScore: 82,
    minimumScore: 80,
    maximumScore: 84,
    scoreRange: 4,
    submittedCount: 2,
    outlierCount: 0,
    observations: [
      { evaluatorId: "evaluator-1", evaluatorLabel: "평가자 1", score: 80, deltaFromConsensus: -2, isOutlier: false },
      { evaluatorId: "evaluator-2", evaluatorLabel: "평가자 2", score: 84, deltaFromConsensus: 2, isOutlier: false },
    ],
  },
]

const calibrations: readonly EvaluatorCalibrationDatum[] = [
  {
    taskId: "task-growth",
    taskLabel: "성장 과제",
    evaluatorId: "evaluator-1",
    evaluatorLabel: "평가자 1",
    averageScore: 90,
    meanSignedDelta: 9,
    meanAbsoluteDelta: 11,
    comparisonCount: 2,
    outlierCount: 1,
  },
]

describe("EvaluatorScoreComparison", () => {
  it("updates the visible score comparison when an engineer is unchecked", () => {
    render(
      <EvaluatorScoreComparison
        calibrations={calibrations}
        comparisons={comparisons}
        outlierThreshold={10}
      />,
    )

    expect(screen.getByText("비교할 엔지니어를 하나 이상 선택해 주세요.")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("checkbox", { name: "엔지니어 1 선택" }))

    expect(screen.getByRole("img", { name: /엔지니어 1 평가자 원점수 범위/ })).toBeInTheDocument()
    expect(screen.getByText("이상 편차 1건")).toBeInTheDocument()
    expect(screen.getByText("높게 평가 경향")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("checkbox", { name: "엔지니어 1 선택" }))

    expect(screen.queryByRole("img", { name: /엔지니어 1 평가자 원점수 범위/ })).not.toBeInTheDocument()
    expect(screen.getByText("비교할 엔지니어를 하나 이상 선택해 주세요.")).toBeInTheDocument()
  })
})
