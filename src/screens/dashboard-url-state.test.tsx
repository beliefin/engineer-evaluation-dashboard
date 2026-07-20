import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ChangeEvent } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { EvaluationProvider } from "@/providers"
import { seedTestAuthSession, TestAuthProvider } from "@/test/auth-fixture"

import { DashboardScreen } from "./dashboard-screen"

const navigation = vi.hoisted(() => {
  let currentUrl = "/dashboard"
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

type ProbeFilters = Readonly<{
  query: string
  team: string
  status: "all" | "confirmed" | "tied"
}>

type ProbeSorting = Readonly<{
  key: "rank" | "name" | "team" | "totalScore"
  direction: "asc" | "desc"
}>

type RankingProbeProps = Readonly<{
  filters?: ProbeFilters
  onFiltersChange?: (next: ProbeFilters) => void
  sorting?: ProbeSorting
  onSortingChange?: (next: ProbeSorting) => void
}>

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

vi.mock("@/features/dashboard", async () => {
  const { createElement } = await import("react")

  return {
    CategoryAverageChart: () => null,
    DashboardHeader: ({ title }: Readonly<{ title: string }>) =>
      createElement("h1", null, title),
    EngineerEvaluationProgress: () => null,
    MetricStrip: () => null,
    ScoreDistributionChart: () => null,
    CompletedRanking: ({
      filters = { query: "", team: "all", status: "all" },
      onFiltersChange,
      sorting,
      onSortingChange,
    }: RankingProbeProps) =>
      createElement(
        "section",
        null,
        createElement("input", {
          "aria-label": "이름 검색",
          type: "search",
          value: filters.query,
          onChange: (event: ChangeEvent<HTMLInputElement>) =>
            onFiltersChange?.({ ...filters, query: event.currentTarget.value }),
        }),
        createElement(
          "button",
          {
            "aria-label": "팀 필터",
            type: "button",
            onClick: () =>
              onFiltersChange?.({ ...filters, team: "생산 2팀" }),
          },
          filters.team,
        ),
        createElement(
          "button",
          {
            "aria-label": "순위 상태 필터",
            type: "button",
            onClick: () => onFiltersChange?.({ ...filters, status: "tied" }),
          },
          filters.status,
        ),
        createElement(
          "output",
          { "aria-label": "정렬 상태" },
          sorting === undefined ? "missing" : `${sorting.key}:${sorting.direction}`,
        ),
        createElement(
          "button",
          {
            "aria-label": "총점 내림차순 정렬",
            type: "button",
            onClick: () =>
              onSortingChange?.({ key: "totalScore", direction: "desc" }),
          },
          "총점 내림차순 정렬",
        ),
      ),
  }
})

function renderDashboard() {
  return render(
    <TestAuthProvider>
      <EvaluationProvider>
        <DashboardScreen />
      </EvaluationProvider>
    </TestAuthProvider>,
  )
}

async function getFilterControls() {
  await screen.findByRole("heading", { name: "엔지니어 역량평가 전체 현황" })
  return {
    searchInput: screen.getByRole("searchbox", { name: "이름 검색" }),
    teamFilter: screen.getByRole("button", { name: "팀 필터" }),
    statusFilter: screen.getByRole("button", { name: "순위 상태 필터" }),
  }
}

describe("dashboard URL filter state", () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    seedTestAuthSession()
    navigation.replace.mockClear()
    navigation.setUrl("/dashboard")
    vi.spyOn(History.prototype, "replaceState").mockImplementation((_data, _unused, url) => {
      if (url !== undefined && url !== null) navigation.setUrl(String(url))
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("reads search, team, and status filters from the initial URL", async () => {
    // Given
    navigation.setUrl(
      "/dashboard?q=%EC%83%98%ED%94%8C+%EC%97%94%EC%A7%80%EB%8B%88%EC%96%B4+01&team=%EC%83%9D%EC%82%B0+1%ED%8C%80&status=confirmed",
    )

    // When
    renderDashboard()

    // Then
    const { searchInput, teamFilter, statusFilter } = await getFilterControls()

    expect(searchInput).toHaveValue("샘플 엔지니어 01")
    expect(teamFilter).toHaveTextContent("생산 1팀")
    expect(statusFilter).toHaveTextContent("confirmed")
  })

  it("writes search, team, and status changes to the URL", async () => {
    // Given
    const user = userEvent.setup()
    renderDashboard()
    const { searchInput, teamFilter, statusFilter } = await getFilterControls()

    // When
    await user.type(searchInput, "엔지니어 02")
    await user.click(teamFilter)
    await user.click(statusFilter)

    // Then
    const params = new URL(navigation.getUrl(), "http://localhost").searchParams
    expect(params.get("q")).toBe("엔지니어 02")
    expect(params.get("team")).toBe("생산 2팀")
    expect(params.get("status")).toBe("tied")
    expect(History.prototype.replaceState).toHaveBeenCalled()
  })

  it("restores the current URL filters after the dashboard remounts", async () => {
    // Given
    navigation.setUrl(
      "/dashboard?q=%EC%97%94%EC%A7%80%EB%8B%88%EC%96%B4+03&team=%EC%83%9D%EC%82%B0+2%ED%8C%80&status=tied",
    )
    const firstView = renderDashboard()
    await screen.findByRole("heading", { name: "엔지니어 역량평가 전체 현황" })

    // When
    firstView.unmount()
    renderDashboard()

    // Then
    const { searchInput, teamFilter, statusFilter } = await getFilterControls()

    expect(searchInput).toHaveValue("엔지니어 03")
    expect(teamFilter).toHaveTextContent("생산 2팀")
    expect(statusFilter).toHaveTextContent("tied")
  })

  it("restores URL sorting and preserves filters when sorting changes", async () => {
    // Given
    navigation.setUrl(
      "/dashboard?q=%EC%97%94%EC%A7%80%EB%8B%88%EC%96%B4&team=%EC%83%9D%EC%82%B0+1%ED%8C%80&status=confirmed&sort=totalScore&direction=asc",
    )
    const user = userEvent.setup()
    renderDashboard()
    const sortingState = await screen.findByRole("status", { name: "정렬 상태" })

    expect(sortingState).toHaveTextContent("totalScore:asc")

    // When
    await user.click(
      screen.getByRole("button", { name: "총점 내림차순 정렬" }),
    )

    // Then
    const params = new URL(navigation.getUrl(), "http://localhost").searchParams
    expect(params.get("q")).toBe("엔지니어")
    expect(params.get("team")).toBe("생산 1팀")
    expect(params.get("status")).toBe("confirmed")
    expect(params.get("sort")).toBe("totalScore")
    expect(params.get("direction")).toBe("desc")
  })

  it("uses the top team scope switch for every dashboard aggregate", async () => {
    const user = userEvent.setup()
    renderDashboard()
    await screen.findByRole("heading", { name: "엔지니어 역량평가 전체 현황" })

    await user.click(screen.getByRole("button", { name: "생산 1팀 현황 보기" }))

    expect(new URL(navigation.getUrl(), "http://localhost").searchParams.get("team")).toBe("생산 1팀")
    expect(screen.getByRole("button", { name: "생산 1팀 현황 보기" })).toHaveAttribute("aria-pressed", "true")

    await user.click(screen.getByRole("button", { name: "생산 2팀 현황 보기" }))
    expect(new URL(navigation.getUrl(), "http://localhost").searchParams.get("team")).toBe("생산 2팀")
    expect(screen.getByRole("button", { name: "생산 2팀 현황 보기" })).toHaveAttribute("aria-pressed", "true")

    await user.click(screen.getByRole("button", { name: "전체 현황 보기" }))
    expect(new URL(navigation.getUrl(), "http://localhost").searchParams.get("team")).toBeNull()
  })
})
