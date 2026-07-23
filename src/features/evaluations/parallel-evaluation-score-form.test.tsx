import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ParallelEvaluationScoreForm } from "./parallel-evaluation-score-form"
import type { EvaluationScoreFormProps, EvaluationScoreFormViewModel } from "./types"

afterEach(cleanup)

function makeViewModel(
  assignmentId: string,
  engineerName: string,
  value: number | null,
): EvaluationScoreFormViewModel {
  return {
    assignmentId,
    cycleLabel: "2026년 엔지니어 역량평가",
    categoryLabel: "OTS 시나리오 제작",
    description: "동시 발표 평가",
    method: "evaluator_score",
    engineerName,
    teamName: "생산 1팀",
    evaluatorName: "박평가",
    proxyEntry: false,
    submitted: false,
    unlockRequestPending: false,
    items: [
      {
        id: "task-ots-item-01",
        index: 1,
        label: "시나리오 목적 및 현장 가치",
        section: "기획",
        criteria: [{ score: 9, description: "실무 가치를 완벽히 입증함." }],
        value,
      },
    ],
    passResult: null,
    autosaveStatus: "saved",
    lastSavedAtLabel: "오후 2:31",
    submittedAtLabel: null,
    locked: false,
  }
}

function makeColumn(
  assignmentId: string,
  engineerName: string,
  value: number | null,
  onScoreChange: EvaluationScoreFormProps["onScoreChange"],
): EvaluationScoreFormProps {
  return {
    viewModel: makeViewModel(assignmentId, engineerName, value),
    onScoreChange,
    onScoresChange: vi.fn(),
    onPassResultChange: vi.fn(),
    onSave: vi.fn(),
    onSubmit: vi.fn(),
    onRequestUnlock: vi.fn(),
  }
}

describe("ParallelEvaluationScoreForm", () => {
  it("공통 문항 한 행에서 두 발표자의 점수를 독립적으로 입력한다", async () => {
    const user = userEvent.setup()
    const onLeftScoreChange = vi.fn()
    const onRightScoreChange = vi.fn()

    render(
      <ParallelEvaluationScoreForm
        left={makeColumn("assignment-left", "김하늘", 8, onLeftScoreChange)}
        right={makeColumn("assignment-right", "이바다", null, onRightScoreChange)}
      />,
    )

    expect(screen.getAllByText("시나리오 목적 및 현장 가치")).toHaveLength(1)
    expect(screen.getByRole("columnheader", { name: /김하늘/ })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: /이바다/ })).toBeInTheDocument()

    const leftInput = screen.getByRole("textbox", {
      name: "김하늘 · 시나리오 목적 및 현장 가치 점수",
    })
    const rightInput = screen.getByRole("textbox", {
      name: "이바다 · 시나리오 목적 및 현장 가치 점수",
    })
    expect(leftInput).toHaveValue("8")
    expect(rightInput).toHaveValue("")

    await user.type(rightInput, "7")

    expect(onRightScoreChange).toHaveBeenLastCalledWith("task-ots-item-01", 7)
    expect(onLeftScoreChange).not.toHaveBeenCalled()
  })
})
