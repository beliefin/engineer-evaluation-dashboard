import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { EvaluatorAssignmentPanel } from "./evaluator-assignment-panel"

const evaluators = [
  { id: "evaluator-1", name: "평가자 1", employeeCode: "9001" },
  { id: "evaluator-2", name: "평가자 2", employeeCode: "9002" },
  { id: "evaluator-3", name: "평가자 3", employeeCode: "9003" },
] as const

const groups = [{
  engineerId: "engineer-1",
  engineerName: "엔지니어 1",
  employeeLabel: "1001",
  teamName: "생산 1팀",
  taskId: "task-1",
  taskName: "성장탐구계획서",
  assignments: [],
}] as const

const protectedGroups = [{
  engineerId: "engineer-1",
  engineerName: "엔지니어 1",
  employeeLabel: "1001",
  teamName: "생산 1팀",
  taskId: "task-1",
  taskName: "성장탐구계획서",
  assignments: [
    {
      assignmentId: "assignment-1",
      evaluatorId: "evaluator-1",
      evaluatorName: "평가자 1",
      weight: 2,
      normalizedRatio: 2 / 3,
      status: "in_progress",
    },
    {
      assignmentId: "assignment-2",
      evaluatorId: "evaluator-2",
      evaluatorName: "평가자 2",
      weight: 1,
      normalizedRatio: 1 / 3,
      status: "pending",
    },
  ],
}] as const

afterEach(cleanup)

describe("EvaluatorAssignmentPanel", () => {
  it("keeps a rejected preset save open and discards unsaved edits after cancel", async () => {
    const user = userEvent.setup()
    const onSavePreset = vi.fn(() => false)
    render(
      <EvaluatorAssignmentPanel
        disabled={false}
        evaluators={evaluators}
        groups={groups}
        onSave={vi.fn(() => true)}
        onSavePreset={onSavePreset}
        preset={[{
          evaluatorId: "evaluator-1",
          evaluatorName: "평가자 1",
          employeeCode: "9001",
          weight: 2,
          normalizedRatio: 1,
        }]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "고정 멤버 설정" }))
    await user.click(screen.getByLabelText("평가자 2 고정 멤버"))
    await user.click(screen.getByRole("button", { name: "프리셋 저장" }))

    expect(onSavePreset).toHaveBeenCalledWith([
      { evaluatorId: "evaluator-1", weight: 2 },
      { evaluatorId: "evaluator-2", weight: 1 },
    ])
    expect(screen.getByRole("dialog", { name: "고정 평가자 멤버와 가중치" })).toBeVisible()

    await user.click(screen.getByRole("button", { name: "취소" }))
    await user.click(screen.getByRole("button", { name: "고정 멤버 설정" }))
    expect(screen.getByLabelText("평가자 2 고정 멤버")).not.toBeChecked()
    await user.click(screen.getByRole("button", { name: "취소" }))
  })

  it("checks every evaluator when bulk selection is requested", async () => {
    // Given
    const user = userEvent.setup()
    render(
      <EvaluatorAssignmentPanel
        disabled={false}
        evaluators={evaluators}
        groups={protectedGroups}
        onSave={vi.fn(() => true)}
        onSavePreset={vi.fn(() => true)}
        preset={[]}
      />,
    )

    // When
    await user.click(screen.getByRole("button", { name: "전체 선택" }))

    // Then
    expect(screen.getByLabelText("평가자 1 평가 배정")).toBeChecked()
    expect(screen.getByLabelText("평가자 2 평가 배정")).toBeChecked()
    expect(screen.getByLabelText("평가자 3 평가 배정")).toBeChecked()
    expect(screen.getByLabelText("평가자 1 원시 가중치")).toHaveValue(2)
  })

  it("clears only removable evaluators when bulk clearing is requested", async () => {
    // Given
    const user = userEvent.setup()
    render(
      <EvaluatorAssignmentPanel
        disabled={false}
        evaluators={evaluators}
        groups={protectedGroups}
        onSave={vi.fn(() => true)}
        onSavePreset={vi.fn(() => true)}
        preset={[]}
      />,
    )

    // When
    await user.click(screen.getByRole("button", { name: "선택 해제" }))

    // Then
    expect(screen.getByLabelText("평가자 1 평가 배정")).toBeChecked()
    expect(screen.getByLabelText("평가자 1 평가 배정")).toBeDisabled()
    expect(screen.getByLabelText("평가자 2 평가 배정")).not.toBeChecked()
    expect(screen.getByLabelText("평가자 3 평가 배정")).not.toBeChecked()
  })
})
