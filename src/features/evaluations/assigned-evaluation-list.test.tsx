import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { AssignedEvaluationList } from "./assigned-evaluation-list"
import type { AssignedEvaluationViewModel } from "./types"

const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
)

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: () => undefined,
  })
})

afterEach(cleanup)

afterAll(() => {
  if (scrollIntoViewDescriptor === undefined) {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView")
  } else {
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollIntoView",
      scrollIntoViewDescriptor,
    )
  }
})

const assignments: readonly AssignedEvaluationViewModel[] = [
  {
    id: "assignment-01",
    engineerName: "김하늘",
    teamName: "생산 1팀",
    evaluatorId: "evaluator-01",
    evaluatorName: "박평가",
    categoryLabel: "성장탐구계획서",
    cycleLabel: "2026 상반기",
    status: "in_progress",
    answeredCount: 6,
    totalItems: 10,
    updatedAtLabel: "10분 전",
  },
  {
    id: "assignment-02",
    engineerName: "박이든",
    teamName: "생산 2팀",
    evaluatorId: "evaluator-02",
    evaluatorName: "최평가",
    categoryLabel: "DX 툴 활용",
    cycleLabel: "2026 상반기",
    status: "submitted",
    answeredCount: 10,
    totalItems: 10,
    updatedAtLabel: "어제",
  },
]

describe("AssignedEvaluationList", () => {
  it("엔지니어·팀·분야를 검색하고 결과를 연다", async () => {
    const user = userEvent.setup()
    const onOpenEvaluation = vi.fn()

    render(
      <AssignedEvaluationList
        assignments={assignments}
        onOpenEvaluation={onOpenEvaluation}
      />
    )

    await user.type(screen.getByRole("searchbox", { name: "배정 평가 검색" }), "생산 2팀")
    expect(screen.queryByText("김하늘")).not.toBeInTheDocument()
    expect(screen.getByText("박이든")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /박이든 평가 열기/ }))
    expect(onOpenEvaluation).toHaveBeenCalledWith("assignment-02")
  })

  it("운영자 목록에서 평가자 이름을 표시하고 평가자별로 거른다", async () => {
    const user = userEvent.setup()

    render(
      <AssignedEvaluationList
        assignments={assignments}
        onOpenEvaluation={vi.fn()}
        showEvaluatorFilter
      />
    )

    expect(screen.getByText("박평가")).toBeInTheDocument()
    expect(screen.getByText("최평가")).toBeInTheDocument()

    const searchbox = screen.getByRole("searchbox", { name: "배정 평가 검색" })
    await user.type(searchbox, "최평가")
    expect(screen.queryByText("김하늘")).not.toBeInTheDocument()
    expect(screen.getByText("박이든")).toBeInTheDocument()
    await user.clear(searchbox)

    screen.getByRole("combobox", { name: "평가자 필터" }).focus()
    await user.keyboard("{Enter}{ArrowDown}{ArrowDown}{Enter}")

    expect(screen.queryByText("김하늘")).not.toBeInTheDocument()
    expect(screen.getByText("박이든")).toBeInTheDocument()
  })
})
