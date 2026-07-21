import {
  DIRECT_SCORE_RULE_FIELDS,
  DIRECT_SCORE_RULE_KINDS,
  DIRECT_SCORE_RULE_OPERATORS,
  DIRECT_SCORE_RULE_TYPES,
  LANGUAGE_BONUS_CONDITIONS,
  LANGUAGE_GROUPS,
  evaluationMethodSchema,
  departmentSchema,
  divisionSchema,
  roleSchema,
  scoreEntrySchema,
  teamSchema,
} from "@/domain"
import { z } from "zod"

import { RepositoryError } from "./types"

const idSchema = z.string().trim().min(1)
const actorSchema = z.object({ id: idSchema, role: roleSchema })

export const saveDraftInputSchema = z.object({
  sheetId: idSchema,
  scores: z.array(scoreEntrySchema).max(20),
  passResult: z.boolean().nullable().default(null),
  actor: actorSchema,
})

export const sheetActionInputSchema = z.object({
  sheetId: idSchema,
  actor: actorSchema,
})

export const reopenSheetInputSchema = sheetActionInputSchema.extend({
  reason: z.string().trim(),
})

export const requestSheetUnlockInputSchema = sheetActionInputSchema.extend({
  reason: z.string().trim().min(1).max(500),
})

export const updateDirectScoreInputSchema = z.object({
  cycleId: idSchema,
  engineerId: idSchema,
  taskId: idSchema,
  score: z.number().finite().min(0).max(100).multipleOf(0.1).nullable(),
  passResult: z.boolean().nullable(),
  actor: actorSchema,
})

export const saveScoreAdjustmentInputSchema = z.object({
  adjustmentId: idSchema.nullable(),
  cycleId: idSchema,
  engineerId: idSchema,
  amount: z.number().finite().min(-100).max(100).multipleOf(0.1).refine(
    (amount) => amount !== 0,
    "가·감점은 0점이 아닌 값이어야 합니다.",
  ),
  reason: z.string().trim().min(1).max(300),
  actor: actorSchema,
})

export const deleteScoreAdjustmentInputSchema = z.object({
  adjustmentId: idSchema,
  actor: actorSchema,
})

const nullableSourceTextSchema = (max: number) =>
  z.string().trim().min(1).max(max).nullable()

export const saveLanguageScoreRecordInputSchema = z.object({
  recordId: idSchema.nullable(),
  cycleId: idSchema,
  engineerId: idSchema,
  examName: z.string().trim().min(1).max(100),
  languageName: nullableSourceTextSchema(100).optional().default(null),
  result: z.string().trim().min(1).max(100),
  noScore: z.boolean().optional().default(false),
  languageGroup: z.enum(LANGUAGE_GROUPS).optional().default("english"),
  previousResult: nullableSourceTextSchema(100).optional().default(null),
  newlyAcquired: z.boolean().optional().default(false),
  acquiredOn: z.iso.date().nullable(),
  note: nullableSourceTextSchema(300),
  actor: actorSchema,
})

export const saveCertificationRecordInputSchema = z.object({
  recordId: idSchema.nullable(),
  cycleId: idSchema,
  engineerId: idSchema,
  certificateName: z.string().trim().min(1).max(100),
  noScore: z.boolean().optional().default(false),
  grade: nullableSourceTextSchema(100),
  acquiredOn: z.iso.date().nullable(),
  issuer: nullableSourceTextSchema(100),
  actor: actorSchema,
})

export const deleteSourceRecordInputSchema = z.object({
  recordId: idSchema,
  actor: actorSchema,
})

export const verifySourceRecordInputSchema = z.object({
  recordId: idSchema,
  recordKind: z.enum(["language", "certification"]),
  actor: actorSchema,
})

export const createEvaluationCycleInputSchema = z.object({
  sourceCycleId: idSchema,
  name: z.string().trim().min(1).max(100),
  status: z.enum(["setup", "active"]),
  startsAt: z.iso.date(),
  endsAt: z.iso.date(),
  copyConfiguration: z.boolean(),
  actor: actorSchema,
}).refine((value) => value.startsAt <= value.endsAt, {
  message: "평가 시즌 종료일은 시작일보다 빠를 수 없습니다.",
  path: ["endsAt"],
})

export const deleteEvaluationCycleInputSchema = z.object({
  cycleId: idSchema,
  actor: actorSchema,
})

