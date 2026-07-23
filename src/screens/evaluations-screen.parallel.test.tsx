import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { EvaluationSnapshot } from "@/domain"
import { createLocalStorageEvaluationRepository, LOCAL_STORAGE_KEY } from "@/repository"
import { EvaluationProvider } from "@/providers"
import { seedTestAuthSession, TestAuthProvider } from "@/test/auth-fixture"

import { EvaluationsScreen } from "./evaluations-screen"

vi.mock("next/navigation", () => ({
  usePathname: () => "/evaluations",
  useRouter: () => ({ push: vi.fn() }),
}))

function renderEvaluatorWorkspace() {
  return render(
    <TestAuthProvider>
      <EvaluationProvider>
        <EvaluationsScreen />
      </EvaluationProvider>
    </TestAuthProvider>,
  )
}

function prepareTwoEditableOtsAssignments(): void {
  const repository = createLocalStorageEvaluationRepository({ storage: window.localStorage })
  const snapshot = repository.loadSnapshot()
  const task = snapshot.tasks.find((candidate) => candidate.name.includes("OTS"))
  if (task === undefined) throw new RangeError("OTS task fixture missing")
  const assignments = snapshot.assignments
    .filter((assignment) =>
      assignment.taskId === task.id && assignment.evaluatorId === "evaluator-01",
    )
    .slice(0, 2)
  if (assignments.length !== 2) throw new RangeError("parallel assignment fixtures missing")
  const assignmentIds = new Set(assignments.map((assignment) => assignment.id))
  const scoreSheets: EvaluationSnapshot["scoreSheets"] = snapshot.scoreSheets
    .filter((sheet) => assignmentIds.has(sheet.assignmentId))
    .map((sheet) => ({
      ...sheet,
      status: "draft",
      scores: sheet.scores.map((score) => ({ ...score, score: null })),
      passResult: null,
      submittedAt: null,
    }))
  const prepared: EvaluationSnapshot = { ...snapshot, assignments, scoreSheets }
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prepared))
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  seedTestAuthSession("evaluator", "evaluator-01")
  prepareTwoEditableOtsAssignments()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.sessionStorage.clear()
  vi.clearAllMocks()
})

describe("evaluator parallel entry", () => {
  it("keeps two presenter drafts independent in the same task", async () => {
    // Given
    const user = userEvent.setup()
    renderEvaluatorWorkspace()
    await screen.findByRole("heading", { name: "내 평가 업무" })

    // When
    await user.click(screen.getByRole("button", { name: "2명 동시 평가" }))
    const scoreInputs = await screen.findAllByRole("textbox", {
      name: /· 시나리오 목적 및 현장 가치 점수$/,
    })
    const leftScoreInput = scoreInputs[0]
    const rightScoreInput = scoreInputs[1]
    if (leftScoreInput === undefined || rightScoreInput === undefined) {
      throw new RangeError("parallel score inputs missing")
    }
    await user.clear(leftScoreInput)
    await user.type(leftScoreInput, "9")
    await user.clear(rightScoreInput)
    await user.type(rightScoreInput, "7")

    // Then
    expect(leftScoreInput).toHaveValue("9")
    expect(rightScoreInput).toHaveValue("7")
    const saved = createLocalStorageEvaluationRepository({ storage: window.localStorage }).loadSnapshot()
    const storedScores = saved.scoreSheets
      .filter((sheet) => sheet.status === "draft")
      .flatMap((sheet) => sheet.scores)
      .filter((score) => score.itemId === "task-ots-scenario-item-01")
      .map((score) => score.score)
    expect(storedScores).toEqual(expect.arrayContaining([9, 7]))
  })
})
