import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { RoleBadge, StatusBadge } from "./status-badge"

describe("status labels", () => {
  afterEach(cleanup)

  it("communicates common evaluation states with text rather than decorative icons", () => {
    // Given / When
    render(<StatusBadge status="completed" />)

    // Then
    const status = screen.getByLabelText("상태: 완료")
    expect(status).toHaveTextContent("완료")
    expect(status.querySelector("svg")).toBeNull()
  })

  it("renders roles as compact metadata text", () => {
    // Given / When
    render(<RoleBadge role="operator" />)

    // Then
    const role = screen.getByLabelText("역할: 운영자")
    expect(role).toHaveTextContent("운영자")
    expect(role.querySelector("svg")).toBeNull()
  })
})