export const updateEvaluationCycleInputSchema = z.object({
  cycleId: idSchema,
  name: z.string().trim().min(1).max(100),
  status: z.enum(["setup", "active", "closed"]),
  startsAt: z.iso.date(),
  endsAt: z.iso.date(),
  actor: actorSchema,
}).refine((value) => value.startsAt <= value.endsAt, {
  message: "평가 시즌 종료일은 시작일보다 빠를 수 없습니다.",
  path: ["endsAt"],
})

export const setEvaluationCycleLockInputSchema = z.object({
  cycleId: idSchema,
  locked: z.boolean(),
  actor: actorSchema,
})

export const saveDirectScoreRuleInputSchema = z.object({
  ruleId: idSchema.nullable(),
  cycleId: idSchema,
  taskId: idSchema,
  kind: z.enum(DIRECT_SCORE_RULE_KINDS),
  label: z.string().trim().min(1).max(100),
  field: z.enum(DIRECT_SCORE_RULE_FIELDS),
  operator: z.enum(DIRECT_SCORE_RULE_OPERATORS),
  value: z.string().trim().min(1).max(100),
  ruleType: z.enum(DIRECT_SCORE_RULE_TYPES),
  score: z.number().finite().min(0).max(100).multipleOf(0.1),
  rawScore: z.number().finite().min(0).max(110).multipleOf(0.1).nullable().optional(),
  bonus: z.number().finite().min(0).max(100).multipleOf(0.1),
  enabled: z.boolean(),
  category: z.string().trim().min(1).max(100).nullable().optional(),
  difficulty: z.string().trim().min(1).max(100).nullable().optional(),
  workRelevance: z.string().trim().min(1).max(100).nullable().optional(),
  languageGroup: z.enum(LANGUAGE_GROUPS).nullable().optional(),
  examName: z.string().trim().min(1).max(100).nullable().optional(),
  bonusCondition: z.enum(LANGUAGE_BONUS_CONDITIONS).nullable().optional(),
  actor: actorSchema,
})

export const deleteDirectScoreRuleInputSchema = z.object({
  ruleId: idSchema,
  actor: actorSchema,
})

export const saveDerivedScoreRuleInputSchema = z.object({
  ruleId: idSchema.nullable(),
  cycleId: idSchema,
  taskId: idSchema,
  targetEngineerId: idSchema,
  sourceTaskId: idSchema,
  sourceEngineerIds: z.array(idSchema).min(1).max(100).refine(
    (ids) => new Set(ids).size === ids.length,
  ),
  actor: actorSchema,
})

export const deleteDerivedScoreRuleInputSchema = z.object({
  ruleId: idSchema,
  actor: actorSchema,
})

export const saveEvaluationTaskInputSchema = z.object({
  taskId: idSchema.nullable(),
  cycleId: idSchema,
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1_000),
  method: evaluationMethodSchema,
  weight: z.number().positive().max(100).multipleOf(0.1),
  items: z.array(z.object({
    id: idSchema.nullable(),
    label: z.string().trim().min(1).max(200),
    section: z.string().trim().min(1).max(50).nullable().default(null),
    criteria: z.array(z.object({
      score: z.number().int().min(0).max(10),
      description: z.string().trim().min(1).max(500),
    })).max(11).default([]),
  })).max(20),
  actor: actorSchema,
}).superRefine((task, context) => {
  if (task.method === "evaluator_score" && task.items.length === 0) {
    context.addIssue({ code: "custom", message: "점수형 과제는 평가 항목이 필요합니다.", path: ["items"] })
  }
  if (task.method !== "evaluator_score" && task.items.length > 0) {
    context.addIssue({ code: "custom", message: "이 평가 방식에는 점수 항목을 둘 수 없습니다.", path: ["items"] })
  }
})

export const updateEvaluatorAssignmentsInputSchema = z.object({
  cycleId: idSchema,
  engineerId: idSchema,
  taskId: idSchema,
  evaluatorWeights: z.array(z.object({
    evaluatorId: idSchema,
    weight: z.number().positive().finite(),
  })).max(50),
  actor: actorSchema,
}).superRefine((value, context) => {
  const evaluatorIds = value.evaluatorWeights.map((entry) => entry.evaluatorId)
  if (new Set(evaluatorIds).size !== evaluatorIds.length) {
    context.addIssue({
      code: "custom",
      message: "같은 평가자를 두 번 배정할 수 없습니다.",
      path: ["evaluatorWeights"],
    })
  }
})

