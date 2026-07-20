import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { AppBrand } from "./app-sidebar"
import { APP_SHELL_HOME_PATHS, type AppShellRole } from "./types"

const HOME_ROUTES: readonly Readonly<{
  role: AppShellRole
  href: string
}>[] = [
  { role: "operator", href: "/dashboard" },
  { role: "approver", href: "/dashboard" },
  { role: "evaluator", href: "/today" },
  { role: "engineer", href: "/my" },
]

describe("AppBrand", () => {
  afterEach(cleanup)

  it.each(HOME_ROUTES)("links the $role brand to its main screen", ({ role, href }) => {
    render(<AppBrand href={APP_SHELL_HOME_PATHS[role]} />)

    expect(screen.getByRole("link", { name: "엔지니어 역량평가 메인으로 이동" }))
      .toHaveAttribute("href", href)
  })

  it("renders the angular product wordmark without an icon tile", () => {
    // Given / When
    render(<AppBrand href="/dashboard" />)

    // Then
    const brand = screen.getByRole("link", {
      name: "엔지니어 역량평가 메인으로 이동",
    })
    expect(brand).toHaveTextContent("EE")
    expect(brand.querySelector("svg")).toBeNull()
  })
})
