import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { isVerifiedSourceRecord } from "./source-record-verification"

describe("isVerifiedSourceRecord", () => {
  it("keeps legacy seed records authoritative when no review event exists", () => {
    const snapshot = createSeedSnapshot()
    const record = snapshot.languageScoreRecords[0]

    if (record === undefined) throw new RangeError("seed language record missing")
    expect(isVerifiedSourceRecord(snapshot, record)).toBe(true)
  })

  it("excludes an engineer save until an operator verifies the current record", () => {
    const snapshot = createSeedSnapshot()
    const record = snapshot.languageScoreRecords[0]
    if (record === undefined) throw new RangeError("seed language record missing")
    const engineerSave = {
      id: "audit-engineer-save",
      cycleId: record.cycleId,
      type: "language_record_saved" as const,
      actorId: "engineer-user",
      actorRole: "engineer" as const,
      targetId: record.id,
      reason: null,
      createdAt: "2026-08-19T00:00:00.000Z",
    }
    const verified = {
      ...engineerSave,
      id: "audit-verified",
      type: "source_record_verified" as const,
      actorId: "operator-user",
      actorRole: "operator" as const,
      createdAt: "2026-08-19T00:01:00.000Z",
    }

    const pending = { ...snapshot, auditEvents: [...snapshot.auditEvents, engineerSave] }
    expect(isVerifiedSourceRecord(pending, record)).toBe(false)

    const approved = { ...pending, auditEvents: [...pending.auditEvents, verified] }
    expect(isVerifiedSourceRecord(approved, record)).toBe(true)

    const editedAgain = {
      ...approved,
      auditEvents: [
        ...approved.auditEvents,
        { ...engineerSave, id: "audit-engineer-resave", createdAt: "2026-08-19T00:02:00.000Z" },
      ],
    }
    expect(isVerifiedSourceRecord(editedAgain, record)).toBe(false)
  })
})
