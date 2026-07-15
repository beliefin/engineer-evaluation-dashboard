import { z } from "zod"

const idSchema = z.string().trim().min(1)
const timestampSchema = z.string().trim().min(1)
const roleSchema = z.enum(["operator", "evaluator", "approver"])
const trackSchema = z.enum(["unselected", "ots", "dx"])
const categorySchema = z.enum(["growth_plan", "core_track"])
const directCategorySchema = z.enum(["language", "certification", "proposal"])

const legacyCycleSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1),
  status: z.enum(["setup", "active", "closed"]),
  track: trackSchema,
  startsAt: timestampSchema,
  endsAt: timestampSchema,
})

const baseEngineerSchema = z.object({
  id: idSchema,
  employeeCode: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  team: z.string().trim().min(1),
  position: z.string().trim().min(1),
})

const baseEvaluatorSchema = z.object({
  id: idSchema,
  employeeCode: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  team: z.string().trim().min(1),
})

const assignmentSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  evaluatorId: idSchema,
  category: categorySchema,
  weight: z.number().positive().finite(),
})

const rubricItemSchema = z.object({
  id: idSchema,
  label: z.string().trim().min(1),
  order: z.number().int().min(1).max(10),
})

const rubricTemplateSchema = z.object({
  id: idSchema,
  category: categorySchema,
  label: z.string().trim().min(1),
  items: z.array(rubricItemSchema).length(10),
})

const scoreSheetSchema = z.object({
  id: idSchema,
  assignmentId: idSchema,
  status: z.enum(["draft", "submitted"]),
  scores: z.array(z.object({
    itemId: idSchema,
    score: z.number().int().min(0).max(10).nullable(),
  })).length(10),
  updatedAt: timestampSchema,
  submittedAt: timestampSchema.nullable(),
})

const directScoreSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  category: directCategorySchema,
  score: z.number().min(0).max(100).nullable(),
  updatedAt: timestampSchema,
})

const scheduleEventSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  title: z.string().trim().min(1),
  date: z.string().trim().min(1),
  startTime: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

const languageRecordSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  examName: z.string(),
  result: z.string(),
  acquiredOn: z.string().nullable(),
  note: z.string().nullable(),
  updatedAt: timestampSchema,
})

const certificationRecordSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  certificateName: z.string(),
  grade: z.string().nullable(),
  acquiredOn: z.string().nullable(),
  issuer: z.string().nullable(),
  updatedAt: timestampSchema,
})

const auditEventSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  type: z.string().trim().min(1),
  actorId: idSchema,
  actorRole: roleSchema,
  targetId: idSchema,
  reason: z.string().nullable(),
  createdAt: timestampSchema,
})

const commonSnapshotFields = {
  cycles: z.array(legacyCycleSchema).min(1),
  assignments: z.array(assignmentSchema),
  rubrics: z.array(rubricTemplateSchema).length(2),
  scoreSheets: z.array(scoreSheetSchema),
  directScores: z.array(directScoreSchema),
  auditEvents: z.array(auditEventSchema),
}

export const legacyEvaluationSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  ...commonSnapshotFields,
  engineers: z.array(baseEngineerSchema),
  evaluators: z.array(z.object({
    id: idSchema,
    displayName: z.string().trim().min(1),
    team: z.string().trim().min(1),
  })),
})
export type LegacyEvaluationSnapshot = z.infer<typeof legacyEvaluationSnapshotSchema>

export const previousEvaluationSnapshotSchema = z.object({
  schemaVersion: z.literal(2),
  ...commonSnapshotFields,
  engineers: z.array(baseEngineerSchema),
  evaluators: z.array(baseEvaluatorSchema),
  scheduleEvents: z.array(scheduleEventSchema),
})
export type PreviousEvaluationSnapshot = z.infer<typeof previousEvaluationSnapshotSchema>

export const versionThreeEvaluationSnapshotSchema = z.object({
  schemaVersion: z.literal(3),
  ...commonSnapshotFields,
  engineers: z.array(baseEngineerSchema),
  evaluators: z.array(baseEvaluatorSchema),
  scheduleEvents: z.array(scheduleEventSchema),
  languageScoreRecords: z.array(languageRecordSchema),
  certificationRecords: z.array(certificationRecordSchema),
})
export type VersionThreeEvaluationSnapshot = z.infer<
  typeof versionThreeEvaluationSnapshotSchema
>
