import { z } from "zod"

const id = z.string().trim().min(1)
const timestamp = z.string().trim().min(1)
const nullableText = (max: number) => z.string().trim().min(1).max(max).nullable()
export const roleSchema = z.enum(["operator", "evaluator", "approver", "engineer"])
export type Role = z.infer<typeof roleSchema>

export const profileSchema = z.object({
  auth_user_id: z.uuid(),
  username: z.string(),
  display_name: z.string(),
  role: roleSchema,
  evaluator_id: z.string().nullable(),
  engineer_id: z.string().nullable(),
  active: z.boolean(),
})
export type Profile = z.infer<typeof profileSchema>

const cycle = z.object({
  id, name: z.string().trim().min(1), status: z.enum(["setup", "active", "closed"]),
  locked: z.boolean().default(false), startsAt: timestamp, endsAt: timestamp,
})
const engineer = z.object({
  id, employeeCode: z.string().trim().min(1), displayName: z.string().trim().min(1),
  team: z.enum(["생산 1팀", "생산 2팀"]), position: z.string().trim().min(1),
})
const evaluator = z.object({
  id, employeeCode: z.string().trim().min(1), displayName: z.string().trim().min(1),
  team: z.enum(["생산 1팀", "생산 2팀"]),
})
const rubricItem = z.object({ id, label: z.string().trim().min(1).max(200), order: z.number().int() })
const evaluatorWeight = z.object({ evaluatorId: id, weight: z.number().positive().finite() })
export const taskSchema = z.object({
  id, cycleId: id, name: z.string().trim().min(1).max(100), description: z.string().max(1_000),
  method: z.enum(["evaluator_score", "evaluator_pass_fail", "operator_score", "operator_pass_fail"]),
  weight: z.number().min(0).max(100), order: z.number().int(), items: z.array(rubricItem).max(20),
  evaluatorWeights: z.array(evaluatorWeight).max(50),
})
export type Task = z.infer<typeof taskSchema>
const engineerTaskWeight = z.object({
  cycleId: id, engineerId: id, taskId: id, weight: z.number().min(0).max(100),
})
const directScoreRule = z.object({
  id, cycleId: id, taskId: id,
  kind: z.enum(["language", "certification"]),
  label: z.string().trim().min(1).max(100),
  field: z.enum(["examName", "result", "certificateName", "grade"]),
  operator: z.enum(["equals", "contains", "gte"]),
  value: z.string().trim().min(1).max(100),
  ruleType: z.enum(["base", "bonus"]),
  score: z.number().min(0).max(100), bonus: z.number().min(0).max(100),
  enabled: z.boolean(), order: z.number().int().min(1),
})
export const assignmentSchema = z.object({
  id, cycleId: id, engineerId: id, evaluatorId: id, taskId: id,
})
export type Assignment = z.infer<typeof assignmentSchema>
const scoreEntry = z.object({ itemId: id, score: z.number().int().min(0).max(10).nullable() })
export const scoreSheetSchema = z.object({
  id, assignmentId: id, status: z.enum(["draft", "submitted"]), scores: z.array(scoreEntry).max(20),
  passResult: z.boolean().nullable(), updatedAt: timestamp, submittedAt: timestamp.nullable(),
})
export type ScoreSheet = z.infer<typeof scoreSheetSchema>
export const directScoreSchema = z.object({
  id, cycleId: id, engineerId: id, taskId: id, score: z.number().min(0).max(100).nullable(),
  passResult: z.boolean().nullable(), updatedAt: timestamp,
})
export type DirectScore = z.infer<typeof directScoreSchema>
export const languageRecordSchema = z.object({
  id, cycleId: id, engineerId: id, examName: z.string().trim().min(1).max(100),
  result: z.string().trim().min(1).max(100), acquiredOn: z.iso.date().nullable(),
  note: nullableText(300), updatedAt: timestamp,
})
export type LanguageRecord = z.infer<typeof languageRecordSchema>
export const certificationRecordSchema = z.object({
  id, cycleId: id, engineerId: id, certificateName: z.string().trim().min(1).max(100),
  grade: nullableText(100), acquiredOn: z.iso.date().nullable(), issuer: nullableText(100),
  updatedAt: timestamp,
})
export type CertificationRecord = z.infer<typeof certificationRecordSchema>
const scheduleEvent = z.object({
  id, cycleId: id, engineerId: id, title: z.string().trim().min(1).max(100), date: z.iso.date(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(), note: nullableText(500),
  createdAt: timestamp, updatedAt: timestamp,
})
const auditEvent = z.object({
  id, cycleId: id, type: z.string().trim().min(1), actorId: id, actorRole: roleSchema,
  targetId: id, reason: z.string().trim().min(1).nullable(), createdAt: timestamp,
})

export const snapshotSchema = z.object({
  schemaVersion: z.literal(5), cycles: z.array(cycle).min(1), tasks: z.array(taskSchema),
  engineerTaskWeights: z.array(engineerTaskWeight), directScoreRules: z.array(directScoreRule).default([]), engineers: z.array(engineer),
  evaluators: z.array(evaluator), assignments: z.array(assignmentSchema),
  scoreSheets: z.array(scoreSheetSchema), directScores: z.array(directScoreSchema),
  languageScoreRecords: z.array(languageRecordSchema),
  certificationRecords: z.array(certificationRecordSchema), scheduleEvents: z.array(scheduleEvent),
  auditEvents: z.array(auditEvent),
})
export type Snapshot = z.infer<typeof snapshotSchema>
