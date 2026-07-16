import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { AuthAccount } from "@/auth"

import { AccountManagementPanel } from "./account-management-panel"

const ACCOUNTS: readonly AuthAccount[] = [
  {
    id: "account-operator",
    username: "operator",
    displayName: "샘플 운영자",
    role: "operator",
    roles: ["operator"],
    evaluatorId: null,
    engineerId: null,
    active: true,
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
  },
  {
    id: "account-evaluator",
    username: "evaluator01",
    displayName: "샘플 평가자 01",
    role: "evaluator",
    roles: ["evaluator"],
    evaluatorId: "evaluator-01",
    engineerId: null,
    active: true,
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
  },
]

const BASE_PROPS = {
  accounts: ACCOUNTS,
  currentAccountId: "account-operator",
  evaluatorOptions: [
    { id: "evaluator-01", label: "샘플 평가자 01" },
    { id: "evaluator-02", label: "샘플 평가자 02" },
  ],
  engineerOptions: [
    { id: "engineer-01", label: "샘플 엔지니어 01" },
    { id: "engineer-02", label: "샘플 엔지니어 02" },
  ],
  onCreate: vi.fn().mockResolvedValue({ ok: true }),
  onDelete: vi.fn().mockResolvedValue({ ok: true }),
  onResetPassword: vi.fn().mockResolvedValue({ ok: true }),
  onUpdate: vi.fn().mockResolvedValue({ ok: true }),
} as const

