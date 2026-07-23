import { z } from "zod"

import {
  certificationRecordSchema,
  languageRecordSchema,
  roleSchema,
  scoreAdjustmentSchema,
  snapshotSchema,
} from "./model.ts"

const baseRevision = z.number().int().nonnegative()
const activeRole = { activeRole: roleSchema.optional() }
const evaluationView = z.enum(["default", "insights"])
const scoreEntry = z.object({
  itemId: z.string().trim().min(1), score: z.number().int().min(0).max(10).nullable(),
})
const sheetMutation = {
  baseRevision,
  sheetId: z.string().trim().min(1),
  scores: z.array(scoreEntry).max(20),
  passResult: z.boolean().nullable(),
}
const scheduleFields = {
  taskId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(100),
  date: z.iso.date(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
  note: z.string().trim().min(1).max(500).nullable(),
}

export const evaluationRequestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("load"), ...activeRole, view: evaluationView.default("default") }),
  z.object({ operation: z.literal("list_maintenance"), ...activeRole }),
  z.object({ operation: z.literal("create_backup"), ...activeRole, label: z.string().trim().min(1).max(100) }),
  z.object({
    operation: z.literal("restore_backup"), ...activeRole, baseRevision,
    backupId: z.uuid(),
  }),
  z.object({
    operation: z.literal("operator_commit"), ...activeRole, baseRevision,
    action: z.string().trim().min(1).max(100), targetId: z.string().trim().min(1).nullable(),
    snapshot: snapshotSchema,
  }),
  z.object({ operation: z.literal("save_draft"), ...activeRole, ...sheetMutation }),
  z.object({ operation: z.literal("submit_sheet"), ...activeRole, ...sheetMutation }),
  z.object({
    operation: z.literal("create_schedule_events"), ...activeRole, baseRevision,
    cycleId: z.string().trim().min(1),
    engineerIds: z.array(z.string().trim().min(1)).min(1).max(100).refine(
      (engineerIds) => new Set(engineerIds).size === engineerIds.length,
    ),
    parallel: z.boolean().default(false),
    ...scheduleFields,
  }).superRefine((input, context) => {
    if (input.parallel && input.engineerIds.length !== 2) {
      context.addIssue({
        code: "custom",
        path: ["engineerIds"],
        message: "동시 발표 평가는 평가 대상 2명이 필요합니다.",
      })
    }
  }),
  z.object({
    operation: z.literal("update_schedule_event"), ...activeRole, baseRevision,
    eventId: z.string().trim().min(1), engineerId: z.string().trim().min(1),
    ...scheduleFields,
  }),
  z.object({
    operation: z.literal("delete_schedule_event"), ...activeRole, baseRevision,
    eventId: z.string().trim().min(1),
  }),
  z.object({
    operation: z.literal("request_sheet_unlock"), ...activeRole, baseRevision,
    sheetId: z.string().trim().min(1), reason: z.string().trim().min(1).max(500),
  }),
  z.object({
    operation: z.literal("save_language_record"), ...activeRole, baseRevision,
    record: languageRecordSchema.omit({ id: true, updatedAt: true }).extend({ recordId: z.string().nullable() }),
  }),
  z.object({ operation: z.literal("delete_language_record"), ...activeRole, baseRevision, recordId: z.string().min(1) }),
  z.object({
    operation: z.literal("save_certification_record"), ...activeRole, baseRevision,
    record: certificationRecordSchema.omit({ id: true, updatedAt: true }).extend({ recordId: z.string().nullable() }),
  }),
  z.object({ operation: z.literal("delete_certification_record"), ...activeRole, baseRevision, recordId: z.string().min(1) }),
  z.object({
    operation: z.literal("save_score_adjustment"), ...activeRole, baseRevision,
    adjustment: scoreAdjustmentSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      adjustmentId: z.string().trim().min(1).nullable(),
    }),
  }),
  z.object({
    operation: z.literal("delete_score_adjustment"), ...activeRole, baseRevision,
    adjustmentId: z.string().trim().min(1),
  }),
])
export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>
