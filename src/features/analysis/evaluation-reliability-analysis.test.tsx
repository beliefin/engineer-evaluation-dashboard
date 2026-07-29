import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EvaluationReliabilityAnalysis } from "./evaluation-reliability-analysis"
import type {
  EvaluationReliabilityDatum,
  EvaluatorExclusionSensitivityDatum,
  EvaluatorResidualDatum,
} from "./types"

const reliability: readonly EvaluationReliabilityDatum[] = [
  {
    taskId: "task-growth",
    taskLabel: "성장 과제",
    engineerId: "engineer-1",
    engineerLabel: "엔지니어 1",
    teamLabel: "생산 1팀",
    consensusScore: 86.7,
    evaluatorCount: 3,
    scoreRange: 20,
    standardDeviation: 9.4,
    leaveOneOutOutlierCount: 3,
    isHighDisagreement: true,
  },
  {
    taskId: "task-growth",
    taskLabel: "성장 과제",
    engineerId: "engineer-2",
    engineerLabel: "엔지니어 2",
    teamLabel: "생산 2팀",
    consensusScore: 82,
    evaluatorCount: 2,
    scoreRange: 4,
    standardDeviation: 2,
    leaveOneOutOutlierCount: 0,
    isHighDisagreement: false,
  },
]

const residuals: readonly EvaluatorResidualDatum[] = [
  {
    taskId: "task-growth",
    taskLabel: "성장 과제",
    engineerId: "engineer-1",
    engineerLabel: "엔지니어 1",
    teamLabel: "생산 1팀",
    evaluatorId: "evaluator-1",
    evaluatorLabel: "평가자 1",
    score: 100,
    leaveOneOutAverage: 80,
    residual: 20,
    isOutlier: true,
  },
  {
    taskId: "task-growth",
    taskLabel: "성장 과제",
    engineerId: "engineer-1",
    engineerLabel: "엔지니어 1",
    teamLabel: "생산 1팀",
    evaluatorId: "evaluator-2",
    evaluatorLabel: "평가자 2",
    score: 80,
    leaveOneOutAverage: 90,
    residual: -10,
    isOutlier: true,
  },
]

const sensitivities: readonly EvaluatorExclusionSensitivityDatum[] = [
  {
    taskId: "task-growth",
    taskLabel: "성장 과제",
    evaluatorId: "evaluator-1",
    evaluatorLabel: "평가자 1",
    cohortCount: 2,
    rows: [
      {
        engineerId: "engineer-1",
        engineerLabel: "엔지니어 1",
        teamLabel: "생산 1팀",
        baselineScore: 86.7,
        excludedScore: 80,
        scoreDelta: -6.7,
        baselineRank: 1,
        excludedRank: 2,
        rankDelta: -1,
        isHighImpact: false,
      },
      {
        engineerId: "engineer-2",
        engineerLabel: "엔지니어 2",
        teamLabel: "생산 2팀",
        baselineScore: 82,
        excludedScore: 84,
        scoreDelta: 2,
        baselineRank: 2,
        excludedRank: 1,
        rankDelta: 1,
        isHighImpact: false,
      },
    ],
  },
]

describe("EvaluationReliabilityAnalysis", () => {
  it("shows independent disagreement, residual, and rank stability panels", () => {
    render(
      <EvaluationReliabilityAnalysis
        outlierThreshold={10}
        rankShiftAlert={2}
        reliability={reliability}
        residuals={residuals}
        sensitivities={sensitivities}
        standardDeviationThreshold={7.5}
      />,
    )

    expect(screen.getByRole("heading", { name: "평가 신뢰도 진단" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "평가 신뢰도 사분면" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "평가자×엔지니어 편차 매트릭스" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "평가자 제외 시 순위 안정성" })).toBeInTheDocument()
    expect(screen.getByText("+20.0점")).toBeInTheDocument()
    expect(screen.getByText("기준 2위 · 제외 후 1위 · 점수 +2.0점")).toBeInTheDocument()
  })
})
