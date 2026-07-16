import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "@/data/seed"
import {
  legacyEvaluationSnapshotSchema,
  previousEvaluationSnapshotSchema,
  versionThreeEvaluationSnapshotSchema,
} from "@/domain"

import {
  createLocalStorageEvaluationRepository,
  LEGACY_LOCAL_STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  OLDEST_LOCAL_STORAGE_KEY,
  PREVIOUS_LOCAL_STORAGE_KEY,
  VERSION_FOUR_LOCAL_STORAGE_KEY,
  VERSION_FIVE_LOCAL_STORAGE_KEY,
} from "./local-storage"
import { createTestIdFactory, FIXED_NOW, MemoryStorage } from "./test-utils"

function createRepository(storage: MemoryStorage) {
  return createLocalStorageEvaluationRepository({
    storage,
    now: () => FIXED_NOW,
    idFactory: createTestIdFactory(),
  })
}

function createVersionThreeSnapshot() {
  const seed = createSeedSnapshot()
  const growth = seed.tasks.find((task) => task.id === "task-growth-plan")
  const core = seed.tasks.find((task) => task.id === "task-dx-tool")
  if (growth === undefined || core === undefined) throw new RangeError("migration fixture tasks missing")
  const taskCategory = new Map([
    [growth.id, "growth_plan"],
    [core.id, "core_track"],
  ] as const)
  const assignments = seed.assignments.flatMap((assignment) => {
    const category = taskCategory.get(assignment.taskId)
    if (category === undefined) return []
    const task = category === "growth_plan" ? growth : core
    const weight = task.evaluatorWeights.find(
      (entry) => entry.evaluatorId === assignment.evaluatorId,
    )?.weight
    return weight === undefined ? [] : [{ ...assignment, category, weight }]
  })
  const assignmentIds = new Set(assignments.map((assignment) => assignment.id))
  const directTaskCategory = new Map<string, "language" | "certification" | "proposal">([
    ["task-language", "language"],
    ["task-certification", "certification"],
    ["task-proposal", "proposal"],
  ] as const)
  return versionThreeEvaluationSnapshotSchema.parse({
    schemaVersion: 3,
    cycles: seed.cycles.map((cycle) => ({ ...cycle, track: "dx" })),
    engineers: seed.engineers,
    evaluators: seed.evaluators,
    assignments,
    rubrics: [
      { id: "rubric-growth", category: "growth_plan", label: growth.name, items: growth.items },
      { id: "rubric-core", category: "core_track", label: core.name, items: core.items },
    ],
    scoreSheets: seed.scoreSheets
      .filter((sheet) => assignmentIds.has(sheet.assignmentId))
      .map(({ passResult, ...sheet }) => {
        void passResult
        return sheet
      }),
    directScores: seed.directScores.flatMap((score) => {
      const category = directTaskCategory.get(score.taskId)
      return category === undefined ? [] : [{
        id: score.id,
        cycleId: score.cycleId,
        engineerId: score.engineerId,
        category,
        score: score.score,
        updatedAt: score.updatedAt,
      }]
    }),
    languageScoreRecords: seed.languageScoreRecords,
    certificationRecords: seed.certificationRecords,
    scheduleEvents: seed.scheduleEvents,
    auditEvents: [],
  })
}

function createVersionTwoSnapshot() {
  const versionThree = createVersionThreeSnapshot()
  const { languageScoreRecords, certificationRecords, ...rest } = versionThree
  void languageScoreRecords
  void certificationRecords
  return previousEvaluationSnapshotSchema.parse({ ...rest, schemaVersion: 2 })
}

function createVersionOneSnapshot() {
  const versionTwo = createVersionTwoSnapshot()
  const { scheduleEvents, ...rest } = versionTwo
  void scheduleEvents
  return legacyEvaluationSnapshotSchema.parse({
    ...rest,
    schemaVersion: 1,
    engineers: versionTwo.engineers.map((engineer, index) => ({
      ...engineer,
      team: index % 2 === 0 ? "공정기술 1팀" : "설비기술팀",
    })),
    evaluators: versionTwo.evaluators.map((evaluator) => ({
      id: evaluator.id,
      displayName: evaluator.displayName,
      team: "기술운영",
    })),
  })
}

