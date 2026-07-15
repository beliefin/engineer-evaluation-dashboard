import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { EvaluationProvider } from "@/providers"
import { seedTestAuthSession, TestAuthProvider } from "@/test/auth-fixture"

import { AnalysisScreen } from "./analysis-screen"

const pointerCaptureDescriptors = {
  hasPointerCapture: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "hasPointerCapture",
  ),
  releasePointerCapture: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "releasePointerCapture",
  ),
  setPointerCapture: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "setPointerCapture",
  ),
  scrollIntoView: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollIntoView",
  ),
}

const navigation = vi.hoisted(() => {
  let currentUrl = "/analysis"
  const listeners = new Set<() => void>()

  function getUrl(): string {
    return currentUrl
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function setUrl(nextUrl: string): void {
    currentUrl = nextUrl
    listeners.forEach((listener) => listener())
  }

  return {
    getUrl,
    subscribe,
    setUrl,
    replace: vi.fn((nextUrl: string) => setUrl(nextUrl)),
  }
})

vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react")

  function useCurrentUrl(): string {
    return useSyncExternalStore(
      navigation.subscribe,
      navigation.getUrl,
      navigation.getUrl,
    )
  }

  return {
    usePathname: () => new URL(useCurrentUrl(), "http://localhost").pathname,
    useRouter: () => ({ replace: navigation.replace }),
    useSearchParams: () =>
      new URL(useCurrentUrl(), "http://localhost").searchParams,
  }
})

function renderAnalysis() {
  return render(
    <TestAuthProvider>
      <EvaluationProvider>
        <AnalysisScreen />
      </EvaluationProvider>
    </TestAuthProvider>,
  )
}

function getAnalysisFilters() {
  const teamFilter = screen.getByRole("combobox", { name: "팀" })
  const categoryFilter = screen.getByRole("combobox", { name: "평가 분야" })
  const statusFilter = screen.getByRole("combobox", { name: "진행 상태" })

  return { teamFilter, categoryFilter, statusFilter }
}

describe("analysis URL filter state", () => {
  beforeAll(() => {
    Object.defineProperties(HTMLElement.prototype, {
      hasPointerCapture: { configurable: true, value: () => false },
      releasePointerCapture: { configurable: true, value: () => undefined },
      setPointerCapture: { configurable: true, value: () => undefined },
      scrollIntoView: { configurable: true, value: () => undefined },
    })
  })

  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    seedTestAuthSession()
    navigation.replace.mockClear()
    navigation.setUrl("/analysis")
  })

  afterEach(() => {
    cleanup()
  })

  afterAll(() => {
    for (const [key, descriptor] of Object.entries(pointerCaptureDescriptors)) {
      if (descriptor === undefined) {
        Reflect.deleteProperty(HTMLElement.prototype, key)
      } else {
        Object.defineProperty(HTMLElement.prototype, key, descriptor)
      }
    }
  })

  it("initializes team, category, and status filters from the URL", async () => {
    navigation.setUrl(
      `/analysis?team=${encodeURIComponent("생산 2팀")}&category=task-dx-tool&status=in_progress`,
    )

    renderAnalysis()
    await screen.findByRole("heading", { name: "평가 항목 분석" })

    const { teamFilter, categoryFilter, statusFilter } = getAnalysisFilters()
    expect(teamFilter).toHaveTextContent("생산 2팀")
    expect(categoryFilter).toHaveTextContent("DX 툴 활용")
    expect(statusFilter).toHaveTextContent("진행 중")
  })

  it("writes filter changes to the URL", async () => {
    const user = userEvent.setup()
    renderAnalysis()
    await screen.findByRole("heading", { name: "평가 항목 분석" })
    const { teamFilter, categoryFilter, statusFilter } = getAnalysisFilters()

    await user.click(teamFilter)
    await user.click(await screen.findByRole("option", { name: "생산 2팀" }))
    await user.click(categoryFilter)
    await user.click(await screen.findByRole("option", { name: "고등급제안" }))
    await user.click(statusFilter)
    await user.click(await screen.findByRole("option", { name: "미확정" }))

    const params = new URL(navigation.getUrl(), "http://localhost").searchParams
    expect(params.get("team")).toBe("생산 2팀")
    expect(params.get("category")).toBe("task-proposal")
    expect(params.get("status")).toBe("unconfirmed")
    expect(navigation.replace).toHaveBeenCalled()
  }, 10_000)

  it("restores the current URL filters after the analysis screen remounts", async () => {
    navigation.setUrl(
      `/analysis?team=${encodeURIComponent("생산 1팀")}&category=task-language&status=complete`,
    )
    const firstView = renderAnalysis()
    await screen.findByRole("heading", { name: "평가 항목 분석" })

    firstView.unmount()
    renderAnalysis()
    await screen.findByRole("heading", { name: "평가 항목 분석" })

    const { teamFilter, categoryFilter, statusFilter } = getAnalysisFilters()
    expect(teamFilter).toHaveTextContent("생산 1팀")
    expect(categoryFilter).toHaveTextContent("어학")
    expect(statusFilter).toHaveTextContent("완료")
  })
})
