import { describe, expect, it } from "vitest"

import { maintenanceSchema } from "./operator-maintenance"

describe("operator maintenance response", () => {
  it("labels system audit events when the actor name is null", () => {
    const parsed = maintenanceSchema.parse({
      backups: [],
      auditEvents: [{
        id: "943",
        actorName: null,
        actorRole: "system",
        operation: "dual_role_backfill_and_evaluator_preset",
        targetId: null,
        revision: 938,
        metadata: {},
        createdAt: "2026-07-21T09:08:38.581902Z",
      }],
      currentRevision: 938,
    })

    expect(parsed.auditEvents[0]?.actorName).toBe("시스템")
  })
})
