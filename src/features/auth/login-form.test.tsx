import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { LoginForm } from "./login-form"

describe("LoginForm", () => {
  afterEach(cleanup)

  it("submits the entered username and password", async () => {
    // Given
    const onLogin = vi.fn().mockResolvedValue({ ok: true, role: "operator" })
    render(<LoginForm onLogin={onLogin} />)

    // When
    await userEvent.type(screen.getByLabelText("아이디"), "operator")
    await userEvent.type(screen.getByLabelText("비밀번호"), "Demo!2026")
    await userEvent.click(screen.getByRole("button", { name: "로그인" }))

    // Then
    expect(onLogin).toHaveBeenCalledWith({ username: "operator", password: "Demo!2026" })
  })

  it("announces a rejected login without clearing the username", async () => {
    // Given
    const onLogin = vi.fn().mockResolvedValue({
      ok: false,
      message: "아이디 또는 비밀번호가 일치하지 않습니다.",
    })
    render(<LoginForm onLogin={onLogin} />)
    const username = screen.getByLabelText("아이디")
    await userEvent.type(username, "operator")
    await userEvent.type(screen.getByLabelText("비밀번호"), "Wrong!2026")

    // When
    await userEvent.click(screen.getByRole("button", { name: "로그인" }))

    // Then
    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(username).toHaveValue("operator")
  })
})