describe("AccountManagementPanel", () => {
  afterEach(cleanup)

  it("protects the current operator from self deletion and deactivation", () => {
    // Given / When
    render(<AccountManagementPanel {...BASE_PROPS} />)

    // Then
    expect(screen.getByRole("button", { name: "샘플 운영자 계정 비활성화" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "샘플 운영자 계정 삭제" })).toBeDisabled()
  })

  it("creates an evaluator account linked to a registered evaluator", async () => {
    // Given
    const onCreate = vi.fn().mockResolvedValue({ ok: true })
    render(<AccountManagementPanel {...BASE_PROPS} onCreate={onCreate} />)
    await userEvent.click(screen.getByRole("button", { name: "계정 추가" }))

    // When
    await userEvent.type(screen.getByLabelText("아이디"), "evaluator02")
    await userEvent.type(screen.getByLabelText("표시 이름"), "평가 담당자 02")
    await userEvent.selectOptions(screen.getByLabelText("역할"), "evaluator")
    await userEvent.selectOptions(screen.getByLabelText("연결 평가자"), "evaluator-02")
    await userEvent.type(screen.getByLabelText("초기 비밀번호"), "Evaluate2026")
    await userEvent.click(screen.getByRole("button", { name: "계정 저장" }))

    // Then
    expect(onCreate).toHaveBeenCalledWith({
      username: "evaluator02",
      displayName: "평가 담당자 02",
      role: "evaluator",
      roles: ["evaluator"],
      evaluatorId: "evaluator-02",
      engineerId: null,
      password: "Evaluate2026",
      active: true,
    })
  })

  it("creates one account linked to both evaluator and engineer rosters", async () => {
    const onCreate = vi.fn().mockResolvedValue({ ok: true })
    render(<AccountManagementPanel {...BASE_PROPS} onCreate={onCreate} />)
    await userEvent.click(screen.getByRole("button", { name: "계정 추가" }))

    await userEvent.type(screen.getByLabelText("아이디"), "dual02")
    await userEvent.type(screen.getByLabelText("표시 이름"), "평가받는 평가자")
    await userEvent.selectOptions(screen.getByLabelText("역할"), "evaluator_engineer")
    await userEvent.selectOptions(screen.getByLabelText("연결 평가자"), "evaluator-02")
    await userEvent.selectOptions(screen.getByLabelText("연결 엔지니어"), "engineer-02")
    await userEvent.type(screen.getByLabelText("초기 비밀번호"), "31019467")
    await userEvent.click(screen.getByRole("button", { name: "계정 저장" }))

    expect(onCreate).toHaveBeenCalledWith({
      username: "dual02",
      displayName: "평가받는 평가자",
      role: "evaluator",
      roles: ["evaluator", "engineer"],
      evaluatorId: "evaluator-02",
      engineerId: "engineer-02",
      password: "31019467",
      active: true,
    })
  })

  it("asks for confirmation before deactivating an account", async () => {
    // Given
    const onUpdate = vi.fn().mockResolvedValue({ ok: true })
    render(<AccountManagementPanel {...BASE_PROPS} onUpdate={onUpdate} />)

    // When
    await userEvent.click(screen.getByRole("button", { name: "샘플 평가자 01 계정 비활성화" }))

    // Then
    expect(screen.getByRole("dialog", { name: "계정을 비활성화할까요?" })).toBeInTheDocument()
    expect(onUpdate).not.toHaveBeenCalled()

    // When
    await userEvent.click(screen.getByRole("button", { name: "비활성화" }))

    // Then
    expect(onUpdate).toHaveBeenCalledWith({
      accountId: "account-evaluator",
      displayName: "샘플 평가자 01",
      role: "evaluator",
      roles: ["evaluator"],
      evaluatorId: "evaluator-01",
      engineerId: null,
      active: false,
    })
  })

  it("creates an engineer account linked to a registered engineer", async () => {
    // Given
    const onCreate = vi.fn().mockResolvedValue({ ok: true })
    render(<AccountManagementPanel {...BASE_PROPS} onCreate={onCreate} />)
    await userEvent.click(screen.getByRole("button", { name: "계정 추가" }))

    // When
    await userEvent.type(screen.getByLabelText("아이디"), "engineer02")
    await userEvent.type(screen.getByLabelText("표시 이름"), "샘플 엔지니어 02")
    await userEvent.selectOptions(screen.getByLabelText("역할"), "engineer")
    await userEvent.selectOptions(screen.getByLabelText("연결 엔지니어"), "engineer-02")
    await userEvent.type(screen.getByLabelText("초기 비밀번호"), "Engineer!2026")
    await userEvent.click(screen.getByRole("button", { name: "계정 저장" }))

    // Then
    expect(onCreate).toHaveBeenCalledWith({
      username: "engineer02",
      displayName: "샘플 엔지니어 02",
      role: "engineer",
      roles: ["engineer"],
      evaluatorId: null,
      engineerId: "engineer-02",
      password: "Engineer!2026",
      active: true,
    })
  })

  it("connects duplicate username errors to the username field", async () => {
    // Given
    const message = "이미 사용 중인 아이디입니다."
    const onCreate = vi.fn().mockResolvedValue({
      ok: false,
      code: "DUPLICATE_USERNAME",
      message,
    })
    render(<AccountManagementPanel {...BASE_PROPS} onCreate={onCreate} />)
    await userEvent.click(screen.getByRole("button", { name: "계정 추가" }))
    const usernameInput = screen.getByLabelText("아이디")
    await userEvent.type(usernameInput, "operator")
    await userEvent.type(screen.getByLabelText("표시 이름"), "새 운영자")
    await userEvent.type(screen.getByLabelText("초기 비밀번호"), "Operator!2026")

    // When
    await userEvent.click(screen.getByRole("button", { name: "계정 저장" }))

    // Then
    expect(usernameInput).toHaveAttribute("aria-invalid", "true")
    expect(usernameInput).toHaveAttribute("aria-describedby", "account-username-error")
    expect(screen.getByTestId("account-username-error")).toHaveTextContent(message)
  })

  it("blocks evaluator account creation until an evaluator is linked", async () => {
    // Given
    const onCreate = vi.fn().mockResolvedValue({ ok: true })
    render(<AccountManagementPanel {...BASE_PROPS} onCreate={onCreate} />)
    await userEvent.click(screen.getByRole("button", { name: "계정 추가" }))
    await userEvent.type(screen.getByLabelText("아이디"), "evaluator02")
    await userEvent.type(screen.getByLabelText("표시 이름"), "평가 담당자 02")
    await userEvent.selectOptions(screen.getByLabelText("역할"), "evaluator")
    await userEvent.type(screen.getByLabelText("초기 비밀번호"), "Evaluate!2026")
    const evaluatorSelect = screen.getByLabelText("연결 평가자")

    // When
    await userEvent.click(screen.getByRole("button", { name: "계정 저장" }))

    // Then
    expect(onCreate).not.toHaveBeenCalled()
    expect(evaluatorSelect).toHaveAttribute("aria-invalid", "true")
    expect(evaluatorSelect).toHaveAttribute("aria-describedby", "account-evaluator-error")
    expect(screen.getByTestId("account-evaluator-error")).toHaveTextContent(
      "평가자 역할은 등록된 평가자와 연결해야 합니다.",
    )
  })

  it("connects password mismatch errors to the confirmation field", async () => {
    // Given
    render(<AccountManagementPanel {...BASE_PROPS} />)
    await userEvent.click(screen.getByRole("button", { name: "샘플 평가자 01 비밀번호 재설정" }))
    await userEvent.type(screen.getByLabelText("새 비밀번호"), "Evaluate!2026")
    const confirmationInput = screen.getByLabelText("새 비밀번호 확인")
    await userEvent.type(confirmationInput, "Different!2026")

    // When
    await userEvent.click(screen.getByRole("button", { name: "비밀번호 저장" }))

    // Then
    expect(confirmationInput).toHaveAttribute("aria-invalid", "true")
    expect(confirmationInput).toHaveAttribute(
      "aria-describedby",
      "reset-password-confirmation-error",
    )
    expect(screen.getByTestId("reset-password-confirmation-error")).toHaveTextContent(
      "비밀번호 확인이 일치하지 않습니다.",
    )
  })
})
