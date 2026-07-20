import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { EvaluationProvider } from "@/providers/evaluation-provider"
import { createLocalStorageEvaluationRepository } from "@/repository"
import { seedTestAuthSession, TestAuthProvider } from "@/test/auth-fixture"

import { EvaluationFormScreen } from "./evaluation-form-screen"

const ASSIGNMENT_ID = "engineer-13-task-dx-tool-evaluator-03"
const OTHER_EVALUATOR_ASSIGNMENT_ID = "engineer-13-task-growth-plan-evaluator-04"
const SHEET_ID = `sheet-${ASSIGNMENT_ID}`
const ITEM_ID = "task-dx-tool-item-07"

function renderEvaluationForm() {
  return render(
    <TestAuthProvider>
      <EvaluationProvider>
        <EvaluationFormScreen assignmentId={ASSIGNMENT_ID} />
      </EvaluationProvider>
    </TestAuthProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  seedTestAuthSession()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe("EvaluationFormScreen autosave integration", () => {
  it("lets an operator open another evaluator's sheet and labels proxy entry", async () => {
    render(
      <TestAuthProvider>
        <EvaluationProvider>
          <EvaluationFormScreen assignmentId={OTHER_EVALUATOR_ASSIGNMENT_ID} />
        </EvaluationProvider>
      </TestAuthProvider>,
    )

    expect(
      await screen.findByText("운영자 대리 입력 · 샘플 평가자 4"),
    ).toBeInTheDocument()
  })

  it("blocks an evaluator from another evaluator's sheet", async () => {
    seedTestAuthSession("evaluator", "evaluator-01")
    render(
      <TestAuthProvider>
        <EvaluationProvider>
          <EvaluationFormScreen assignmentId={OTHER_EVALUATOR_ASSIGNMENT_ID} />
        </EvaluationProvider>
      </TestAuthProvider>,
    )

    expect(await screen.findByText("접근 권한이 없습니다")).toBeInTheDocument()
  })

  it("persists a valid score automatically through the LocalStorage repository", async () => {
    // Given
    const user = userEvent.setup()
    renderEvaluationForm()
    const input = await screen.findByRole("textbox", { name: "결과물의 사용 편의성 점수" })

    // When
    await user.type(input, "9")

    // Then
    expect(await screen.findByText("저장 완료")).toBeInTheDocument()
    const persisted = createLocalStorageEvaluationRepository({
      storage: window.localStorage,
    }).loadSnapshot()
    const sheet = persisted.scoreSheets.find((candidate) => candidate.id === SHEET_ID)
    expect(sheet?.scores.find((entry) => entry.itemId === ITEM_ID)?.score).toBe(9)
  })

  it("restores the automatically saved score after the evaluation surface remounts", async () => {
    // Given
    const user = userEvent.setup()
    const firstRender = renderEvaluationForm()
    const input = await screen.findByRole("textbox", { name: "결과물의 사용 편의성 점수" })
    await user.type(input, "8")
    expect(await screen.findByText("저장 완료")).toBeInTheDocument()
    firstRender.unmount()

    // When
    renderEvaluationForm()

    // Then
    expect(await screen.findByRole("textbox", { name: "결과물의 사용 편의성 점수" })).toHaveValue("8")
  })

  it("persists ten TSV scores through one batch update", async () => {
    // Given
    const user = userEvent.setup()
    renderEvaluationForm()
    const input = await screen.findByRole("textbox", { name: "TSV 점수" })

    // When
    fireEvent.change(input, { target: { value: "10\t9\t8\t7\t6\t5\t4\t3\t2\t1" } })
    await user.click(screen.getByRole("button", { name: "점수 일괄 적용" }))

    // Then
    expect(await screen.findByText("저장 완료")).toBeInTheDocument()
    const persisted = createLocalStorageEvaluationRepository({
      storage: window.localStorage,
    }).loadSnapshot()
    const sheet = persisted.scoreSheets.find((candidate) => candidate.id === SHEET_ID)
    expect(sheet?.scores.map((entry) => entry.score)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
  })
})
