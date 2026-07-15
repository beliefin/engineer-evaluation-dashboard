import { describe, expect, it } from "vitest"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"

const OPERATOR = { id: "operator-01", role: "operator" } as const
const EVALUATOR = { id: "evaluator-01", role: "evaluator" } as const

function createRepository(storage: MemoryStorage) {
  return createLocalStorageEvaluationRepository({
    storage,
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

describe("LocalStorageEvaluationRepository schedule", () => {
  it("creates a presentation event", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"

    // When
    const created = repository.createScheduleEvent({
      cycleId: "cycle-2026-h1",
      engineerId,
      title: "성장탐구 발표",
      date: "2026-05-18",
      startTime: "09:30",
      note: "2층 회의실",
      actor: OPERATOR,
    })

    // Then
    expect(created.scheduleEvents.at(-1)).toEqual(
      expect.objectContaining({
        engineerId,
        title: "성장탐구 발표",
        date: "2026-05-18",
        startTime: "09:30",
        note: "2층 회의실",
        createdAt: FIXED_NOW,
      }),
    )
  })

  it("updates a presentation event", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"
    const created = repository.createScheduleEvent({
      cycleId: "cycle-2026-h1",
      engineerId,
      title: "성장탐구 발표",
      date: "2026-05-18",
      startTime: "09:30",
      note: "2층 회의실",
      actor: OPERATOR,
    })
    const eventId = created.scheduleEvents.at(-1)?.id ?? "missing-event"

    // When
    const updated = repository.updateScheduleEvent({
      eventId,
      engineerId,
      title: "성장탐구 최종 발표",
      date: "2026-05-19",
      startTime: null,
      note: null,
      actor: OPERATOR,
    })

    // Then
    expect(updated.scheduleEvents.find((event) => event.id === eventId)).toEqual(
      expect.objectContaining({
        title: "성장탐구 최종 발표",
        date: "2026-05-19",
        startTime: null,
        note: null,
        updatedAt: FIXED_NOW,
      }),
    )
  })

  it("deletes a presentation event", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"
    const created = repository.createScheduleEvent({
      cycleId: "cycle-2026-h1",
      engineerId,
      title: "삭제할 일정",
      date: "2026-05-18",
      startTime: null,
      note: null,
      actor: OPERATOR,
    })
    const eventId = created.scheduleEvents.at(-1)?.id ?? "missing-event"

    // When
    const deleted = repository.deleteScheduleEvent({ eventId, actor: OPERATOR })

    // Then
    expect(deleted.scheduleEvents.some((event) => event.id === eventId)).toBe(false)
  })

  it("rejects schedule changes from an evaluator", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"

    // When
    const action = () =>
      repository.createScheduleEvent({
        cycleId: "cycle-2026-h1",
        engineerId,
        title: "권한 없는 일정",
        date: "2026-05-18",
        startTime: null,
        note: null,
        actor: EVALUATOR,
      })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
  })

  it("rejects invalid calendar dates before writing storage", () => {
    // Given
    const storage = new MemoryStorage()
    const repository = createRepository(storage)
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"

    // When
    const action = () =>
      repository.createScheduleEvent({
        cycleId: "cycle-2026-h1",
        engineerId,
        title: "잘못된 일정",
        date: "2026-02-30",
        startTime: "25:10",
        note: null,
        actor: OPERATOR,
      })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }))
    expect(storage.storedValue()).toBeNull()
  })

  it("restores a created event from browser storage", () => {
    // Given
    const storage = new MemoryStorage()
    const repository = createRepository(storage)
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"
    repository.createScheduleEvent({
      cycleId: "cycle-2026-h1",
      engineerId,
      title: "저장 복원 일정",
      date: "2026-05-25",
      startTime: "10:00",
      note: null,
      actor: OPERATOR,
    })

    // When
    const restored = createRepository(storage).loadSnapshot()

    // Then
    expect(restored.scheduleEvents).toContainEqual(
      expect.objectContaining({ title: "저장 복원 일정", date: "2026-05-25" }),
    )
  })
})
