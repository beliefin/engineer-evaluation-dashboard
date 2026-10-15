import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { CategoryScoreViewModel, EngineerEvaluationStoryViewModel } from "./engineer-detail.types"
import { EngineerSelectedInsights } from "./engineer-selected-insights"

const categories: readonly CategoryScoreViewModel[] = [
  { key: "complete", label: "확정 과제", status: "complete", rawScore: 80, contribution: 28, reflectionRatioPercent: 35, maxContribution: 35 },
  { key: "pending", label: "미확정 과제", status: "in_progress", rawScore: null, contribution: null, reflectionRatioPercent: 15, maxContribution: 15 },
  { key: "proposal", label: "고등급 제안", status: "complete", rawScore: 120, contribution: 12, reflectionRatioPercent: 10, maxContribution: 10 },
]

const story: EngineerEvaluationStoryViewModel = {
  score: 75,
  scoreLabel: "최종 점수",
  rank: 1,
  cohortCount: 2,
  topPercentile: 50,
  strongestCategory: null,
  improvementCategory: null,
  profile: [
    { key: "a", label: "분야 A", score: 80, averageScore: 72 },
    { key: "b", label: "분야 B", score: 60, averageScore: 70 },
    { key: "c", label: "분야 C", score: 90, averageScore: 82 },
  ],
  taskComparisons: [
    { key: "a", label: "분야 A", ownScore: 80, averageScore: 72, topQuartileAverage: 88, sampleSize: 4, distribution: { minimum: 50, firstQuartile: 65, median: 72, thirdQuartile: 80, maximum: 95 } },
    { key: "pending", label: "미확정 과제", ownScore: null, averageScore: 70, topQuartileAverage: 80, sampleSize: 3, distribution: { minimum: 55, firstQuartile: 65, median: 70, thirdQuartile: 75, maximum: 80 } },
  ],
}

describe("EngineerSelectedInsights", () => {
  it("shows only the selected score insights and keeps incomplete values out of zero-score displays", () => {
    render(<EngineerSelectedInsights categories={categories} story={story} />)

    expect(screen.getByRole("heading", { name: "개인 역량 프로필" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "분야별 분포와 내 위치" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "항목별 최종 점수 기여도" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "평균 대비 차이" })).toBeInTheDocument()
    expect(screen.getByText("28.00 / 35.00점")).toBeInTheDocument()
    expect(screen.getByText("12.00 / 10.00점")).toBeInTheDocument()
    expect(screen.getByText("미확정 · 산식 반영 전")).toBeInTheDocument()
    expect(screen.getByText("동일 시즌 · 동일 과제 · 동일 평가 방식의 확정 점수 4명 기준 (본인 포함)")).toBeInTheDocument()
    expect(screen.getByText("내 점수 또는 비교 가능한 확정 점수가 없어 차이를 계산하지 않음")).toBeInTheDocument()
  })
})
