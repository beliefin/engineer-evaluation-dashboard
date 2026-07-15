import { describe, expect, it } from "vitest"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"

const OPERATOR = { id: "operator-01", role: "operator" } as const

function createRepository() {
  return createLocalStorageEvaluationRepository({
    storage: new MemoryStorage(),
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

describe("LocalStorageEvaluationRepository engineer lifecycle", () => {
  it("updates roster fields without replacing linked evaluation data", () => {
    const repository = createRepository()
    const before = repository.loadSnapshot()
    const engineer = before.engineers[0]
    expect(engineer).toBeDefined()
    if (engineer === undefined) return
    const assignmentIds = before.assignments
      .filter((assignment) => assignment.engineerId === engineer.id)
      .map((assignment) => assignment.id)
    const sheetIds = before.scoreSheets
      .filter((sheet) => assignmentIds.includes(sheet.assignmentId))
      .map((sheet) => sheet.id)

    const updated = repository.updateEngineer({
      cycleId: "cycle-2026-h1",
      engineerId: engineer.id,
      employeeCode: "EDIT-001",
      displayName: "수정 엔지니어",
      team: "생산 2팀",
      position: "선임 엔지니어",
      actor: OPERATOR,
    })

    expect(updated.engineers.find((entry) => entry.id === engineer.id)).toEqual({
      id: engineer.id,
      employeeCode: "EDIT-001",
      displayName: "수정 엔지니어",
      team: "생산 2팀",
      position: "선임 엔지니어",
    })
    expect(updated.assignments.filter((assignment) => assignment.engineerId === engineer.id))
      .toHaveLength(assignmentIds.length)
    expect(updated.scoreSheets.filter((sheet) => sheetIds.includes(sheet.id)))
      .toHaveLength(sheetIds.length)
    expect(updated.auditEvents.at(-1)).toEqual(
      expect.objectContaining({ type: "engineer_updated", targetId: engineer.id }),
    )
  })

  it("rejects a duplicate employee code while editing", () => {
    const repository = createRepository()
    const [engineer, duplicate] = repository.loadSnapshot().engineers
    expect(engineer).toBeDefined()
    expect(duplicate).toBeDefined()
    if (engineer === undefined || duplicate === undefined) return

    expect(() => repository.updateEngineer({
      cycleId: "cycle-2026-h1",
      engineerId: engineer.id,
      employeeCode: duplicate.employeeCode,
      displayName: engineer.displayName,
      team: engineer.team,
      position: engineer.position,
      actor: OPERATOR,
    })).toThrowError(expect.objectContaining({ code: "DUPLICATE_EMPLOYEE_CODE" }))
  })

  it("deletes an engineer and all records owned through that engineer", () => {
    const repository = createRepository()
    const before = repository.loadSnapshot()
    const engineer = before.engineers[0]
    expect(engineer).toBeDefined()
    if (engineer === undefined) return
    const assignmentIds = new Set(before.assignments
      .filter((assignment) => assignment.engineerId === engineer.id)
      .map((assignment) => assignment.id))

    const updated = repository.deleteEngineer({
      cycleId: "cycle-2026-h1",
      engineerId: engineer.id,
      actor: OPERATOR,
    })

    expect(updated.engineers.some((entry) => entry.id === engineer.id)).toBe(false)
    expect(updated.engineerTaskWeights.some((entry) => entry.engineerId === engineer.id)).toBe(false)
    expect(updated.assignments.some((entry) => entry.engineerId === engineer.id)).toBe(false)
    expect(updated.scoreSheets.some((sheet) => assignmentIds.has(sheet.assignmentId))).toBe(false)
    expect(updated.directScores.some((entry) => entry.engineerId === engineer.id)).toBe(false)
    expect(updated.languageScoreRecords.some((entry) => entry.engineerId === engineer.id)).toBe(false)
    expect(updated.certificationRecords.some((entry) => entry.engineerId === engineer.id)).toBe(false)
    expect(updated.scheduleEvents.some((entry) => entry.engineerId === engineer.id)).toBe(false)
    expect(updated.auditEvents.at(-1)).toEqual(
      expect.objectContaining({ type: "engineer_deleted", targetId: engineer.id }),
    )
  })
})
