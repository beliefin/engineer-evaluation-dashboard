import { describe, expect, it } from "vitest"

import { findMissingLinkedRosterIds } from "./roster-integrity"

describe("findMissingLinkedRosterIds", () => {
  it("reports linked evaluators and engineers omitted from an operator snapshot", () => {
    expect(findMissingLinkedRosterIds(
      {
        evaluators: [{ id: "evaluator-kept" }],
        engineers: [{ id: "engineer-kept" }],
      },
      [
        { evaluator_id: "evaluator-kept", engineer_id: null },
        { evaluator_id: "evaluator-removed", engineer_id: "engineer-removed" },
      ],
    )).toEqual({
      evaluatorIds: ["evaluator-removed"],
      engineerIds: ["engineer-removed"],
    })
  })

  it("returns no missing IDs when every linked roster member remains", () => {
    expect(findMissingLinkedRosterIds(
      {
        evaluators: [{ id: "evaluator-01" }],
        engineers: [{ id: "engineer-01" }],
      },
      [{ evaluator_id: "evaluator-01", engineer_id: "engineer-01" }],
    )).toEqual({ evaluatorIds: [], engineerIds: [] })
  })
})