export const updateEvaluatorPresetInputSchema = z.object({
  cycleId: idSchema,
  evaluatorWeights: z.array(z.object({
    evaluatorId: idSchema,
    weight: z.number().positive().finite(),
  })).max(50),
  actor: actorSchema,
}).superRefine((value, context) => {
  const evaluatorIds = value.evaluatorWeights.map((entry) => entry.evaluatorId)
  if (new Set(evaluatorIds).size !== evaluatorIds.length) {
    context.addIssue({
      code: "custom",
      message: "고정 멤버에 같은 평가자를 두 번 저장할 수 없습니다.",
      path: ["evaluatorWeights"],
    })
  }
})

export const deleteEvaluationTaskInputSchema = z.object({
  taskId: idSchema,
  actor: actorSchema,
})

export const updateEngineerTaskWeightsInputSchema = z.object({
  cycleId: idSchema,
  engineerId: idSchema,
  weights: z.array(z.object({
    taskId: idSchema,
    weight: z.number().finite().min(0).max(100).multipleOf(0.1),
  })).min(1).max(100),
  useSeasonDefaults: z.boolean().default(false),
  actor: actorSchema,
})

const employeeCodeSchema = z.string().trim().min(1).max(50)
const engineerFieldsSchema = z.object({
  employeeCode: employeeCodeSchema,
  displayName: z.string().trim().min(1).max(100),
  division: divisionSchema,
  team: teamSchema,
  department: departmentSchema,
  position: z.string().trim().min(1).max(100),
})

export const addEngineersInputSchema = z.object({
  cycleId: idSchema,
  engineers: z.array(engineerFieldsSchema).min(1),
  actor: actorSchema,
})

export const updateEngineerInputSchema = engineerFieldsSchema.extend({
  cycleId: idSchema,
  engineerId: idSchema,
  actor: actorSchema,
})

export const deleteEngineerInputSchema = z.object({
  cycleId: idSchema,
  engineerId: idSchema,
  actor: actorSchema,
})

export const addEvaluatorsInputSchema = z.object({
  cycleId: idSchema,
  evaluators: z
    .array(
      z.object({
        employeeCode: employeeCodeSchema,
        displayName: z.string().trim().min(1).max(100),
        division: divisionSchema,
        team: teamSchema,
        department: departmentSchema,
      }),
    )
    .min(1),
  actor: actorSchema,
})

const evaluatorFieldsSchema = z.object({
  employeeCode: employeeCodeSchema,
  displayName: z.string().trim().min(1).max(100),
  division: divisionSchema,
  team: teamSchema,
  department: departmentSchema,
})

export const updateEvaluatorInputSchema = evaluatorFieldsSchema.extend({
  cycleId: idSchema,
  evaluatorId: idSchema,
  actor: actorSchema,
})

export const deleteEvaluatorInputSchema = z.object({
  cycleId: idSchema,
  evaluatorId: idSchema,
  actor: actorSchema,
})

const scheduleEventFieldsSchema = z.object({
  engineerId: idSchema,
  taskId: idSchema,
  title: z.string().trim().min(1).max(100),
  date: z.iso.date(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
  note: z.string().trim().min(1).max(500).nullable(),
})

export const createScheduleEventInputSchema = scheduleEventFieldsSchema.extend({
  cycleId: idSchema,
  actor: actorSchema,
})

export const createScheduleEventsInputSchema = scheduleEventFieldsSchema.omit({ engineerId: true }).extend({
  cycleId: idSchema,
  engineerIds: z.array(idSchema).min(1).max(100).refine(
    (engineerIds) => new Set(engineerIds).size === engineerIds.length,
    "같은 엔지니어를 중복 선택할 수 없습니다.",
  ),
  actor: actorSchema,
})

export const updateScheduleEventInputSchema = scheduleEventFieldsSchema.extend({
  eventId: idSchema,
  actor: actorSchema,
})

export const deleteScheduleEventInputSchema = z.object({
  eventId: idSchema,
  actor: actorSchema,
})

export function parseRepositoryInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new RepositoryError("INVALID_INPUT", "repository input is invalid", {
      cause: result.error,
    })
  }
  return result.data
}
