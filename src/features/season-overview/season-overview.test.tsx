import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"
import { selectSeasonOverview } from "@/view-models/season-overview"

import { SeasonOverview } from "./season-overview"

describe("SeasonOverview", () => {
  it("renders the season as a visual cover with composition, process, and role guidance", () => {
    const model = selectSeasonOverview(createSeedSnapshot(), "cycle-2026-h1")
    if (model === null) throw new Error("season fixture is missing")

    render(<SeasonOverview backendMode="local" model={model} />)

    expect(screen.getByRole("heading", { level: 1, name: /2026 상반기 엔지니어 역량평가/ })).toBeInTheDocument()
    expect(screen.getByText("최종 반영 비율 100%")) .toBeInTheDocument()
    expect(screen.getByText("선택 과제")) .toBeInTheDocument()
    expect(screen.getByText("OTS 시나리오 제작", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByText("DX 툴 활용", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "성장·탐구 계획서" })).toBeInTheDocument()
    expect(screen.getByText("그대로 실행할 수 있는 OTS 시나리오 기획서", { exact: false })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "수행자" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "평가자" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "운영자" })).toBeInTheDocument()
  })

  it("shows OTS education separately from the general evaluation composition", () => {
    const snapshot = createSeedSnapshot()
    const model = selectSeasonOverview({
      ...snapshot,
      tasks: [...snapshot.tasks, {
        id: "task-ots-education",
        cycleId: "cycle-2026-h1",
        name: "OTS 시나리오 제작 교육",
        description: "교육 담당자 대상 과제",
        method: "derived_score",
        weight: 70,
        order: 7,
        items: [],
      }],
    }, "cycle-2026-h1")
    if (model === null) throw new Error("season fixture is missing")

    render(<SeasonOverview backendMode="local" model={model} />)

    expect(screen.getByRole("heading", { name: "교육 담당자 전용 과제" })).toBeInTheDocument()
    expect(screen.getByText("일반 평가 합계 제외")).toBeInTheDocument()
    expect(screen.getAllByText((_content, element) => (
      element?.tagName === "P"
      && element.textContent?.includes("35 + 35 + 10 + 10 + 10") === true
      && element.textContent.includes("100%")
    ))).not.toHaveLength(0)
  })

  it("marks Supabase-backed content as operating data", () => {
    const model = selectSeasonOverview(createSeedSnapshot(), "cycle-2026-h1")
    if (model === null) throw new Error("season fixture is missing")

    render(<SeasonOverview backendMode="supabase" model={model} />)

    expect(screen.getByText("운영 데이터")) .toBeInTheDocument()
  })
})
