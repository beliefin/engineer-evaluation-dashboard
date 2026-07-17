import { z } from "zod"

import {
  CYCLE_STATUSES,
  DIRECT_SCORE_RULE_FIELDS,
  DIRECT_SCORE_RULE_KINDS,
  DIRECT_SCORE_RULE_OPERATORS,
  DIRECT_SCORE_RULE_TYPES,
  LANGUAGE_BONUS_CONDITIONS,
  LANGUAGE_GROUPS,
  EVALUATION_METHODS,
  DIVISIONS,
  ROLES,
  TEAMS,
} from "./types"

const idSchema = z.string().trim().min(1)
const timestampSchema = z.string().trim().min(1)
const scoreValueSchema = z.number().int().min(0).max(10).nullable()
const employeeCodeSchema = z.string().trim().min(1).transform((value) =>
  /^3101\d{4}$/.test(value) ? value.slice(4) : value)

export const roleSchema = z.enum(ROLES)
export const teamSchema = z.enum(TEAMS)
export const divisionSchema = z.enum(DIVISIONS)
export const departmentSchema = z.string().trim().min(1).max(100)
export const departmentCatalogEntrySchema = z.object({
  team: teamSchema,
  name: departmentSchema,
})
export const evaluationMethodSchema = z.enum(EVALUATION_METHODS)

export const evaluationCycleSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1),
  status: z.enum(CYCLE_STATUSES),
  locked: z.boolean().default(false),
  startsAt: timestampSchema,
  endsAt: timestampSchema,
})

const versionFiveEngineerSchema = z.object({
  id: idSchema,
  employeeCode: employeeCodeSchema,
  displayName: z.string().trim().min(1),
  team: teamSchema,
  position: z.string().trim().min(1),
})

const versionFiveEvaluatorSchema = z.object({
  id: idSchema,
  employeeCode: employeeCodeSchema,
  displayName: z.string().trim().min(1),
  team: teamSchema,
})

export const engineerSchema = versionFiveEngineerSchema.extend({
  division: divisionSchema,
  department: departmentSchema,
  organizationUnit: z.string().trim().min(1).max(100).nullable().default(null),
  jobTitle: z.string().trim().min(1).max(100).nullable().default(null),
})

export const evaluatorSchema = versionFiveEvaluatorSchema.extend({
  division: divisionSchema,
  department: departmentSchema,
  organizationUnit: z.string().trim().min(1).max(100).nullable().default(null),
  rank: z.string().trim().min(1).max(100).nullable().default(null),
  jobTitle: z.string().trim().min(1).max(100).nullable().default(null),
})

export const rubricCriterionSchema = z.object({
  score: z.number().int().min(0).max(10),
  description: z.string().trim().min(1).max(500),
})

export const rubricItemSchema = z.object({
  id: idSchema,
  label: z.string().trim().min(1).max(200),
  order: z.number().int().min(1).max(20),
  section: z.string().trim().min(1).max(50).nullable().default(null),
  criteria: z.array(rubricCriterionSchema).max(11).default([]),
}).superRefine((item, context) => {
  const scores = item.criteria.map((criterion) => criterion.score)
  if (new Set(scores).size !== scores.length) {
    context.addIssue({
      code: "custom",
      message: "한 평가 항목에 같은 점수 기준을 두 번 등록할 수 없습니다.",
      path: ["criteria"],
    })
  }
})

const legacyTaskEvaluatorWeightSchema = z.object({
  evaluatorId: idSchema,
  weight: z.number().positive().finite(),
})

const scoreMethods = new Set(["evaluator_score", "operator_score"])

export const evaluationTaskSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1_000),
  method: evaluationMethodSchema,
  weight: z.number().positive().max(100).multipleOf(0.1),
  order: z.number().int().min(1),
  items: z.array(rubricItemSchema).max(20),
}).superRefine((task, context) => {
  const scoreMethod = scoreMethods.has(task.method)
  if (task.method === "evaluator_score" && task.items.length === 0) {
    context.addIssue({
      code: "custom",
      message: "평가자 점수형 과제는 한 개 이상의 평가 항목이 필요합니다.",
      path: ["items"],
    })
  }
  if (!scoreMethod && task.items.length > 0) {
    context.addIssue({
      code: "custom",
      message: "P/F 과제에는 점수 평가 항목을 둘 수 없습니다.",
      path: ["items"],
    })
  }
})

const legacyEvaluationTaskSchema = evaluationTaskSchema.safeExtend({
  evaluatorWeights: z.array(legacyTaskEvaluatorWeightSchema).max(50),
})

export const engineerTaskWeightSchema = z.object({
  cycleId: idSchema,
  engineerId: idSchema,
  taskId: idSchema,
  weight: z.number().finite().min(0).max(100).multipleOf(0.1),
})

