import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { selectEngineerPortal } from "./engineer-portal"

describe("selectEngineerPortal", () => {
  it("selects only the linked engineer result and source records", () => {
    // Given
    const snapshot = createSeedSnapshot()
    const engineerId = "engineer-01"
    const expectedLanguageIds = snapshot.languageScoreRecords
      .filter((record) => record.cycleId === "cycle-2026-h1" && record.engineerId === engineerId)
      .map((record) => record.id)
    const expectedCertificationIds = snapshot.certificationRecords
      .filter((record) => record.cycleId === "cycle-2026-h1" && record.engineerId === engineerId)
      .map((record) => record.id)

    // When
    const model = selectEngineerPortal(snapshot, "cycle-2026-h1", engineerId)

    // Then
    expect(model?.detail.engineer.id).toBe(engineerId)
    expect(model?.detail.evaluatorScores).toEqual([])
    expect(model?.languageRecords.map((record) => record.id)).toEqual(expectedLanguageIds)
    expect(model?.certificationRecords.map((record) => record.id)).toEqual(expectedCertificationIds)
  })
})
