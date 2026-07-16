import type {
  AuditEvent,
  EvaluationSnapshot,
  EvaluationTask,
  TaskEvaluatorWeight,
  Team,
} from "./types"
import type { VersionFourEvaluationSnapshot } from "./schema"
import { TEAMS } from "./types"
import type {
  LegacyEvaluationSnapshot,
  PreviousEvaluationSnapshot,
  VersionThreeEvaluationSnapshot,
} from "./legacy-schema"

const LEGACY_TEAM_MAP: Readonly<Record<string, Team>> = {
  "공정기술 1팀": "생산 1팀",
  "공정기술 2팀": "생산 2팀",
  설비기술팀: "생산 1팀",
  자동화기술팀: "생산 2팀",
}

function teamForLegacyValue(value: string, index: number): Team {
  if (value === TEAMS[0] || value === TEAMS[1]) return value
  return LEGACY_TEAM_MAP[value] ?? (index % 2 === 0 ? TEAMS[0] : TEAMS[1])
}

function taskId(cycleId: string, legacyKey: string): string {
  return `task-${cycleId}-${legacyKey}`
}

function evaluatorWeights(
  snapshot: VersionThreeEvaluationSnapshot,
  cycleId: string,
  category: "growth_plan" | "core_track",
): ReadonlyArray<TaskEvaluatorWeight> {
  const assignments = snapshot.assignments.filter(
    (entry) => entry.cycleId === cycleId && entry.category === category,
  )
  const evaluatorIds = Array.from(new Set(assignments.map((entry) => entry.evaluatorId)))
  return evaluatorIds.map((evaluatorId) => {
    const weights = assignments
      .filter((entry) => entry.evaluatorId === evaluatorId)
      .map((entry) => entry.weight)
    return {
      evaluatorId,
      weight: weights.reduce((total, value) => total + value, 0) / weights.length,
    }
  })
}

function tasksForCycle(
  snapshot: VersionThreeEvaluationSnapshot,
  cycle: VersionThreeEvaluationSnapshot["cycles"][number],
): ReadonlyArray<EvaluationTask> {
  const growthRubric = snapshot.rubrics.find((entry) => entry.category === "growth_plan")
  const coreRubric = snapshot.rubrics.find((entry) => entry.category === "core_track")
  const coreName = cycle.track === "ots"
    ? "OTS 시나리오 제작"
    : cycle.track === "dx"
      ? "DX 툴 활용"
      : "OTS / DX 과제"
  return [
    {
      id: taskId(cycle.id, "growth_plan"),
      cycleId: cycle.id,
      name: growthRubric?.label ?? "성장탐구계획서",
      description: "기존 평가 시즌에서 이전된 평가자 점수형 과제입니다.",
      method: "evaluator_score",
      weight: 35,
      order: 1,
      items: growthRubric?.items ?? [],
      evaluatorWeights: evaluatorWeights(snapshot, cycle.id, "growth_plan"),
    },
    {
      id: taskId(cycle.id, "core_track"),
      cycleId: cycle.id,
      name: coreName,
      description: "기존 OTS/DX 선택에서 이전된 평가자 점수형 과제입니다.",
      method: "evaluator_score",
      weight: 35,
      order: 2,
      items: coreRubric?.items ?? [],
      evaluatorWeights: evaluatorWeights(snapshot, cycle.id, "core_track"),
    },
    ...[
      ["language", "어학"],
      ["certification", "자격증"],
      ["proposal", "고등급제안"],
    ].map(([key, name], index) => ({
      id: taskId(cycle.id, key ?? "direct"),
      cycleId: cycle.id,
      name: name ?? "직접점수",
      description: "기존 직접점수에서 이전된 운영자 점수형 과제입니다.",
      method: "operator_score" as const,
      weight: 10,
      order: index + 3,
      items: [],
      evaluatorWeights: [],
    })),
  ]
}

function migratedAuditType(type: string): AuditEvent["type"] | null {
  switch (type) {
    case "sheet_submitted":
    case "sheet_reopened":
    case "direct_score_updated":
    case "language_record_saved":
    case "language_record_deleted":
    case "certification_record_saved":
    case "certification_record_deleted":
    case "cycle_created":
    case "engineer_added":
    case "evaluator_added":
    case "evaluator_updated":
    case "evaluator_deleted":
    case "schedule_event_created":
    case "schedule_event_updated":
    case "schedule_event_deleted":
    case "demo_reset":
      return type
    case "weight_updated":
    case "track_updated":
      return "task_saved"
    default:
      return null
  }
}

export function migrateVersionThreeSnapshot(
  previous: VersionThreeEvaluationSnapshot,
): EvaluationSnapshot {
  const tasks = previous.cycles.flatMap((cycle) => tasksForCycle(previous, cycle))
  return {
    schemaVersion: 5,
    cycles: previous.cycles.map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      status: cycle.status,
      locked: false,
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
    })),
    tasks,
    engineerTaskWeights: [],
    directScoreRules: [],
    engineers: previous.engineers.map((engineer, index) => ({
      ...engineer,
      team: teamForLegacyValue(engineer.team, index),
    })),
    evaluators: previous.evaluators.map((evaluator, index) => ({
      ...evaluator,
      team: teamForLegacyValue(evaluator.team, index),
    })),
    assignments: previous.assignments.map((assignment) => ({
      id: assignment.id,
      cycleId: assignment.cycleId,
      engineerId: assignment.engineerId,
      evaluatorId: assignment.evaluatorId,
      taskId: taskId(assignment.cycleId, assignment.category),
    })),
    scoreSheets: previous.scoreSheets.map((sheet) => ({
      ...sheet,
      passResult: null,
    })),
    directScores: previous.directScores.map((score) => ({
      id: score.id,
      cycleId: score.cycleId,
      engineerId: score.engineerId,
      taskId: taskId(score.cycleId, score.category),
      score: score.score,
      passResult: null,
      updatedAt: score.updatedAt,
    })),
    languageScoreRecords: previous.languageScoreRecords,
    certificationRecords: previous.certificationRecords,
    scheduleEvents: previous.scheduleEvents,
    auditEvents: previous.auditEvents.flatMap((event) => {
      const type = migratedAuditType(event.type)
      return type === null ? [] : [{ ...event, type }]
    }),
  }
}

export function migrateVersionFourSnapshot(
  previous: VersionFourEvaluationSnapshot,
): EvaluationSnapshot {
  return {
    ...previous,
    schemaVersion: 5,
    engineerTaskWeights: [],
    directScoreRules: [],
  }
}

export function migratePreviousSnapshot(
  previous: PreviousEvaluationSnapshot,
): EvaluationSnapshot {
  return migrateVersionThreeSnapshot({
    ...previous,
    schemaVersion: 3,
    languageScoreRecords: [],
    certificationRecords: [],
  })
}

export function migrateLegacySnapshot(
  legacy: LegacyEvaluationSnapshot,
): EvaluationSnapshot {
  return migratePreviousSnapshot({
    ...legacy,
    schemaVersion: 2,
    engineers: legacy.engineers.map((engineer, index) => ({
      ...engineer,
      team: teamForLegacyValue(engineer.team, index),
    })),
    evaluators: legacy.evaluators.map((evaluator, index) => ({
      ...evaluator,
      employeeCode: `LEGACY-EVAL-${String(index + 1).padStart(3, "0")}`,
      team: teamForLegacyValue(evaluator.team, index),
    })),
    scheduleEvents: [],
  })
}