export const directScoreRuleSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  taskId: idSchema,
  kind: z.enum(DIRECT_SCORE_RULE_KINDS),
  label: z.string().trim().min(1).max(100),
  field: z.enum(DIRECT_SCORE_RULE_FIELDS),
  operator: z.enum(DIRECT_SCORE_RULE_OPERATORS),
  value: z.string().trim().min(1).max(100),
  ruleType: z.enum(DIRECT_SCORE_RULE_TYPES),
  score: z.number().min(0).max(100).multipleOf(0.1),
  rawScore: z.number().min(0).max(110).multipleOf(0.1).nullable().optional(),
  bonus: z.number().min(0).max(100).multipleOf(0.1),
  enabled: z.boolean(),
  order: z.number().int().min(1),
  category: z.string().trim().min(1).max(100).nullable().optional(),
  difficulty: z.string().trim().min(1).max(100).nullable().optional(),
  workRelevance: z.string().trim().min(1).max(100).nullable().optional(),
  languageGroup: z.enum(LANGUAGE_GROUPS).nullable().optional(),
  examName: z.string().trim().min(1).max(100).nullable().optional(),
  bonusCondition: z.enum(LANGUAGE_BONUS_CONDITIONS).nullable().optional(),
})

export const derivedScoreRuleSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  taskId: idSchema,
  targetEngineerId: idSchema,
  sourceTaskId: idSchema,
  sourceEngineerIds: z.array(idSchema).min(1).max(100).refine(
    (ids) => new Set(ids).size === ids.length,
    "원천 엔지니어를 중복 선택할 수 없습니다.",
  ),
  aggregation: z.literal("average"),
})

export const evaluationBenchmarkSchema = z.object({
  assignmentId: idSchema,
  sampleSize: z.number().int().min(1).max(3),
  averageScore: z.number().min(0).max(100),
  minScore: z.number().min(0).max(100),
  maxScore: z.number().min(0).max(100),
})

const legacyAssignmentSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  evaluatorId: idSchema,
  taskId: idSchema,
})

export const assignmentSchema = legacyAssignmentSchema.extend({
  weight: z.number().positive().finite(),
})

export const scoreEntrySchema = z.object({
  itemId: idSchema,
  score: scoreValueSchema,
})

export const scoreSheetSchema = z.object({
  id: idSchema,
  assignmentId: idSchema,
  status: z.enum(["draft", "submitted"]),
  scores: z.array(scoreEntrySchema).max(20),
  passResult: z.boolean().nullable(),
  updatedAt: timestampSchema,
  submittedAt: timestampSchema.nullable(),
})

export const sheetUnlockRequestSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  sheetId: idSchema,
  evaluatorId: idSchema,
  reason: z.string().trim().min(1).max(500),
  status: z.enum(["pending", "resolved"]),
  createdAt: timestampSchema,
  resolvedAt: timestampSchema.nullable(),
})

export const directScoreSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  taskId: idSchema,
  score: z.number().min(0).max(100).multipleOf(0.1).nullable(),
  passResult: z.boolean().nullable(),
  updatedAt: timestampSchema,
})

export const languageScoreRecordSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  examName: z.string().trim().min(1).max(100),
  languageName: z.string().trim().min(1).max(100).nullable().optional(),
  result: z.string().trim().min(1).max(100),
  languageGroup: z.enum(LANGUAGE_GROUPS).optional(),
  previousResult: z.string().trim().min(1).max(100).nullable().optional(),
  newlyAcquired: z.boolean().optional(),
  acquiredOn: z.iso.date().nullable(),
  note: z.string().trim().min(1).max(300).nullable(),
  updatedAt: timestampSchema,
})

export const certificationRecordSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  certificateName: z.string().trim().min(1).max(100),
  grade: z.string().trim().min(1).max(100).nullable(),
  acquiredOn: z.iso.date().nullable(),
  issuer: z.string().trim().min(1).max(100).nullable(),
  updatedAt: timestampSchema,
})

