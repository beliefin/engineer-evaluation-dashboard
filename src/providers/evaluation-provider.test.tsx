import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { seedTestAuthSession, TestAuthProvider } from "@/test/auth-fixture"

import { EvaluationProvider, useEvaluation } from "./evaluation-provider"

function SelectionProbe() {
  const {
    activeCycleId,
    activeEvaluatorId,
    setActiveCycleId,
    setActiveEvaluatorId,
  } = useEvaluation()

  return (
    <div>
      <output aria-label="현재 시즌">{activeCycleId}</output>
      <output aria-label="현재 대리 평가자">{activeEvaluatorId}</output>
      <button onClick={() => setActiveCycleId("cycle-next")} type="button">시즌 전환</button>
      <button onClick={() => setActiveEvaluatorId("evaluator-02")} type="button">평가자 전환</button>
    </div>
  )
}

describe("EvaluationProvider shell selections", () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    seedTestAuthSession()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("updates selections even when session storage is unavailable", async () => {
    const nativeSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(this: Storage, key, value) {
      if (this === window.sessionStorage) throw new Error("session storage blocked")
      nativeSetItem.call(this, key, value)
    })

    render(
      <TestAuthProvider>
        <EvaluationProvider>
          <SelectionProbe />
        </EvaluationProvider>
      </TestAuthProvider>,
    )

    await waitFor(() => expect(screen.getByLabelText("현재 시즌")).not.toBeEmptyDOMElement())
    await userEvent.click(screen.getByRole("button", { name: "시즌 전환" }))
    await userEvent.click(screen.getByRole("button", { name: "평가자 전환" }))

    expect(screen.getByLabelText("현재 시즌")).toHaveTextContent("cycle-next")
    expect(screen.getByLabelText("현재 대리 평가자")).toHaveTextContent("evaluator-02")
  })
})
