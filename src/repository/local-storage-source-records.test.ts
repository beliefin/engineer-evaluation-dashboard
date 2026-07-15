import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"

const OPERATOR = { id: "operator-01", role: "operator" } as const
const APPROVER = { id: "approver-01", role: "approver" } as const
const ENGINEER = { id: "engineer-11", role: "engineer" } as const
const CYCLE_ID = "cycle-2026-h1"

function createRepository() {
  return createLocalStorageEvaluationRepository({
    storage: new MemoryStorage(),
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

function engineerIdWithoutSeedRecords(): string {
  const id = createSeedSnapshot().engineers[10]?.id
  if (id === undefined) throw new RangeError("seed engineer was not created")
  return id
}

describe("LocalStorageEvaluationRepository source records", () => {
  it("adds and updates a language score without changing the converted score", () => {
    const repository = createRepository()
    const engineerId = engineerIdWithoutSeedRecords()
    const beforeScore = repository.loadSnapshot().directScores.find(
      (score) => score.engineerId === engineerId && score.taskId === "task-language",
    )?.score

    const created = repository.saveLanguageScoreRecord({
      recordId: null,
      cycleId: CYCLE_ID,
      engineerId,
      examName: "TOEIC",
      result: "910",
      acquiredOn: "2026-02-03",
      note: "원본 성적표 확인",
      actor: OPERATOR,
    })
    const record = created.languageScoreRecords.find(
      (candidate) => candidate.engineerId === engineerId,
    )
    if (record === undefined) throw new RangeError("language record was not created")

    const updated = repository.saveLanguageScoreRecord({
      recordId: record.id,
      cycleId: CYCLE_ID,
      engineerId,
      examName: "TOEIC",
      result: "930",
      acquiredOn: "2026-02-03",
      note: null,
      actor: OPERATOR,
    })

    expect(updated.languageScoreRecords.find((candidate) => candidate.id === record.id)?.result).toBe("930")
    expect(updated.directScores.find(
      (score) => score.engineerId === engineerId && score.taskId === "task-language",
    )?.score).toBe(beforeScore)
    expect(updated.auditEvents.at(-1)?.type).toBe("language_record_saved")
  })

  it("adds and deletes a certification record with audit events", () => {
    const repository = createRepository()
    const engineerId = engineerIdWithoutSeedRecords()
    const created = repository.saveCertificationRecord({
      recordId: null,
      cycleId: CYCLE_ID,
      engineerId,
      certificateName: "산업안전기사",
      grade: "기사",
      acquiredOn: "2025-11-10",
      issuer: "한국산업인력공단",
      actor: OPERATOR,
    })
    const record = created.certificationRecords.find(
      (candidate) => candidate.engineerId === engineerId,
    )
    if (record === undefined) throw new RangeError("certification record was not created")

    const deleted = repository.deleteCertificationRecord({ recordId: record.id, actor: OPERATOR })

    expect(deleted.certificationRecords.some((candidate) => candidate.id === record.id)).toBe(false)
    expect(deleted.auditEvents.at(-1)?.type).toBe("certification_record_deleted")
  })

  it("keeps source record mutations operator-only", () => {
    const repository = createRepository()
    const action = () => repository.saveLanguageScoreRecord({
      recordId: null,
      cycleId: CYCLE_ID,
      engineerId: engineerIdWithoutSeedRecords(),
      examName: "OPIc",
      result: "IH",
      acquiredOn: null,
      note: null,
      actor: APPROVER,
    })

    expect(action).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
  })

  it("lets an engineer save only their own source records", () => {
    // Given
    const repository = createRepository()

    // When
    const saved = repository.saveLanguageScoreRecord({
      recordId: null,
      cycleId: CYCLE_ID,
      engineerId: ENGINEER.id,
      examName: "OPIc",
      result: "IH",
      acquiredOn: "2026-06-01",
      note: null,
      actor: ENGINEER,
    })

    // Then
    expect(saved.languageScoreRecords).toContainEqual(expect.objectContaining({
      engineerId: ENGINEER.id,
      examName: "OPIc",
      result: "IH",
    }))
  })

  it("rejects an engineer writing another engineer's source records", () => {
    // Given
    const repository = createRepository()

    // When
    const action = () => repository.saveCertificationRecord({
      recordId: null,
      cycleId: CYCLE_ID,
      engineerId: "engineer-12",
      certificateName: "산업안전기사",
      grade: null,
      acquiredOn: null,
      issuer: null,
      actor: ENGINEER,
    })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
  })

  it("rejects a source record with a missing required result", () => {
    const repository = createRepository()
    const action = () => repository.saveLanguageScoreRecord({
      recordId: null,
      cycleId: CYCLE_ID,
      engineerId: engineerIdWithoutSeedRecords(),
      examName: "TOEIC",
      result: "",
      acquiredOn: null,
      note: null,
      actor: OPERATOR,
    })

    expect(action).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }))
  })

  it("marks an engineer-authored source record verified and reopens review after an edit", () => {
    // Given
    const repository = createRepository()
    const created = repository.saveLanguageScoreRecord({
      recordId: null,
      cycleId: CYCLE_ID,
      engineerId: ENGINEER.id,
      examName: "OPIc",
      result: "IH",
      acquiredOn: "2026-06-01",
      note: null,
      actor: ENGINEER,
    })
    const record = created.languageScoreRecords.find((entry) => entry.engineerId === ENGINEER.id)
    if (record === undefined) throw new RangeError("language record was not created")

    // When
    const verified = repository.verifySourceRecord({
      recordId: record.id,
      recordKind: "language",
      actor: OPERATOR,
    })

    // Then
    expect(verified.auditEvents.at(-1)).toEqual(expect.objectContaining({
      type: "source_record_verified",
      targetId: record.id,
      actorRole: "operator",
    }))

    // When
    const edited = repository.saveLanguageScoreRecord({
      recordId: record.id,
      cycleId: CYCLE_ID,
      engineerId: ENGINEER.id,
      examName: "OPIc",
      result: "AL",
      acquiredOn: "2026-06-01",
      note: null,
      actor: ENGINEER,
    })

    // Then
    expect(edited.auditEvents.at(-1)).toEqual(expect.objectContaining({
      type: "language_record_saved",
      targetId: record.id,
      actorRole: "engineer",
    }))
  })

  it("rejects source record verification by a non-operator", () => {
    // Given
    const repository = createRepository()
    const recordId = repository.loadSnapshot().languageScoreRecords[0]?.id
    if (recordId === undefined) throw new RangeError("seed language record was not created")

    // When
    const action = () => repository.verifySourceRecord({
      recordId,
      recordKind: "language",
      actor: APPROVER,
    })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
  })
})
