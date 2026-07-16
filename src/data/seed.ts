import {
  evaluationSnapshotSchema,
  type DirectScore,
  type Engineer,
  type EngineerTaskWeight,
  type EvaluationScheduleEvent,
  type EvaluationSnapshot,
  type EvaluationTask,
  type EvaluatorAssignment,
  type ScoreEntry,
  type ScoreSheet,
} from "@/domain"

import {
  CYCLE_ID,
  EVALUATORS,
  FIXED_TIMESTAMP,
  POSITIONS,
  TASKS,
  TEAMS,
} from "./seed-fixtures"
import { CERTIFICATION_SCORE_TABLE } from "./certification-score-table"
import { LANGUAGE_BONUS_TABLE, LANGUAGE_SCORE_TABLE } from "./language-score-table"
import { DEPARTMENTS_BY_TEAM } from "@/domain"
import { createSampleAchievementRecords } from "./seed-achievements"

type SampleState = "complete" | "in_progress" | "unconfirmed" | "unassigned"

function itemAt<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length]
  if (item === undefined) throw new RangeError("sample fixture must contain at least one item")
  return item
}

function stateAt(index: number): SampleState {
  if (index < 12) return "complete"
  if (index < 18) return "in_progress"
  if (index < 22) return "unconfirmed"
  return "unassigned"
}

function createEngineers(): ReadonlyArray<Engineer> {
  return Array.from({ length: 24 }, (_, index) => ({
    id: `engineer-${String(index + 1).padStart(2, "0")}`,
    employeeCode: `SAMPLE-${String(index + 1).padStart(3, "0")}`,
    displayName: `샘플 엔지니어 ${String(index + 1).padStart(2, "0")}`,
    division: "1부문",
    team: itemAt(TEAMS, index),
    department: itemAt(DEPARTMENTS_BY_TEAM[itemAt(TEAMS, index)], Math.floor(index / 2)),
    organizationUnit: null,
    position: itemAt(POSITIONS, index),
    jobTitle: null,
  }))
}

function selectedCoreTaskId(engineerIndex: number): string {
  return engineerIndex % 2 === 0 ? "task-dx-tool" : "task-ots-scenario"
}

function createEngineerTaskWeights(
  engineers: ReadonlyArray<Engineer>,
): ReadonlyArray<EngineerTaskWeight> {
  return engineers.flatMap((engineer, engineerIndex) =>
    TASKS.map((task) => ({
      cycleId: CYCLE_ID,
      engineerId: engineer.id,
      taskId: task.id,
      weight: task.id === "task-ots-scenario"
        ? (selectedCoreTaskId(engineerIndex) === task.id ? 35 : 0)
        : task.id === "task-dx-tool"
          ? (selectedCoreTaskId(engineerIndex) === task.id ? 35 : 0)
          : task.weight,
    })),
  )
}

function createScores(
  task: EvaluationTask,
  engineerIndex: number,
  evaluatorIndex: number,
  state: SampleState,
): ReadonlyArray<ScoreEntry> {
  return task.items.map((item, itemIndex) => ({
    itemId: item.id,
    score:
      state === "in_progress" &&
      task.id === selectedCoreTaskId(engineerIndex) &&
      evaluatorIndex === 0 &&
      itemIndex >= 6
        ? null
        : 6 + ((engineerIndex + evaluatorIndex + itemIndex) % 5),
  }))
}

type AssignmentBundle = Readonly<{
  assignments: ReadonlyArray<EvaluatorAssignment>
  scoreSheets: ReadonlyArray<ScoreSheet>
}>

function createAssignmentBundle(engineers: ReadonlyArray<Engineer>): AssignmentBundle {
  const assignments: EvaluatorAssignment[] = []
  const scoreSheets: ScoreSheet[] = []
  const evaluatorTasks = TASKS.filter(
    (task) => task.method === "evaluator_score" || task.method === "evaluator_pass_fail",
  )

  engineers.forEach((engineer, engineerIndex) => {
    const state = stateAt(engineerIndex)
    if (state === "unassigned") return

    for (const task of evaluatorTasks) {
      task.evaluatorWeights.forEach((definition, evaluatorIndex) => {
        const assignmentId = `${engineer.id}-${task.id}-${definition.evaluatorId}`
        const isSubmitted =
          state !== "in_progress" ||
          task.id !== selectedCoreTaskId(engineerIndex) ||
          evaluatorIndex > 0
        assignments.push({
          id: assignmentId,
          cycleId: CYCLE_ID,
          engineerId: engineer.id,
          evaluatorId: definition.evaluatorId,
          taskId: task.id,
        })
        scoreSheets.push({
          id: `sheet-${assignmentId}`,
          assignmentId,
          status: isSubmitted ? "submitted" : "draft",
          scores: task.method === "evaluator_score"
            ? createScores(task, engineerIndex, evaluatorIndex, state)
            : [],
          passResult: task.method === "evaluator_pass_fail" ? isSubmitted : null,
          updatedAt: FIXED_TIMESTAMP,
          submittedAt: isSubmitted ? FIXED_TIMESTAMP : null,
        })
      })
    }
  })

  return { assignments, scoreSheets }
}

