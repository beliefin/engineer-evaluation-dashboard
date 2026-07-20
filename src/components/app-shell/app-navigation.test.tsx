import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AppNavigation } from "./app-navigation"

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}))

describe("AppNavigation", () => {
  afterEach(cleanup)

  it("shows operator evaluation, pending, calendar, and operations entries", () => {
    render(<AppNavigation role="operator" />)

    expect(screen.getByRole("link", { name: /평가 입력/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /미평가 현황/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /평가 일정/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /운영 설정/ })).toBeInTheDocument()
  })

  it("uses a typographic ledger navigation instead of decorative icons", () => {
    // Given / When
    render(<AppNavigation role="operator" />)

    // Then
    const dashboardLink = screen.getByRole("link", { name: /전체 현황/ })
    expect(dashboardLink).toHaveAttribute("aria-current", "page")
    expect(dashboardLink).toHaveTextContent("01")
    expect(dashboardLink.querySelector("svg")).toBeNull()
  })

  it("keeps the evaluator navigation limited to their own work", () => {
    render(<AppNavigation role="evaluator" />)

    expect(screen.getByRole("link", { name: /오늘의 평가/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /평가하기/ })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /미평가 현황/ })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /평가 일정/ })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /전체 현황/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /^분석/ })).not.toBeInTheDocument()
  })

  it("shows dashboard and analysis only to an evaluator with insight access", () => {
    render(<AppNavigation canViewInsights role="evaluator" />)

    expect(screen.getByRole("link", { name: /전체 현황/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /^분석/ })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /미평가 현황/ })).not.toBeInTheDocument()
  })

  it("gives approvers read-only result, pending, and calendar entries", () => {
    render(<AppNavigation role="approver" />)

    expect(screen.getByRole("link", { name: /전체 현황/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /미평가 현황/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /평가 일정/ })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /평가 입력/ })).not.toBeInTheDocument()
  })

  it("limits engineers to their own evaluation portal", () => {
    // Given / When
    render(<AppNavigation role="engineer" />)

    // Then
    expect(screen.getByRole("link", { name: /내 평가/ })).toHaveAttribute("href", "/my")
    expect(screen.queryByRole("link", { name: /전체 현황/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /운영 설정/ })).not.toBeInTheDocument()
  })
})
