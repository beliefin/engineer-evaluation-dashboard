import { describe, expect, it } from "vitest"

import { createSeedSnapshot } from "./seed"

describe("createSeedSnapshot", () => {
  it("creates the fixed sample cohort when called", () => {
    // Given

    // When
    const snapshot = createSeedSnapshot()

    // Then
    expect(snapshot.schemaVersion).toBe(8)
    expect(snapshot.cycles).toEqual([
      expect.objectContaining({ name: "2026 상반기", status: "active" }),
    ])
    expect(snapshot.engineers).toHaveLength(24)
    expect(new Set(snapshot.engineers.map((engineer) => engineer.team))).toEqual(
      new Set(["생산 1팀", "생산 2팀"]),
    )
    expect(snapshot.engineers.every((engineer) => engineer.division === "1부문")).toBe(true)
    expect(snapshot.engineers.every((engineer) => engineer.department.length > 0)).toBe(true)
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
    expect(snapshot.tasks.reduce((total, task) => total + task.weight, 0)).toBe(135)
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
    const growthTask = snapshot.tasks.find((task) => task.id === "task-growth-plan")
    expect(growthTask?.items.map((item) => item.label)).toEqual([
      "주제의 전략적 적합성과 집중도",
      "문제 인식 및 선정 배경의 설득력",
      "핵심 수행 활동의 체계성",
      "기술적 깊이 및 탐구 수준",
      "문제해결 역량 및 시행착오 분석",
      "성과의 가치 및 실용성",
      "기술적 통찰 및 실패의 자산화",
      "논리적 구성 및 발표 완성도",
      "데이터 및 근거 기반 객관성",
      "업무 연계성 및 조직 기여도",
    ])
    expect(growthTask?.items.every((item) =>
      item.criteria.map((criterion) => criterion.score).join(",") === "3,5,7,9"
    )).toBe(true)
    const otsTask = snapshot.tasks.find((task) => task.id === "task-ots-scenario")
    expect(otsTask?.items.map((item) => item.label)).toEqual([
      "시나리오 목적 및 현장 가치",
      "통제 변수의 공학적 합리성",
      "공정 현상의 화학공학적 메커니즘 규명",
      "위기 대응 및 트러블슈팅 로직 체계화",
      "조작 절차의 체계성 및 현실성",
      "지침서(교재)의 실질적 자산 가치",
      "운전 제어의 직관성 및 최적화",
      "시나리오 범용성 및 타 공정 확산성",
      "전담 공정 제어 논리 발표력",
      "객관적 근거 기반 교차 질의 방어력",
    ])
    expect(otsTask?.items.every((item) =>
      item.criteria.map((criterion) => criterion.score).join(",") === "3,5,7,9"
    )).toBe(true)
    const dxTask = snapshot.tasks.find((task) => task.id === "task-dx-tool")
    expect(dxTask?.items.map((item) => item.label)).toEqual([
      "주제 선정 및 문제 정의",
      "해결 전략 및 도구 적합성",
      "데이터 활용 및 근거 확보",
      "구현 설계의 논리성 및 구체화",
      "문제 해결 과정의 깊이",
      "결과물의 실질적 가치",
      "결과물의 사용 편의성",
      "확산 및 지속 가능성",
      "발표 구성 및 전달력",
      "발표 자료의 완성도",
    ])
    expect(dxTask?.items.every((item) =>
      item.criteria.map((criterion) => criterion.score).join(",") === "3,5,7,9"
    )).toBe(true)
    const certificationRules = snapshot.directScoreRules.filter(
      (rule) => rule.kind === "certification",
    )
    expect(certificationRules).toHaveLength(48)
    expect(certificationRules.find((rule) => rule.value === "화공기술사")).toEqual(
      expect.objectContaining({ score: 30, bonus: 15 }),
    )
    expect(certificationRules.find((rule) => rule.value === "필기 합격")).toEqual(
      expect.objectContaining({ score: 2, bonus: 0 }),
    )
    for (const task of snapshot.tasks.filter((entry) => entry.method === "evaluator_score")) {
      expect(task.items).toHaveLength(10)
    }
    expect(snapshot.assignments.every((assignment) => assignment.weight > 0)).toBe(true)
  })

  it("creates only engineer-specific evaluator assignments for applicable tasks", () => {
    // Given

    // When
    const snapshot = createSeedSnapshot()
    const firstEngineer = snapshot.engineers[0]

    // Then
    expect(firstEngineer).toBeDefined()
    const assignments = snapshot.assignments.filter(
      (assignment) => assignment.engineerId === firstEngineer?.id,
    )
    expect(assignments.length).toBeGreaterThan(0)
    expect(assignments.every((assignment) => {
      const personalWeight = snapshot.engineerTaskWeights.find((entry) =>
        entry.engineerId === firstEngineer?.id && entry.taskId === assignment.taskId)
      return personalWeight === undefined || personalWeight.weight > 0
    })).toBe(true)
    const evaluatorSets = snapshot.engineers.map((engineer) =>
      snapshot.assignments
        .filter((assignment) => assignment.engineerId === engineer.id)
        .map((assignment) => assignment.evaluatorId)
        .sort()
        .join(","),
    )
    expect(new Set(evaluatorSets).size).toBeGreaterThan(1)
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
