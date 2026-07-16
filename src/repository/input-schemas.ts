import {
  DIRECT_SCORE_RULE_FIELDS,
  DIRECT_SCORE_RULE_KINDS,
  DIRECT_SCORE_RULE_OPERATORS,
  DIRECT_SCORE_RULE_TYPES,
  evaluationMethodSchema,
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

export const updateDirectScoreInputSchema = z.object({
  cycleId: idSchema,
  engineerId: idSchema,
  taskId: idSchema,
  score: z.number().finite().min(0).max(100).multipleOf(0.1).nullable(),
  passResult: z.boolean().nullable(),
  actor: actorSchema,
})

const nullableSourceTextSchema = (max: number) =>
  z.string().trim().min(1).max(max).nullable()

export const saveLanguageScoreRecordInputSchema = z.object({
  recordId: idSchema.nullable(),
  cycleId: idSchema,
  engineerId: idSchema,
  examName: z.string().trim().min(1).max(100),
  result: z.string().trim().min(1).max(100),
  acquiredOn: z.iso.date().nullable(),
  note: nullableSourceTextSchema(300),
  actor: actorSchema,
})

export const saveCertificationRecordInputSchema = z.object({
  recordId: idSchema.nullable(),
  cycleId: idSchema,
  engineerId: idSchema,
  certificateName: z.string().trim().min(1).max(100),
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
  message: "?됯? 醫낅즺?쇱? ?쒖옉?쇰낫??鍮좊? ???놁뒿?덈뒗.",
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
  bonus: z.number().finite().min(0).max(100).multipleOf(0.1),
  enabled: z.boolean(),
  actor: actorSchema,
})

export const deleteDirectScoreRuleInputSchema = z.object({
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
  })).max(20),
  evaluatorWeights: z.array(z.object({
    evaluatorId: idSchema,
    weight: z.number().positive().finite(),
  })).max(50),
  actor: actorSchema,
}).superRefine((task, context) => {
  const evaluatorMethod = task.method === "evaluator_score" || task.method === "evaluator_pass_fail"
  if (task.method === "evaluator_score" && task.items.length === 0) {
    context.addIssue({ code: "custom", message: "점수형 과제는 평가 항목이 필요합니다.", path: ["items"] })
  }
  if (task.method !== "evaluator_score" && task.items.length > 0) {
    context.addIssue({ code: "custom", message: "이 평가 방식에는 점수 항목을 둘 수 없습니다.", path: ["items"] })
  }
  if (!evaluatorMethod && task.evaluatorWeights.length > 0) {
    context.addIssue({ code: "custom", message: "운영자 방식에는 평가자를 배정할 수 없습니다.", path: ["evaluatorWeights"] })
  }
  const evaluatorIds = task.evaluatorWeights.map((entry) => entry.evaluatorId)
  if (new Set(evaluatorIds).size !== evaluatorIds.length) {
    context.addIssue({ code: "custom", message: "평가자를 중복 배정할 수 없습니다.", path: ["evaluatorWeights"] })
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
  team: teamSchema,
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
        team: teamSchema,
      }),
    )
    .min(1),
  actor: actorSchema,
})

const evaluatorFieldsSchema = z.object({
  employeeCode: employeeCodeSchema,
  displayName: z.string().trim().min(1).max(100),
  team: teamSchema,
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
  title: z.string().trim().min(1).max(100),
  date: z.iso.date(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
  note: z.string().trim().min(1).max(500).nullable(),
})

export const createScheduleEventInputSchema = scheduleEventFieldsSchema.extend({
  cycleId: idSchema,
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
