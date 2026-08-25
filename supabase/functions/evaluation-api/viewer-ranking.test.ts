import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "../../../src/data/seed"
import { selectEngineerDetail } from "../../../src/view-models/engineers"

import { profileSchema, snapshotSchema } from "./model"
import { projectViewerRankings } from "./viewer-ranking"

const SNAPSHOT = snapshotSchema.parse(createSeedSnapshot())

describe("projectViewerRankings", () => {
  it("matches the operator rank for every engineer without returning peer scores", () => {
    for (const engineer of SNAPSHOT.engineers) {
      const profile = profileSchema.parse({
        auth_user_id: "00000000-0000-4000-8000-000000000001",
        username: engineer.employeeCode,
        display_name: engineer.displayName,
        role: "engineer",
        roles: ["engineer"],
        evaluator_id: null,
        engineer_id: engineer.id,
        can_view_insights: false,
        active: true,
      })
      const rankings = projectViewerRankings(SNAPSHOT, profile)

      for (const cycle of SNAPSHOT.cycles) {
        const operatorDetail = selectEngineerDetail(
          createSeedSnapshot(),
          cycle.id,
          engineer.id,
          "operator",
        )
        const ranking = rankings.find((entry) => entry.cycleId === cycle.id)

        expect(ranking).toEqual({
          cycleId: cycle.id,
          engineerId: engineer.id,
          rank: operatorDetail?.story.rank ?? null,
          cohortCount: operatorDetail?.story.cohortCount ?? 0,
        })
        expect(ranking).not.toHaveProperty("score")
      }
    }
  })

  it("returns no personal ranking metadata to non-engineer roles", () => {
    const profile = profileSchema.parse({
      auth_user_id: "00000000-0000-4000-8000-000000000001",
      username: "operator",
      display_name: "운영자",
      role: "operator",
      roles: ["operator"],
      evaluator_id: null,
      engineer_id: null,
      can_view_insights: true,
      active: true,
    })

    expect(projectViewerRankings(SNAPSHOT, profile)).toEqual([])
  })
})
