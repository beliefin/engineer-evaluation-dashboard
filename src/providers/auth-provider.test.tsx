import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { seedTestAuthSession } from "@/test/auth-fixture"

import { AuthProvider, useAuth } from "./auth-provider"

function RoleProbe() {
  const { session, switchRole } = useAuth()

  return (
    <div>
      <output aria-label="현재 역할">{session?.role ?? "loading"}</output>
      <button onClick={() => switchRole("engineer")} type="button">엔지니어 전환</button>
      <button onClick={() => switchRole("operator")} type="button">운영자 전환</button>
    </div>
  )
}

describe("AuthProvider role switching", () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    seedTestAuthSession(
      "evaluator",
      "evaluator-dual",
      "engineer-dual",
      ["evaluator", "engineer"],
    )
  })

  afterEach(cleanup)

  it("switches only between roles assigned to the authenticated account", async () => {
    render(<AuthProvider><RoleProbe /></AuthProvider>)
    await waitFor(() => expect(screen.getByLabelText("현재 역할")).toHaveTextContent("evaluator"))

    await userEvent.click(screen.getByRole("button", { name: "엔지니어 전환" }))
    expect(screen.getByLabelText("현재 역할")).toHaveTextContent("engineer")

    await userEvent.click(screen.getByRole("button", { name: "운영자 전환" }))
    expect(screen.getByLabelText("현재 역할")).toHaveTextContent("engineer")
  })
})
