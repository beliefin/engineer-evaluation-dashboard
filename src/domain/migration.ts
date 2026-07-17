import type {
  AuditEvent,
  Department,
  EvaluationSnapshot,
  EvaluationTask,
  Team,
} from "./types"
import type { VersionFourEvaluationSnapshot } from "./schema"
import type { VersionFiveEvaluationSnapshot } from "./schema"
import type { VersionSixEvaluationSnapshot } from "./schema"
import type { VersionSevenEvaluationSnapshot } from "./schema"
import { DEPARTMENTS_BY_TEAM, TEAMS } from "./types"
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

function defaultDepartment(team: Team): Department {
  return DEPARTMENTS_BY_TEAM[team][0]
}

function organizationForTeam(team: Team) {
  return { division: "1부문" as const, department: defaultDepartment(team) }
}

const emptyEngineerMetadata = { organizationUnit: null, jobTitle: null } as const
const emptyEvaluatorMetadata = { organizationUnit: null, rank: null, jobTitle: null } as const

function taskId(cycleId: string, legacyKey: string): string {
  return `task-${cycleId}-${legacyKey}`
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
      items: growthRubric?.items.map((item) => ({
        ...item,
        section: null,
        criteria: [],
      })) ?? [],
    },
    {
      id: taskId(cycle.id, "core_track"),
      cycleId: cycle.id,
      name: coreName,
      description: "기존 OTS/DX 선택에서 이전된 평가자 점수형 과제입니다.",
      method: "evaluator_score",
      weight: 35,
      order: 2,
      items: coreRubric?.items.map((item) => ({
        ...item,
        section: null,
        criteria: [],
      })) ?? [],
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
    })),
  ]
}

type ConfiguredSnapshot = Pick<
  VersionSixEvaluationSnapshot,
  "tasks" | "assignments" | "scoreSheets"
>

function migrateConfiguredArtifacts(previous: ConfiguredSnapshot) {
  const scoreSheetByAssignment = new Map(
    previous.scoreSheets.map((sheet) => [sheet.assignmentId, sheet]),
  )
  const preservedAssignments = previous.assignments.filter((assignment) => {
    const sheet = scoreSheetByAssignment.get(assignment.id)
    return sheet?.status === "submitted" ||
      sheet?.passResult !== null && sheet?.passResult !== undefined ||
      sheet?.scores.some((score) => score.score !== null) === true
  })
  const preservedIds = new Set(preservedAssignments.map((assignment) => assignment.id))
  return {
    tasks: previous.tasks.map((legacyTask) => {
      const { evaluatorWeights, ...task } = legacyTask
      void evaluatorWeights
      return task
    }),
    assignments: preservedAssignments.map((assignment) => {
      const task = previous.tasks.find((candidate) => candidate.id === assignment.taskId)
      return {
        ...assignment,
        weight: task?.evaluatorWeights.find(
          (entry) => entry.evaluatorId === assignment.evaluatorId,
        )?.weight ?? 1,
      }
    }),
    scoreSheets: previous.scoreSheets.filter((sheet) => preservedIds.has(sheet.assignmentId)),
  }
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
    schemaVersion: 8,
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
    derivedScoreRules: [],
    evaluationBenchmarks: [],
    engineers: previous.engineers.map((engineer, index) => ({
      ...engineer,
      team: teamForLegacyValue(engineer.team, index),
      ...organizationForTeam(teamForLegacyValue(engineer.team, index)),
      ...emptyEngineerMetadata,
    })),
    evaluators: previous.evaluators.map((evaluator, index) => ({
      ...evaluator,
      team: teamForLegacyValue(evaluator.team, index),
      ...organizationForTeam(teamForLegacyValue(evaluator.team, index)),
      ...emptyEvaluatorMetadata,
    })),
    assignments: previous.assignments.map((assignment) => ({
      id: assignment.id,
      cycleId: assignment.cycleId,
      engineerId: assignment.engineerId,
      evaluatorId: assignment.evaluatorId,
      taskId: taskId(assignment.cycleId, assignment.category),
      weight: assignment.weight,
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
    scoreAdjustments: [],
    unlockRequests: [],
    languageScoreRecords: previous.languageScoreRecords,
    certificationRecords: previous.certificationRecords,
    scheduleEvents: previous.scheduleEvents.map((event) => ({ ...event, taskId: null })),
    auditEvents: previous.auditEvents.flatMap((event) => {
      const type = migratedAuditType(event.type)
      return type === null ? [] : [{ ...event, type }]
    }),
  }
}

export function migrateVersionFourSnapshot(
  previous: VersionFourEvaluationSnapshot,
): EvaluationSnapshot {
  const artifacts = migrateConfiguredArtifacts(previous)
  return {
    ...previous,
    ...artifacts,
    schemaVersion: 8,
    engineerTaskWeights: [],
    directScoreRules: [],
    derivedScoreRules: [],
    evaluationBenchmarks: [],
    scoreAdjustments: [],
    unlockRequests: [],
    engineers: previous.engineers.map((engineer) => ({
      ...engineer,
      ...organizationForTeam(engineer.team),
      ...emptyEngineerMetadata,
    })),
    evaluators: previous.evaluators.map((evaluator) => ({
      ...evaluator,
      ...organizationForTeam(evaluator.team),
      ...emptyEvaluatorMetadata,
    })),
  }
}

export function migrateVersionFiveSnapshot(
  previous: VersionFiveEvaluationSnapshot,
): EvaluationSnapshot {
  const artifacts = migrateConfiguredArtifacts(previous)
  return {
    ...previous,
    ...artifacts,
    schemaVersion: 8,
    scoreAdjustments: [],
    unlockRequests: [],
    derivedScoreRules: [],
    evaluationBenchmarks: [],
    engineers: previous.engineers.map((engineer) => ({
      ...engineer,
      ...organizationForTeam(engineer.team),
      ...emptyEngineerMetadata,
    })),
    evaluators: previous.evaluators.map((evaluator) => ({
      ...evaluator,
      ...organizationForTeam(evaluator.team),
      ...emptyEvaluatorMetadata,
    })),
  }
}

export function migrateVersionSixSnapshot(
  previous: VersionSixEvaluationSnapshot,
): EvaluationSnapshot {
  return {
    ...previous,
    ...migrateConfiguredArtifacts(previous),
    schemaVersion: 8,
    unlockRequests: [],
    derivedScoreRules: [],
    evaluationBenchmarks: [],
  }
}

export function migrateVersionSevenSnapshot(
  previous: VersionSevenEvaluationSnapshot,
): EvaluationSnapshot {
  return {
    ...previous,
    schemaVersion: 8,
    derivedScoreRules: [],
    evaluationBenchmarks: [],
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
