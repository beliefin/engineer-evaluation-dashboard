import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import type { RelativeRankingCandidate } from "@/view-models/relative-ranking"

import { RelativeRankingSection } from "./relative-ranking-section"

const storageKey = "engineer-evaluation-dashboard:relative-ranking-selection:v1:fixture-account:fixture-cycle"
const candidates: readonly RelativeRankingCandidate[] = Array.from({ length: 12 }, (_, index) => ({
  engineerId: `engineer-${index + 1}`,
  engineerName: `Fixture Engineer ${index + 1}`,
  employeeCode: `${1000 + index}`,
  team: "Fixture Team",
  department: "Fixture Department",
  position: "Engineer",
  score: 70 + index,
  scoreStatus: "confirmed",
  completedTaskCount: 2,
  taskCount: 2,
}))

function renderFixture() {
  return render(<RelativeRankingSection accountId="fixture-account" candidates={candidates} cycleId="fixture-cycle" seasonLabel="Fixture Season" />)
}

async function openSelector(user: ReturnType<typeof userEvent.setup>) {
  const trigger = document.querySelector<HTMLButtonElement>('[data-slot="sheet-trigger"]')
  if (trigger === null) throw new Error("Expected the responsive selection trigger")
  await user.click(trigger)
}

describe("relative ranking saved fixture", () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it("keeps an explicitly saved 12-person selection after rerender and discards a later unsaved edit", async () => {
    const user = userEvent.setup()
    const firstRender = renderFixture()

    await user.click(screen.getByRole("button", { name: "선택 저장" }))
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]")).toHaveLength(12)

    await openSelector(user)
    await user.click(screen.getAllByRole("checkbox")[0]!)
    firstRender.unmount()
    renderFixture()
    await openSelector(user)

    expect(screen.getAllByRole("checkbox")[0]).toBeChecked()
    expect(screen.getAllByRole("checkbox")[11]).toBeChecked()
  })

  it("resets a saved selection to the complete fixture population", async () => {
    window.localStorage.setItem(storageKey, JSON.stringify(["engineer-1"]))
    const user = userEvent.setup()
    renderFixture()
    await openSelector(user)

    await user.click(screen.getByRole("button", { name: "초기화" }))

    expect(screen.getAllByRole("checkbox")[0]).toBeChecked()
    expect(screen.getAllByRole("checkbox")[11]).toBeChecked()
    expect(window.localStorage.getItem(storageKey)).toBeNull()
  })
})