export const evaluationScheduleEventSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  taskId: idSchema.nullable().default(null),
  title: z.string().trim().min(1).max(100),
  date: z.iso.date(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
  note: z.string().trim().min(1).max(500).nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const engineerScoreAdjustmentSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  amount: z.number().finite().min(-100).max(100).multipleOf(0.1).refine(
    (amount) => amount !== 0,
    "가·감점은 0점이 아닌 값이어야 합니다.",
  ),
  reason: z.string().trim().min(1).max(300),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const auditEventSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  type: z.enum([
    "sheet_submitted",
    "sheet_reopened",
    "sheet_unlock_requested",
    "direct_score_updated",
    "derived_score_rule_saved",
    "derived_score_rule_deleted",
    "score_adjustment_saved",
    "score_adjustment_deleted",
    "language_record_saved",
    "language_record_deleted",
    "certification_record_saved",
    "certification_record_deleted",
    "source_record_verified",
    "cycle_created",
    "cycle_updated",
    "cycle_locked",
    "cycle_unlocked",
    "task_saved",
    "task_deleted",
    "evaluator_assignments_updated",
    "engineer_task_weights_updated",
    "engineer_added",
    "engineer_updated",
    "engineer_deleted",
    "evaluator_added",
    "evaluator_updated",
    "evaluator_deleted",
    "schedule_event_created",
    "schedule_event_updated",
    "schedule_event_deleted",
    "cycle_deleted",
    "demo_reset",
  ]),
  actorId: idSchema,
  actorRole: roleSchema,
  targetId: idSchema,
  reason: z.string().trim().min(1).nullable(),
  createdAt: timestampSchema,
})

const versionFourSnapshotFields = {
  cycles: z.array(evaluationCycleSchema).min(1),
  tasks: z.array(legacyEvaluationTaskSchema),
  engineers: z.array(versionFiveEngineerSchema),
  evaluators: z.array(versionFiveEvaluatorSchema),
  assignments: z.array(legacyAssignmentSchema),
  scoreSheets: z.array(scoreSheetSchema),
  directScores: z.array(directScoreSchema),
  languageScoreRecords: z.array(languageScoreRecordSchema),
  certificationRecords: z.array(certificationRecordSchema),
  scheduleEvents: z.array(evaluationScheduleEventSchema),
  auditEvents: z.array(auditEventSchema),
}

export const versionFourEvaluationSnapshotSchema = z.object({
  schemaVersion: z.literal(4),
  ...versionFourSnapshotFields,
})
export type VersionFourEvaluationSnapshot = z.infer<
  typeof versionFourEvaluationSnapshotSchema
>

export const versionFiveEvaluationSnapshotSchema = z.object({
  schemaVersion: z.literal(5),
  ...versionFourSnapshotFields,
  engineerTaskWeights: z.array(engineerTaskWeightSchema),
  directScoreRules: z.array(directScoreRuleSchema).default([]),
})
export type VersionFiveEvaluationSnapshot = z.infer<typeof versionFiveEvaluationSnapshotSchema>

export const versionSixEvaluationSnapshotSchema = z.object({
  schemaVersion: z.literal(6),
  ...versionFourSnapshotFields,
  engineers: z.array(engineerSchema),
  evaluators: z.array(evaluatorSchema),
  engineerTaskWeights: z.array(engineerTaskWeightSchema),
  directScoreRules: z.array(directScoreRuleSchema).default([]),
  departmentCatalog: z.array(departmentCatalogEntrySchema).default([]),
  scoreAdjustments: z.array(engineerScoreAdjustmentSchema).default([]),
})
export type VersionSixEvaluationSnapshot = z.infer<typeof versionSixEvaluationSnapshotSchema>

export const versionSevenEvaluationSnapshotSchema = z.object({
  schemaVersion: z.literal(7),
  ...versionFourSnapshotFields,
  tasks: z.array(evaluationTaskSchema),
  engineers: z.array(engineerSchema),
  evaluators: z.array(evaluatorSchema),
  assignments: z.array(assignmentSchema),
  unlockRequests: z.array(sheetUnlockRequestSchema).default([]),
  engineerTaskWeights: z.array(engineerTaskWeightSchema),
  directScoreRules: z.array(directScoreRuleSchema).default([]),
  departmentCatalog: z.array(departmentCatalogEntrySchema).default([]),
  scoreAdjustments: z.array(engineerScoreAdjustmentSchema).default([]),
})
export type VersionSevenEvaluationSnapshot = z.infer<typeof versionSevenEvaluationSnapshotSchema>

export const evaluationSnapshotSchema = z.object({
  schemaVersion: z.literal(8),
  ...versionFourSnapshotFields,
  tasks: z.array(evaluationTaskSchema),
  engineers: z.array(engineerSchema),
  evaluators: z.array(evaluatorSchema),
  assignments: z.array(assignmentSchema),
  unlockRequests: z.array(sheetUnlockRequestSchema).default([]),
  engineerTaskWeights: z.array(engineerTaskWeightSchema),
  directScoreRules: z.array(directScoreRuleSchema).default([]),
  derivedScoreRules: z.array(derivedScoreRuleSchema).default([]),
  evaluationBenchmarks: z.array(evaluationBenchmarkSchema).default([]),
  departmentCatalog: z.array(departmentCatalogEntrySchema).default([]),
  scoreAdjustments: z.array(engineerScoreAdjustmentSchema).default([]),
})
