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
    expect(screen.getByText("개인별 최종 반영 100%")) .toBeInTheDocument()
    expect(screen.getByText("선택형 심화 과제")) .toBeInTheDocument()
    expect(screen.getByText("OTS 시나리오 제작", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByText("DX 툴 활용", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "성장탐구계획서" })).toBeInTheDocument()
    expect(screen.getByText("시나리오 표준 기획서", { exact: false })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "수행자" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "평가자" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "운영자" })).toBeInTheDocument()
  })

  it("marks Supabase-backed content as operating data", () => {
    const model = selectSeasonOverview(createSeedSnapshot(), "cycle-2026-h1")
    if (model === null) throw new Error("season fixture is missing")

    render(<SeasonOverview backendMode="supabase" model={model} />)

    expect(screen.getByText("운영 데이터")) .toBeInTheDocument()
  })
})
