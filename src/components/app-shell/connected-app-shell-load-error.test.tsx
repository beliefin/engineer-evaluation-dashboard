import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AUTH_SESSION_KEY, AUTH_STORAGE_KEY } from "@/auth"
import { EvaluationProvider } from "@/providers"
import { LOCAL_STORAGE_KEY } from "@/repository"
import { seedTestAuthSession, TestAuthProvider } from "@/test/auth-fixture"

import { ConnectedAppShell } from "./connected-app-shell"

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: vi.fn() }),
}))

function renderShell() {
  return render(
    <TestAuthProvider>
      <EvaluationProvider>
        <ConnectedAppShell>
          <p>평가 작업 화면</p>
        </ConnectedAppShell>
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
  vi.restoreAllMocks()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe("ConnectedAppShell initial repository load failure", () => {
  it("shows an accessible error and recovers when retry succeeds", async () => {
    // Given
    const user = userEvent.setup()
    const authSnapshot = window.localStorage.getItem(AUTH_STORAGE_KEY)
    const authSession = window.localStorage.getItem(AUTH_SESSION_KEY)
    let evaluationReads = 0
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === AUTH_STORAGE_KEY) return authSnapshot
      if (key === AUTH_SESSION_KEY) return authSession
      if (key === LOCAL_STORAGE_KEY && evaluationReads === 0) {
        evaluationReads += 1
        throw new DOMException("storage unavailable", "SecurityError")
      }
      return null
    })

    // When
    renderShell()

    // Then
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("샘플 데이터를 불러오지 못했습니다")
    expect(screen.queryByText("평가 작업 화면")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "다시 시도" }))
    expect(await screen.findByText("평가 작업 화면")).toBeInTheDocument()
  })

  it("requires confirmation before replacing unreadable data with the demo snapshot", async () => {
    // Given
    const user = userEvent.setup()
    const authSnapshot = window.localStorage.getItem(AUTH_STORAGE_KEY)
    const authSession = window.localStorage.getItem(AUTH_SESSION_KEY)
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === AUTH_STORAGE_KEY) return authSnapshot
      if (key === AUTH_SESSION_KEY) return authSession
      if (key === LOCAL_STORAGE_KEY) {
        throw new DOMException("storage unavailable", "SecurityError")
      }
      return null
    })
    renderShell()
    await screen.findByRole("alert")

    // When
    await user.click(screen.getByRole("button", { name: "샘플 데이터 초기화" }))

    // Then
    expect(screen.getByRole("dialog", { name: "샘플 데이터를 초기화할까요?" })).toBeVisible()
    expect(screen.queryByText("평가 작업 화면")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "초기화 실행" }))
    expect(await screen.findByText("평가 작업 화면")).toBeInTheDocument()
  })
})