function createDirectScores(engineers: ReadonlyArray<Engineer>): ReadonlyArray<DirectScore> {
  const operatorTasks = TASKS.filter(
    (task) => task.method === "operator_score" || task.method === "operator_pass_fail",
  )
  return engineers.flatMap((engineer, engineerIndex) => {
    const state = stateAt(engineerIndex)
    return operatorTasks.map((task, taskIndex) => ({
      id: `direct-${engineer.id}-${task.id}`,
      cycleId: CYCLE_ID,
      engineerId: engineer.id,
      taskId: task.id,
      score:
        task.method === "operator_score"
          ? state === "complete"
            ? 70 + ((engineerIndex * 3 + taskIndex * 7) % 26)
            : state === "unconfirmed" && task.id !== "task-proposal"
              ? 74 + ((engineerIndex + taskIndex) % 15)
              : state === "in_progress" && task.id === "task-language"
                ? 78 + (engineerIndex % 10)
                : null
          : null,
      passResult: task.method === "operator_pass_fail" && state === "complete" ? true : null,
      updatedAt: FIXED_TIMESTAMP,
    }))
  })
}

function createScheduleEvents(
  engineers: ReadonlyArray<Engineer>,
): ReadonlyArray<EvaluationScheduleEvent> {
  return [
    {
      id: "schedule-sample-01",
      cycleId: CYCLE_ID,
      engineerId: itemAt(engineers, 0).id,
      title: "성장탐구계획서 발표",
      date: "2026-05-18",
      startTime: "09:30",
      note: "샘플 일정 · 2층 회의실",
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    },
    {
      id: "schedule-sample-02",
      cycleId: CYCLE_ID,
      engineerId: itemAt(engineers, 5).id,
      title: "DX 툴 활용 발표",
      date: "2026-05-20",
      startTime: "14:00",
      note: null,
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    },
    {
      id: "schedule-sample-03",
      cycleId: CYCLE_ID,
      engineerId: itemAt(engineers, 12).id,
      title: "역량평가 발표",
      date: "2026-05-22",
      startTime: null,
      note: "발표 시간 미정",
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    },
  ]
}

export function createSeedSnapshot(): EvaluationSnapshot {
  const engineers = createEngineers()
  const bundle = createAssignmentBundle(engineers)
  const achievements = createSampleAchievementRecords(engineers)
  return evaluationSnapshotSchema.parse({
    schemaVersion: 6,
    cycles: [{
      id: CYCLE_ID,
      name: "2026 상반기",
      status: "active",
      locked: false,
      startsAt: "2026-01-02",
      endsAt: "2026-06-30",
    }],
    tasks: TASKS,
    engineerTaskWeights: createEngineerTaskWeights(engineers),
    directScoreRules: [
      ...CERTIFICATION_SCORE_TABLE.map((entry, index) => ({
      id: `certification-rule-${String(index + 1).padStart(2, "0")}`,
      cycleId: CYCLE_ID,
      taskId: "task-certification",
      kind: "certification",
      label: entry[0],
      field: "certificateName",
      operator: "equals",
      value: entry[0],
      ruleType: "base",
      score: entry[4],
      bonus: entry[5],
      enabled: true,
      order: index + 1,
      category: entry[1],
      difficulty: entry[2],
      workRelevance: entry[3],
      })),
      ...LANGUAGE_SCORE_TABLE.map((entry, index) => ({
        id: `language-rule-${String(index + 1).padStart(2, "0")}`,
        cycleId: CYCLE_ID,
        taskId: "task-language",
        kind: "language" as const,
        label: `${entry.languageGroup === "english" ? "영어" : "제2외국어"} ${entry.examName} ${entry.result}`,
        field: "result" as const,
        operator: entry.operator,
        value: entry.result,
        ruleType: "base" as const,
        score: Math.min(100, entry.score),
        rawScore: entry.score > 100 ? entry.score : null,
        bonus: 0,
        enabled: true,
        order: CERTIFICATION_SCORE_TABLE.length + index + 1,
        category: entry.languageGroup === "english" ? "영어" : "제2외국어",
        languageGroup: entry.languageGroup,
        examName: entry.examName,
      })),
      ...LANGUAGE_BONUS_TABLE.map((entry, index) => ({
        id: `language-bonus-rule-${String(index + 1).padStart(2, "0")}`,
        cycleId: CYCLE_ID,
        taskId: "task-language",
        kind: "language" as const,
        label: entry.label,
        field: "result" as const,
        operator: "contains" as const,
        value: "*",
        ruleType: "bonus" as const,
        score: 0,
        bonus: entry.bonus,
        enabled: true,
        order: CERTIFICATION_SCORE_TABLE.length + LANGUAGE_SCORE_TABLE.length + index + 1,
        bonusCondition: entry.condition,
      })),
    ],
    engineers,
    evaluators: EVALUATORS,
    assignments: bundle.assignments,
    scoreSheets: bundle.scoreSheets,
    directScores: createDirectScores(engineers),
    scoreAdjustments: [],
    languageScoreRecords: achievements.languageScoreRecords,
    certificationRecords: achievements.certificationRecords,
    scheduleEvents: createScheduleEvents(engineers),
    auditEvents: [],
  })
}
