import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ShellControls } from "./shell-controls"

const BASE_PROPS = {
  activeCycleId: "cycle-1",
  activeEvaluatorId: "evaluator-1",
  cycles: [{ id: "cycle-1", label: "2026 상반기" }],
  evaluatorOptions: [
    { id: "evaluator-1", label: "평가자 1" },
    { id: "evaluator-2", label: "평가자 2" },
  ],
  idPrefix: "test-shell",
  onCycleChange: vi.fn(),
  onEvaluatorChange: vi.fn(),
} as const

describe("ShellControls", () => {
  afterEach(cleanup)

  it("lets an operator select a registered evaluator for proxy input", async () => {
    const onEvaluatorChange = vi.fn()
    render(
      <ShellControls
        {...BASE_PROPS}
        onEvaluatorChange={onEvaluatorChange}
        role="operator"
      />,
    )

    await userEvent.selectOptions(screen.getByLabelText("대리 입력 평가자"), "evaluator-2")
    expect(onEvaluatorChange).toHaveBeenCalledWith("evaluator-2")
  })

  it("keeps an evaluator account fixed to its authenticated identity", () => {
    render(<ShellControls {...BASE_PROPS} role="evaluator" />)
    expect(screen.queryByLabelText("대리 입력 평가자")).not.toBeInTheDocument()
  })

  it("does not expose a demo role switcher", () => {
    render(<ShellControls {...BASE_PROPS} role="operator" />)
    expect(screen.queryByLabelText("데모 역할")).not.toBeInTheDocument()
  })
})
