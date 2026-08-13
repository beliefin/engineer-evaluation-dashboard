import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { EngineerEvaluationStoryViewModel } from "./engineer-detail.types"
import { EngineerEvaluationStory } from "./engineer-evaluation-story"

const STORY: EngineerEvaluationStoryViewModel = {
  score: 84.25,
  scoreLabel: "최종 점수",
  rank: 3,
  cohortCount: 20,
  topPercentile: 15,
  strongestCategory: {
    key: "growth",
    label: "성장탐구계획서",
    score: 91,
    differenceFromAverage: 8.5,
  },
  improvementCategory: {
    key: "language",
    label: "어학",
    score: 60,
    differenceFromAverage: -4.2,
  },
  profile: [
    { key: "growth", label: "성장탐구계획서", score: 91, averageScore: 82.5 },
    { key: "dx", label: "DX 툴 활용", score: 86, averageScore: 78 },
    { key: "language", label: "어학", score: 60, averageScore: 64.2 },
  ],
  taskComparisons: [
    {
      key: "growth",
      label: "성장탐구계획서",
      ownScore: 91,
      averageScore: 82.5,
      topQuartileAverage: 92.4,
      sampleSize: 20,
    },
  ],
}

describe("EngineerEvaluationStory", () => {
  it("shows score position, strengths, profile fallback, and task comparison values", () => {
    render(<EngineerEvaluationStory story={STORY} />)

    expect(screen.getByRole("heading", { name: "한 명의 평가 스토리" })).toBeInTheDocument()
    expect(screen.getByText("84.25점")).toBeInTheDocument()
    expect(screen.getByText("3위")).toBeInTheDocument()
    expect(screen.getByText("상위 15.0%")).toBeInTheDocument()
    expect(screen.getByText("전체 평균보다 8.5점 높음")).toBeInTheDocument()
    expect(screen.getByText("전체 평균보다 4.2점 낮음")).toBeInTheDocument()
    const comparison = within(screen.getByRole("article"))
    expect(comparison.getByRole("heading", { name: "성장탐구계획서" })).toBeInTheDocument()
    expect(comparison.getByText("91.0점")).toBeInTheDocument()
    expect(comparison.getByText("82.5점")).toBeInTheDocument()
    expect(comparison.getByText("92.4점")).toBeInTheDocument()
    expect(comparison.getByText("상위 25%")).toBeInTheDocument()
  })
})
