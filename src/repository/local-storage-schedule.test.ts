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
  it("creates linked presentation events for multiple engineers in one transaction", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const snapshot = repository.loadSnapshot()
    const assignment = snapshot.assignments[0]
    if (assignment === undefined) throw new RangeError("assignment fixture missing")
    const sameTaskAssignment = snapshot.assignments.find((entry) =>
      entry.taskId === assignment.taskId && entry.engineerId !== assignment.engineerId)
    if (sameTaskAssignment === undefined) throw new RangeError("second assignment fixture missing")

    // When
    const created = repository.createScheduleEvents({
      cycleId: assignment.cycleId,
      engineerIds: [assignment.engineerId, sameTaskAssignment.engineerId],
      parallel: true,
      taskId: assignment.taskId,
      title: "성장탐구 발표",
      date: "2026-05-18",
      startTime: "09:30",
      note: "2층 회의실",
      actor: OPERATOR,
    })

    // Then
    expect(created.scheduleEvents.slice(-2)).toEqual([
      expect.objectContaining({
        engineerId: assignment.engineerId,
        taskId: assignment.taskId,
        presentationGroupId: expect.any(String),
      }),
      expect.objectContaining({
        engineerId: sameTaskAssignment.engineerId,
        taskId: assignment.taskId,
        presentationGroupId: expect.any(String),
      }),
    ])
    expect(created.scheduleEvents.at(-1)?.presentationGroupId).toBe(
      created.scheduleEvents.at(-2)?.presentationGroupId,
    )
  })

  it("updates a presentation event", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const engineerId = repository.loadSnapshot().engineers[0]?.id ?? "missing-engineer"
    const created = repository.createScheduleEvent({
      cycleId: "cycle-2026-h1",
      engineerId,
      taskId: "task-growth-plan",
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
      taskId: "task-growth-plan",
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
      taskId: "task-growth-plan",
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
        taskId: "task-growth-plan",
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
        taskId: "task-growth-plan",
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
      taskId: "task-growth-plan",
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