describe("LocalStorageEvaluationRepository loading", () => {
  it("Given empty storage When loaded Then it returns the deterministic v6 seed", () => {
    const storage = new MemoryStorage()

    expect(createRepository(storage).loadSnapshot()).toEqual(createSeedSnapshot())
    expect(storage.getItem(LOCAL_STORAGE_KEY)).toBeNull()
  })

  it("Given a v4 snapshot When loaded Then it adds empty engineer task overrides", () => {
    const seed = createSeedSnapshot()
    const { engineerTaskWeights, ...versionFour } = seed
    void engineerTaskWeights
    const storage = new MemoryStorage()
    storage.setItem(VERSION_FOUR_LOCAL_STORAGE_KEY, JSON.stringify({
      ...versionFour,
      schemaVersion: 4,
    }))

    const snapshot = createRepository(storage).loadSnapshot()

    expect(snapshot.schemaVersion).toBe(6)
    expect(snapshot.engineerTaskWeights).toEqual([])
    expect(snapshot.tasks).toEqual(seed.tasks)
  })

  it("Given current valid data When loaded Then it returns a parsed clone", () => {
    const seed = createSeedSnapshot()
    const snapshot = createRepository(new MemoryStorage(JSON.stringify(seed))).loadSnapshot()

    expect(snapshot).toEqual(seed)
    expect(snapshot).not.toBe(seed)
  })

  it("Given a v5 snapshot When loaded Then it assigns the fixed division and a team department", () => {
    const seed = createSeedSnapshot()
    const versionFive = {
      ...seed,
      schemaVersion: 5,
      engineers: seed.engineers.map(({ division, department, ...engineer }) => {
        void division
        void department
        return engineer
      }),
      evaluators: seed.evaluators.map(({ division, department, ...evaluator }) => {
        void division
        void department
        return evaluator
      }),
    }
    const storage = new MemoryStorage()
    storage.setItem(VERSION_FIVE_LOCAL_STORAGE_KEY, JSON.stringify(versionFive))

    const snapshot = createRepository(storage).loadSnapshot()

    expect(snapshot.schemaVersion).toBe(6)
    expect(snapshot.engineers.every((engineer) => engineer.division === "1부문")).toBe(true)
    expect(snapshot.engineers.find((engineer) => engineer.team === "생산 1팀")?.department).toBe("전자약품담당")
    expect(snapshot.engineers.find((engineer) => engineer.team === "생산 2팀")?.department).toBe("염화메탄담당")
  })

  it("Given malformed or unsupported data When loaded Then it recovers with the seed", () => {
    expect(createRepository(new MemoryStorage("{truncated")).loadSnapshot()).toEqual(
      createSeedSnapshot(),
    )
    expect(createRepository(new MemoryStorage(JSON.stringify({ schemaVersion: 99 }))).loadSnapshot()).toEqual(
      createSeedSnapshot(),
    )
  })

  it("Given a v3 snapshot When loaded Then it migrates categories and direct scores to season tasks", () => {
    const previous = createVersionThreeSnapshot()
    const storage = new MemoryStorage()
    storage.setItem(PREVIOUS_LOCAL_STORAGE_KEY, JSON.stringify(previous))

    const snapshot = createRepository(storage).loadSnapshot()

    expect(snapshot.schemaVersion).toBe(6)
    expect(snapshot.tasks.map((task) => task.name)).toEqual([
      "성장탐구계획서",
      "DX 툴 활용",
      "어학",
      "자격증",
      "고등급제안",
    ])
    expect(snapshot.assignments).toHaveLength(previous.assignments.length)
    expect(snapshot.scoreSheets.every((sheet) => sheet.passResult === null)).toBe(true)
    expect(snapshot.directScores.every((score) => score.taskId.length > 0)).toBe(true)
  })

  it("Given v2 and v1 snapshots When loaded Then roster teams and new task data are restored", () => {
    const versionTwoStorage = new MemoryStorage()
    versionTwoStorage.setItem(LEGACY_LOCAL_STORAGE_KEY, JSON.stringify(createVersionTwoSnapshot()))
    const versionOneStorage = new MemoryStorage()
    versionOneStorage.setItem(OLDEST_LOCAL_STORAGE_KEY, JSON.stringify(createVersionOneSnapshot()))

    const versionTwo = createRepository(versionTwoStorage).loadSnapshot()
    const versionOne = createRepository(versionOneStorage).loadSnapshot()

    expect(versionTwo.schemaVersion).toBe(6)
    expect(versionTwo.languageScoreRecords).toEqual([])
    expect(versionOne.schemaVersion).toBe(6)
    expect(versionOne.evaluators.every((evaluator) => evaluator.employeeCode.length > 0)).toBe(true)
    expect(versionOne.engineers.every((engineer) => engineer.team.startsWith("생산 "))).toBe(true)
  })
})
