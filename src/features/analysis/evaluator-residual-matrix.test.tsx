import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EvaluatorResidualMatrix } from "./evaluator-residual-matrix"
import type { EvaluatorResidualDatum } from "./types"

const evaluatorScores = [
  ["evaluator-kim", "김영래", 70],
  ["evaluator-park-ju", "박주현", 80],
  ["evaluator-kang", "강귀봉", 90],
  ["evaluator-park-gyeong", "박경철", 100],
  ["evaluator-park-sang", "박상홍", 60],
] as const

const residuals: readonly EvaluatorResidualDatum[] = evaluatorScores.map(
  ([evaluatorId, evaluatorLabel, score]) => ({
    taskId: "task-growth",
    taskLabel: "성장 과제",
    engineerId: "engineer-1",
    engineerLabel: "엔지니어 1",
    teamLabel: "생산 1팀",
    evaluatorId,
    evaluatorLabel,
    score,
    leaveOneOutAverage: 80,
    residual: score - 80,
    isOutlier: Math.abs(score - 80) >= 10,
  }),
)

describe("EvaluatorResidualMatrix", () => {
  it("shows the engineer average before pinned evaluator columns", () => {
    render(
      <EvaluatorResidualMatrix
        data={residuals}
        outlierThreshold={10}
        taskLabel="성장 과제"
      />,
    )

    const table = screen.getByRole("table")
    const headers = within(table)
      .getAllByRole("columnheader")
      .map((header) => header.textContent)

    expect(headers).toEqual([
      "엔지니어",
      "엔지니어 평균",
      "박경철",
      "박상홍",
      "박주현",
      "강귀봉",
      "김영래",
    ])
    expect(within(table).getByRole("cell", { name: "엔지니어 1 평균 점수 80.0점" }))
      .toHaveTextContent("80.0점")
  })
})
