import { describe, expect, it } from "vitest"

import { createLocalStorageEvaluationRepository } from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"

const OPERATOR = { id: "operator-01", role: "operator" } as const
const APPROVER = { id: "approver-01", role: "approver" } as const

function createRepository(storage: MemoryStorage) {
  return createLocalStorageEvaluationRepository({
    storage,
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

describe("LocalStorageEvaluationRepository roster registration", () => {
  it("adds engineers with the cycle roster, blank sheets, and null direct scores", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const before = repository.loadSnapshot()
    const expectedRoster = new Set(
      before.tasks
        .filter((task) => task.cycleId === "cycle-2026-h1")
        .flatMap((task) => task.evaluatorWeights.map(
          (entry) => `${task.id}:${entry.evaluatorId}`,
        )),
    )

    // When
    const updated = repository.addEngineers({
      cycleId: "cycle-2026-h1",
      engineers: [
        {
          employeeCode: "NEW-001",
          displayName: "신규 엔지니어",
          division: "1부문",
          team: "생산 1팀",
          department: "전자약품담당",
          position: "엔지니어",
        },
      ],
      actor: OPERATOR,
    })

    // Then
    const engineer = updated.engineers.find((entry) => entry.employeeCode === "NEW-001")
    expect(engineer).toBeDefined()
    const assignments = updated.assignments.filter(
      (assignment) => assignment.engineerId === engineer?.id,
    )
    expect(
      new Set(
        assignments.map(
          (assignment) => `${assignment.taskId}:${assignment.evaluatorId}`,
        ),
      ),
    ).toEqual(expectedRoster)
    expect(
      updated.scoreSheets.filter((sheet) =>
        assignments.some((assignment) => assignment.id === sheet.assignmentId),
      ),
    ).toHaveLength(assignments.length)
    expect(
      updated.scoreSheets
        .filter((sheet) => assignments.some((entry) => entry.id === sheet.assignmentId))
        .every(
          (sheet) =>
            sheet.status === "draft" && sheet.scores.every((score) => score.score === null),
        ),
    ).toBe(true)
    const operatorTaskIds = before.tasks
      .filter((task) => task.method.startsWith("operator"))
      .map((task) => task.id)
    expect(updated.directScores.filter((score) => score.engineerId === engineer?.id))
      .toHaveLength(operatorTaskIds.length)
    expect(updated.directScores
      .filter((score) => score.engineerId === engineer?.id)
      .every((score) => operatorTaskIds.includes(score.taskId) && score.score === null))
      .toBe(true)
  })

  it("rejects duplicate engineer codes in a batch atomically", () => {
    // Given
    const storage = new MemoryStorage()
    const repository = createRepository(storage)

    // When
    const action = () =>
      repository.addEngineers({
        cycleId: "cycle-2026-h1",
        engineers: [
          {
            employeeCode: "BATCH-001",
            displayName: "첫 번째",
            division: "1부문",
            team: "생산 1팀",
            department: "전자약품담당",
            position: "엔지니어",
          },
          {
            employeeCode: "batch-001",
            displayName: "두 번째",
            division: "1부문",
            team: "생산 2팀",
            department: "염화메탄담당",
            position: "엔지니어",
          },
        ],
        actor: OPERATOR,
      })

    // Then
    expect(action).toThrowError(
      expect.objectContaining({ code: "DUPLICATE_EMPLOYEE_CODE" }),
    )
    expect(storage.storedValue()).toBeNull()
  })

  it("keeps engineer registration operator-only", () => {
    // Given
    const repository = createRepository(new MemoryStorage())

    // When
    const action = () =>
      repository.addEngineers({
        cycleId: "cycle-2026-h1",
        engineers: [
          {
            employeeCode: "NEW-APPROVER",
            displayName: "승인자 등록 시도",
            division: "1부문",
            team: "생산 1팀",
            department: "전자약품담당",
            position: "엔지니어",
          },
        ],
        actor: APPROVER,
      })

    // Then
    expect(action).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }))
  })

  it("rejects an engineer code already stored in the roster", () => {
    // Given
    const storage = new MemoryStorage()
    const repository = createRepository(storage)
    const employeeCode = repository.loadSnapshot().engineers[0]?.employeeCode ?? "missing"

    // When
    const action = () =>
      repository.addEngineers({
        cycleId: "cycle-2026-h1",
        engineers: [
          {
            employeeCode,
            displayName: "중복 엔지니어",
            division: "1부문",
            team: "생산 1팀",
            department: "전자약품담당",
            position: "엔지니어",
          },
        ],
        actor: OPERATOR,
      })

    // Then
    expect(action).toThrowError(
      expect.objectContaining({ code: "DUPLICATE_EMPLOYEE_CODE" }),
    )
    expect(storage.storedValue()).toBeNull()
  })

  it("adds evaluators to the roster without silently changing task assignments", () => {
    // Given
    const repository = createRepository(new MemoryStorage())
    const before = repository.loadSnapshot()

    // When
    const updated = repository.addEvaluators({
      cycleId: "cycle-2026-h1",
      evaluators: [
        {
          employeeCode: "EVAL-NEW-01",
          displayName: "신규 평가자",
          division: "1부문",
          team: "생산 2팀",
          department: "염화메탄담당",
        },
      ],
      actor: OPERATOR,
    })

    // Then
    const evaluator = updated.evaluators.find(
      (entry) => entry.employeeCode === "EVAL-NEW-01",
    )
    expect(evaluator).toBeDefined()
    const assignments = updated.assignments.filter(
      (assignment) => assignment.evaluatorId === evaluator?.id,
    )
    expect(assignments).toHaveLength(0)
    expect(updated.assignments).toHaveLength(before.assignments.length)
    expect(updated.tasks).toEqual(before.tasks)
  })

  it("rejects an existing evaluator code without persisting part of the batch", () => {
    // Given
    const storage = new MemoryStorage()
    const repository = createRepository(storage)
    const employeeCode = repository.loadSnapshot().evaluators[0]?.employeeCode ?? "missing"

    // When
    const action = () =>
      repository.addEvaluators({
        cycleId: "cycle-2026-h1",
        evaluators: [
          {
            employeeCode: "VALID-NEW",
            displayName: "정상",
            division: "1부문",
            team: "생산 1팀",
            department: "전자약품담당",
          },
          {
            employeeCode,
            displayName: "중복",
            division: "1부문",
            team: "생산 2팀",
            department: "염화메탄담당",
          },
        ],
        actor: OPERATOR,
      })

    // Then
    expect(action).toThrowError(
      expect.objectContaining({ code: "DUPLICATE_EMPLOYEE_CODE" }),
    )
    expect(storage.storedValue()).toBeNull()
  })

  it("restores a newly registered engineer from browser storage", () => {
    // Given
    const storage = new MemoryStorage()
    const repository = createRepository(storage)
    repository.addEngineers({
      cycleId: "cycle-2026-h1",
      engineers: [
        {
          employeeCode: "RESTORE-001",
          displayName: "복원 대상",
          division: "1부문",
          team: "생산 2팀",
          department: "염화메탄담당",
          position: "선임 엔지니어",
        },
      ],
      actor: OPERATOR,
    })

    // When
    const restored = createRepository(storage).loadSnapshot()

    // Then
    expect(restored.engineers).toContainEqual(
      expect.objectContaining({ employeeCode: "RESTORE-001", displayName: "복원 대상" }),
    )
  })
})
