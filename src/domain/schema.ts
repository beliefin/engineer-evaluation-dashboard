import { z } from "zod"

import {
  CYCLE_STATUSES,
  EVALUATION_METHODS,
  ROLES,
  TEAMS,
} from "./types"

const idSchema = z.string().trim().min(1)
const timestampSchema = z.string().trim().min(1)
const scoreValueSchema = z.number().int().min(0).max(10).nullable()

export const roleSchema = z.enum(ROLES)
export const teamSchema = z.enum(TEAMS)
export const evaluationMethodSchema = z.enum(EVALUATION_METHODS)

export const evaluationCycleSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1),
  status: z.enum(CYCLE_STATUSES),
  startsAt: timestampSchema,
  endsAt: timestampSchema,
})

export const engineerSchema = z.object({
  id: idSchema,
  employeeCode: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  team: teamSchema,
  position: z.string().trim().min(1),
})

export const evaluatorSchema = z.object({
  id: idSchema,
  employeeCode: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  team: teamSchema,
})

export const rubricItemSchema = z.object({
  id: idSchema,
  label: z.string().trim().min(1).max(200),
  order: z.number().int().min(1).max(20),
})

export const taskEvaluatorWeightSchema = z.object({
  evaluatorId: idSchema,
  weight: z.number().positive().finite(),
})

const evaluatorMethods = new Set(["evaluator_score", "evaluator_pass_fail"])
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
  evaluatorWeights: z.array(taskEvaluatorWeightSchema).max(50),
}).superRefine((task, context) => {
  const evaluatorMethod = evaluatorMethods.has(task.method)
  const scoreMethod = scoreMethods.has(task.method)
  if (!evaluatorMethod && task.evaluatorWeights.length > 0) {
    context.addIssue({
      code: "custom",
      message: "운영자 방식에는 평가자를 배정할 수 없습니다.",
      path: ["evaluatorWeights"],
    })
  }
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
  const evaluatorIds = task.evaluatorWeights.map((entry) => entry.evaluatorId)
  if (new Set(evaluatorIds).size !== evaluatorIds.length) {
    context.addIssue({
      code: "custom",
      message: "같은 평가자를 두 번 배정할 수 없습니다.",
      path: ["evaluatorWeights"],
    })
  }
})

export const engineerTaskWeightSchema = z.object({
  cycleId: idSchema,
  engineerId: idSchema,
  taskId: idSchema,
  weight: z.number().finite().min(0).max(100).multipleOf(0.1),
})

export const assignmentSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  engineerId: idSchema,
  evaluatorId: idSchema,
  taskId: idSchema,
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
  result: z.string().trim().min(1).max(100),
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
  title: z.string().trim().min(1).max(100),
  date: z.iso.date(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
  note: z.string().trim().min(1).max(500).nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const auditEventSchema = z.object({
  id: idSchema,
  cycleId: idSchema,
  type: z.enum([
    "sheet_submitted",
    "sheet_reopened",
    "direct_score_updated",
    "language_record_saved",
    "language_record_deleted",
    "certification_record_saved",
    "certification_record_deleted",
    "source_record_verified",
    "cycle_created",
    "task_saved",
    "task_deleted",
    "engineer_task_weights_updated",
    "engineer_added",
    "evaluator_added",
    "schedule_event_created",
    "schedule_event_updated",
    "schedule_event_deleted",
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
  tasks: z.array(evaluationTaskSchema),
  engineers: z.array(engineerSchema),
  evaluators: z.array(evaluatorSchema),
  assignments: z.array(assignmentSchema),
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

export const evaluationSnapshotSchema = z.object({
  schemaVersion: z.literal(5),
  ...versionFourSnapshotFields,
  engineerTaskWeights: z.array(engineerTaskWeightSchema),
})
