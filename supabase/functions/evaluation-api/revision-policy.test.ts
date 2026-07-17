import { describe, expect, it } from "vitest"

import { expectedRevisionForRequest } from "./revision-policy"

describe("expectedRevisionForRequest", () => {
  it("rebases scoped evaluator drafts onto the latest server revision", () => {
    expect(expectedRevisionForRequest({ operation: "save_draft", baseRevision: 4 }, 9)).toBe(9)
  })

  it("keeps full operator snapshot commits strict", () => {
    expect(expectedRevisionForRequest({ operation: "operator_commit", baseRevision: 4 }, 9)).toBe(4)
  })
})
