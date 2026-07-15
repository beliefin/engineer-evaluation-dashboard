import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"
import { RepositoryError } from "./types"

const EVALUATOR = { id: "evaluator-01", role: "evaluator" } as const
const OPERATOR = { id: "operator-01", role: "operator" } as const

function createRepository(storage: MemoryStorage) {
  return createLocalStorageEvaluationRepository({
    storage,
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

function draftSheetId(): string {
  const sheet = createSeedSnapshot().scoreSheets.find((candidate) => candidate.status === "draft")
  return sheet?.id ?? "missing-draft-sheet"
}

describe("LocalStorageEvaluationRepository score sheets", () => {
  it("saves a partial draft and preserves zero as a real score", () => {
    // Given
    const storage = new MemoryStorage()
    const repository = createRepository(storage)
    const sheetId = draftSheetId()
    const sheet = repository.loadSnapshot().scoreSheets.find((candidate) => candidate.id === sheetId)
    const scores = (sheet?.scores ?? []).map((entry, index) => ({
      itemId: entry.itemId,
      score: index === 0 ? 0 : entry.score,
    }))

    // When
    const updated = repository.saveDraft({ sheetId, scores, actor: EVALUATOR })

    // Then
    expect(updated.scoreSheets.find((candidate) => candidate.id === sheetId)?.scores[0]?.score).toBe(0)
    expect(updated.scoreSheets.find((candidate) => candidate.id === sheetId)?.status).toBe("draft")
  })

  it("rejects an out-of-range draft without changing storage", () => {
    // Given
    const storage = new MemoryStorage()
    const repository = createRepository(storage)
    const sheetId = draftSheetId()
    const sheet = repository.loadSnapshot().scoreSheets.find((candidate) => candidate.id === sheetId)
    const scores = (sheet?.scores ?? []).map((entry, index) => ({
      itemId: entry.itemId,
      score: index === 0 ? 11 : entry.score,
    }))
    const before = storage.storedValue()

    // When
    const action = () => repository.saveDraft({ sheetId, scores, actor: EVALUATOR })

    // Then
    expect(action).toThrowError(RepositoryError)
    expect(storage.storedValue()).toBe(before)
  })

  it("submits a complete draft and appends one audit event", () => {
    // Given
    const storage = new MemoryStorage()
    const repository = createRepository(storage)
    const sheetId = draftSheetId()
    const sheet = repository.loadSnapshot().scoreSheets.find((candidate) => candidate.id === sheetId)
    const scores = (sheet?.scores ?? []).map((entry) => ({ itemId: entry.itemId, score: 8 }))
    repository.saveDraft({ sheetId, scores, actor: EVALUATOR })

    // When
    const updated = repository.submitSheet({ sheetId, actor: EVALUATOR })

    // Then
    expect(updated.scoreSheets.find((candidate) => candidate.id === sheetId)).toEqual(
      expect.objectContaining({ status: "submitted", submittedAt: FIXED_NOW }),
    )
    expect(updated.auditEvents.at(-1)).toEqual(
      expect.objectContaining({ type: "sheet_submitted", targetId: sheetId }),
    )
  })

  it("rejects submission while any rubric score is missing", () => {
    // Given
    const storage = new MemoryStorage()
    const repository = createRepository(storage)
    const sheetId = draftSheetId()

    // When
    const action = () => repository.submitSheet({ sheetId, actor: EVALUATOR })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "INCOMPLETE_SHEET" }))
    expect(storage.storedValue()).toBeNull()
  })

  it("keeps submitted sheets locked until an operator reopens them", () => {
    // Given
    const storage = new MemoryStorage(JSON.stringify(createSeedSnapshot()))
    const repository = createRepository(storage)
    const sheet = repository.loadSnapshot().scoreSheets.find(
      (candidate) => candidate.status === "submitted",
    )
    const sheetId = sheet?.id ?? "missing-submitted-sheet"

    // When
    const action = () =>
      repository.saveDraft({ sheetId, scores: sheet?.scores ?? [], actor: OPERATOR })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "SHEET_LOCKED" }))
  })

  it("reopens a submitted sheet with a reason and audit event", () => {
    // Given
    const storage = new MemoryStorage(JSON.stringify(createSeedSnapshot()))
    const repository = createRepository(storage)
    const sheetId = repository.loadSnapshot().scoreSheets.find(
      (candidate) => candidate.status === "submitted",
    )?.id ?? "missing-submitted-sheet"

    // When
    const updated = repository.reopenSheet({
      sheetId,
      actor: OPERATOR,
      reason: "증빙자료 재검토",
    })

    // Then
    expect(updated.scoreSheets.find((candidate) => candidate.id === sheetId)).toEqual(
      expect.objectContaining({ status: "draft", submittedAt: null }),
    )
    expect(updated.auditEvents.at(-1)).toEqual(
      expect.objectContaining({
        type: "sheet_reopened",
        reason: "증빙자료 재검토",
        targetId: sheetId,
      }),
    )
  })

  it("requires an operator to reopen a sheet", () => {
    // Given
    const repository = createRepository(new MemoryStorage(JSON.stringify(createSeedSnapshot())))
    const sheetId = repository.loadSnapshot().scoreSheets.find(
      (candidate) => candidate.status === "submitted",
    )?.id ?? "missing-submitted-sheet"

    // When
    const action = () => repository.reopenSheet({
      sheetId,
      actor: EVALUATOR,
      reason: "재검토",
    })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
  })

  it("requires a non-empty reason to reopen a sheet", () => {
    // Given
    const repository = createRepository(new MemoryStorage(JSON.stringify(createSeedSnapshot())))
    const sheetId = repository.loadSnapshot().scoreSheets.find(
      (candidate) => candidate.status === "submitted",
    )?.id ?? "missing-submitted-sheet"

    // When
    const action = () => repository.reopenSheet({
      sheetId,
      actor: OPERATOR,
      reason: "   ",
    })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "REASON_REQUIRED" }))
  })

  it("rejects an evaluator saving another evaluator's sheet", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const snapshot = repository.loadSnapshot()
    const sheet = snapshot.scoreSheets.find((candidate) => {
      const assignment = snapshot.assignments.find(
        (entry) => entry.id === candidate.assignmentId,
      )
      return assignment?.evaluatorId !== EVALUATOR.id
    })
    const sheetId = sheet?.id ?? "missing-foreign-draft"

    // When
    const action = () =>
      repository.saveDraft({ sheetId, scores: sheet?.scores ?? [], actor: EVALUATOR })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
  })

  it("allows an operator to save and submit any evaluator's sheet", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const snapshot = repository.loadSnapshot()
    const sheet = snapshot.scoreSheets.find((candidate) => candidate.status === "draft")
    const sheetId = sheet?.id ?? "missing-draft"
    const scores = (sheet?.scores ?? []).map((entry) => ({ itemId: entry.itemId, score: 9 }))
    repository.saveDraft({ sheetId, scores, actor: OPERATOR })

    // When
    const updated = repository.submitSheet({ sheetId, actor: OPERATOR })

    // Then
    expect(updated.scoreSheets.find((candidate) => candidate.id === sheetId)?.status).toBe(
      "submitted",
    )
    expect(updated.auditEvents.at(-1)).toEqual(
      expect.objectContaining({ actorId: OPERATOR.id, actorRole: "operator" }),
    )
  })

  it("rejects an evaluator submitting another evaluator's complete sheet", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const snapshot = repository.loadSnapshot()
    const sheet = snapshot.scoreSheets.find((candidate) => {
      const assignment = snapshot.assignments.find(
        (entry) => entry.id === candidate.assignmentId,
      )
      return candidate.status === "submitted" && assignment?.evaluatorId !== EVALUATOR.id
    })
    const sheetId = sheet?.id ?? "missing-foreign-sheet"

    // When
    const action = () => repository.submitSheet({ sheetId, actor: EVALUATOR })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
  })
})
