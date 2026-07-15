import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "./seed"

describe("createSeedSnapshot", () => {
  it("creates the fixed sample cohort when called", () => {
    // Given

    // When
    const snapshot = createSeedSnapshot()

    // Then
    expect(snapshot.schemaVersion).toBe(5)
    expect(snapshot.cycles).toEqual([
      expect.objectContaining({ name: "2026 상반기", status: "active" }),
    ])
    expect(snapshot.engineers).toHaveLength(24)
    expect(new Set(snapshot.engineers.map((engineer) => engineer.team))).toEqual(
      new Set(["생산 1팀", "생산 2팀"]),
    )
    expect(snapshot.evaluators).toHaveLength(5)
    expect(snapshot.evaluators.every((evaluator) => evaluator.employeeCode.length > 0)).toBe(true)
    expect(snapshot.scheduleEvents.length).toBeGreaterThan(0)
  })

  it("uses six season tasks with configurable evaluator and operator methods", () => {
    // Given

    // When
    const snapshot = createSeedSnapshot()

    // Then
    expect(snapshot.tasks.map((task) => task.name)).toEqual([
      "성장탐구계획서",
      "OTS 시나리오 제작",
      "DX 툴 활용",
      "어학",
      "자격증",
      "고등급제안",
    ])
    expect(snapshot.tasks.reduce((total, task) => total + task.weight, 0)).toBe(100)
    const firstEngineerWeights = snapshot.engineerTaskWeights.filter(
      (entry) => entry.engineerId === snapshot.engineers[0]?.id,
    )
    const secondEngineerWeights = snapshot.engineerTaskWeights.filter(
      (entry) => entry.engineerId === snapshot.engineers[1]?.id,
    )
    expect(firstEngineerWeights.find((entry) => entry.taskId === "task-ots-scenario")?.weight).toBe(0)
    expect(firstEngineerWeights.find((entry) => entry.taskId === "task-dx-tool")?.weight).toBe(35)
    expect(secondEngineerWeights.find((entry) => entry.taskId === "task-ots-scenario")?.weight).toBe(35)
    expect(secondEngineerWeights.find((entry) => entry.taskId === "task-dx-tool")?.weight).toBe(0)
    for (const task of snapshot.tasks.filter((entry) => entry.method === "evaluator_score")) {
      expect(task.items).toHaveLength(10)
      expect(task.items.map((item) => item.label)).toEqual(
        Array.from({ length: 10 }, (_, index) => `평가 항목 ${index + 1}`),
      )
      expect(task.evaluatorWeights).toHaveLength(5)
    }
  })

  it("creates assignments from each evaluator task configuration", () => {
    // Given

    // When
    const snapshot = createSeedSnapshot()
    const firstEngineer = snapshot.engineers[0]

    // Then
    expect(firstEngineer).toBeDefined()
    const assignments = snapshot.assignments.filter(
      (assignment) => assignment.engineerId === firstEngineer?.id,
    )
    const evaluatorTasks = snapshot.tasks.filter(
      (task) => task.method === "evaluator_score" || task.method === "evaluator_pass_fail",
    )
    expect(assignments).toHaveLength(
      evaluatorTasks.reduce((total, task) => total + task.evaluatorWeights.length, 0),
    )
    expect(new Set(assignments.map((assignment) => assignment.taskId))).toEqual(
      new Set(evaluatorTasks.map((task) => task.id)),
    )
  })

  it("contains complete, in-progress, unconfirmed, and unassigned examples", () => {
    // Given

    // When
    const snapshot = createSeedSnapshot()
    const assignedEngineerIds = new Set(
      snapshot.assignments.map((assignment) => assignment.engineerId),
    )
    const unassigned = snapshot.engineers.filter(
      (engineer) => !assignedEngineerIds.has(engineer.id),
    )
    const submittedEngineerIds = new Set(
      snapshot.scoreSheets
        .filter((sheet) => sheet.status === "submitted")
        .map((sheet) =>
          snapshot.assignments.find((assignment) => assignment.id === sheet.assignmentId),
        )
        .filter((assignment) => assignment !== undefined)
        .map((assignment) => assignment.engineerId),
    )
    const draftEngineerIds = new Set(
      snapshot.scoreSheets
        .filter((sheet) => sheet.status === "draft")
        .map((sheet) =>
          snapshot.assignments.find((assignment) => assignment.id === sheet.assignmentId),
        )
        .filter((assignment) => assignment !== undefined)
        .map((assignment) => assignment.engineerId),
    )
    const unconfirmed = snapshot.engineers.filter((engineer) => {
      const directScores = snapshot.directScores.filter(
        (score) => score.engineerId === engineer.id,
      )
      return (
        submittedEngineerIds.has(engineer.id) &&
        !draftEngineerIds.has(engineer.id) &&
        directScores.some((score) => score.score === null)
      )
    })

    // Then
    expect(unassigned).toHaveLength(2)
    expect(draftEngineerIds.size).toBeGreaterThan(0)
    expect(unconfirmed).toHaveLength(4)
    expect(snapshot.scoreSheets.some((sheet) => sheet.status === "submitted")).toBe(true)
  })

  it("returns deterministic values without sharing the top-level reference", () => {
    // Given

    // When
    const first = createSeedSnapshot()
    const second = createSeedSnapshot()

    // Then
    expect(second).toEqual(first)
    expect(second).not.toBe(first)
  })
})
