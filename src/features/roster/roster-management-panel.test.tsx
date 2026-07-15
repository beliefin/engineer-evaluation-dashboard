import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { RosterManagementPanel } from "./roster-management-panel"
import type { EngineerRosterItem, EvaluatorRosterItem } from "./types"

afterEach(cleanup)

const ENGINEERS: readonly EngineerRosterItem[] = [
  {
    id: "engineer-01",
    employeeCode: "E-001",
    displayName: "김하늘",
    team: "생산 1팀",
    position: "엔지니어",
  },
]

const EVALUATORS: readonly EvaluatorRosterItem[] = [
  {
    id: "evaluator-01",
    employeeCode: "V-001",
    displayName: "이서준",
    team: "생산 2팀",
  },
]

describe("RosterManagementPanel", () => {
  it("registers one engineer with visible labeled fields", async () => {
    const user = userEvent.setup()
    const onAddEngineers = vi.fn(() => true)

    render(
      <RosterManagementPanel
        engineers={ENGINEERS}
        evaluators={EVALUATORS}
        onAddEngineers={onAddEngineers}
        onAddEvaluators={() => true}
      />,
    )

    await user.click(screen.getByRole("button", { name: "엔지니어 1명 추가" }))
    await user.type(screen.getByRole("textbox", { name: "사번" }), "E-002")
    await user.type(screen.getByRole("textbox", { name: "이름" }), "박이든")
    await user.click(screen.getByRole("button", { name: "엔지니어 등록" }))

    expect(onAddEngineers).toHaveBeenCalledWith([
      {
        employeeCode: "E-002",
        displayName: "박이든",
        team: "생산 1팀",
        position: "엔지니어",
      },
    ])
  })

  it("previews a valid evaluator batch and submits it atomically", async () => {
    const user = userEvent.setup()
    const onAddEvaluators = vi.fn(() => true)

    render(
      <RosterManagementPanel
        engineers={ENGINEERS}
        evaluators={EVALUATORS}
        onAddEngineers={() => true}
        onAddEvaluators={onAddEvaluators}
      />,
    )

    await user.click(screen.getByRole("tab", { name: "평가자 1명" }))
    await user.click(screen.getByRole("button", { name: "평가자 일괄 등록" }))
    await user.type(
      screen.getByRole("textbox", { name: "평가자 목록" }),
      "사번,이름,팀{enter}V-002,최유진{enter}V-003,정민수,생산 2팀",
    )

    expect(screen.getByText("등록 예정 2명")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "2명 일괄 등록" }))

    expect(onAddEvaluators).toHaveBeenCalledWith([
      { employeeCode: "V-002", displayName: "최유진", team: "생산 1팀" },
      { employeeCode: "V-003", displayName: "정민수", team: "생산 2팀" },
    ])
  })

  it("blocks an invalid batch and reports line errors", async () => {
    const user = userEvent.setup()
    const onAddEngineers = vi.fn(() => true)

    render(
      <RosterManagementPanel
        engineers={ENGINEERS}
        evaluators={EVALUATORS}
        onAddEngineers={onAddEngineers}
        onAddEvaluators={() => true}
      />,
    )

    await user.click(screen.getByRole("button", { name: "엔지니어 일괄 등록" }))
    await user.type(
      screen.getByRole("textbox", { name: "엔지니어 목록" }),
      "E-002,,생산 3팀",
    )

    expect(screen.getByText("1행: 이름을 입력하세요.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "일괄 등록" })).toBeDisabled()
    expect(onAddEngineers).not.toHaveBeenCalled()
  })

  it("keeps the dialog open and explains a repository registration failure", async () => {
    const user = userEvent.setup()
    const onAddEngineers = vi.fn(() => false)

    render(
      <RosterManagementPanel
        engineers={ENGINEERS}
        evaluators={EVALUATORS}
        onAddEngineers={onAddEngineers}
        onAddEvaluators={() => true}
      />,
    )

    await user.click(screen.getByRole("button", { name: "엔지니어 1명 추가" }))
    await user.type(screen.getByRole("textbox", { name: "사번" }), "E-009")
    await user.type(screen.getByRole("textbox", { name: "이름" }), "등록실패")
    await user.click(screen.getByRole("button", { name: "엔지니어 등록" }))

    expect(screen.getByRole("alert")).toHaveTextContent("등록하지 못했습니다")
    expect(screen.getByRole("dialog", { name: "엔지니어 개별 등록" })).toBeInTheDocument()
  })
})
