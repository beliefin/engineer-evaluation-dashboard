import { z } from "zod"

import { certificationRecordSchema, languageRecordSchema, snapshotSchema } from "./model.ts"

const baseRevision = z.number().int().nonnegative()
const scoreEntry = z.object({
  itemId: z.string().trim().min(1), score: z.number().int().min(0).max(10).nullable(),
})
const sheetMutation = {
  baseRevision,
  sheetId: z.string().trim().min(1),
  scores: z.array(scoreEntry).max(20),
  passResult: z.boolean().nullable(),
}

export const evaluationRequestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("load") }),
  z.object({
    operation: z.literal("operator_commit"), baseRevision,
    action: z.string().trim().min(1).max(100), targetId: z.string().trim().min(1).nullable(),
    snapshot: snapshotSchema,
  }),
  z.object({ operation: z.literal("save_draft"), ...sheetMutation }),
  z.object({ operation: z.literal("submit_sheet"), ...sheetMutation }),
  z.object({
    operation: z.literal("save_language_record"), baseRevision,
    record: languageRecordSchema.omit({ id: true, updatedAt: true }).extend({ recordId: z.string().nullable() }),
  }),
  z.object({ operation: z.literal("delete_language_record"), baseRevision, recordId: z.string().min(1) }),
  z.object({
    operation: z.literal("save_certification_record"), baseRevision,
    record: certificationRecordSchema.omit({ id: true, updatedAt: true }).extend({ recordId: z.string().nullable() }),
  }),
  z.object({ operation: z.literal("delete_certification_record"), baseRevision, recordId: z.string().min(1) }),
])
export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>
