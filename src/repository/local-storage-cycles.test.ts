import { describe, expect, it } from "vitest"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"

const OPERATOR = { id: "operator-01", role: "operator" } as const
const SOURCE_CYCLE_ID = "cycle-2026-h1"

function createRepository() {
  return createLocalStorageEvaluationRepository({
    storage: new MemoryStorage(),
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

describe("LocalStorageEvaluationRepository season creation", () => {
  it("creates a season with independent copied task configuration and blank results", () => {
    const repository = createRepository()
    const source = repository.loadSnapshot()
    const sourceTasks = source.tasks.filter((task) => task.cycleId === SOURCE_CYCLE_ID)

    const updated = repository.createEvaluationCycle({
      sourceCycleId: SOURCE_CYCLE_ID,
      name: "2026 하반기",
      status: "setup",
      startsAt: "2026-07-01",
      endsAt: "2026-12-31",
      copyConfiguration: true,
      actor: OPERATOR,
    })
    const season = updated.cycles.at(-1)
    if (season === undefined) throw new RangeError("season missing")
    const tasks = updated.tasks.filter((task) => task.cycleId === season.id)
    const assignments = updated.assignments.filter((entry) => entry.cycleId === season.id)
    const assignmentIds = new Set(assignments.map((entry) => entry.id))
    const sheets = updated.scoreSheets.filter((sheet) => assignmentIds.has(sheet.assignmentId))

    expect(tasks).toHaveLength(sourceTasks.length)
    expect(new Set(tasks.map((task) => task.id))).not.toEqual(new Set(sourceTasks.map((task) => task.id)))
    expect(tasks.flatMap((task) => task.items).every((item) =>
      sourceTasks.flatMap((task) => task.items).every((sourceItem) => sourceItem.id !== item.id)
    )).toBe(true)
    expect(sheets.length).toBe(assignments.length)
    expect(sheets.every((sheet) => sheet.status === "draft" && sheet.submittedAt === null)).toBe(true)
    expect(updated.directScores.filter((score) => score.cycleId === season.id)).toHaveLength(
      updated.engineers.length * tasks.filter((task) => task.method.startsWith("operator")).length,
    )
    expect(updated.auditEvents.at(-1)?.type).toBe("cycle_created")
  })

  it("can start a season without copying task configuration", () => {
    const repository = createRepository()

    const updated = repository.createEvaluationCycle({
      sourceCycleId: SOURCE_CYCLE_ID,
      name: "빈 평가 시즌",
      status: "active",
      startsAt: "2027-01-01",
      endsAt: "2027-06-30",
      copyConfiguration: false,
      actor: OPERATOR,
    })
    const season = updated.cycles.at(-1)
    if (season === undefined) throw new RangeError("season missing")

    expect(updated.tasks.filter((task) => task.cycleId === season.id)).toHaveLength(0)
    expect(updated.assignments.filter((entry) => entry.cycleId === season.id)).toHaveLength(0)
    expect(updated.directScores.filter((entry) => entry.cycleId === season.id)).toHaveLength(0)
  })

  it("rejects duplicate season names and invalid periods", () => {
    const repository = createRepository()
    const duplicate = () => repository.createEvaluationCycle({
      sourceCycleId: SOURCE_CYCLE_ID,
      name: "2026 상반기",
      status: "setup",
      startsAt: "2026-07-01",
      endsAt: "2026-12-31",
      copyConfiguration: true,
      actor: OPERATOR,
    })
    const invalidPeriod = () => repository.createEvaluationCycle({
      sourceCycleId: SOURCE_CYCLE_ID,
      name: "기간 오류",
      status: "setup",
      startsAt: "2026-12-31",
      endsAt: "2026-07-01",
      copyConfiguration: true,
      actor: OPERATOR,
    })

    expect(duplicate).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }))
    expect(invalidPeriod).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }))
  })
})
