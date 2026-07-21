import { z } from "zod"

import { evaluationSnapshotSchema, type EvaluationSnapshot, type Role } from "@/domain"

import { invokeAuthenticated } from "./supabase-http"

type LanguageRecordInput = Readonly<{
  recordId: string | null
  cycleId: string
  engineerId: string
  examName: string
  languageName?: string | null
  result: string
  noScore?: boolean
  languageGroup?: "english" | "second_language"
  previousResult?: string | null
  newlyAcquired?: boolean
  acquiredOn: string | null
  note: string | null
}>
type CertificationRecordInput = Readonly<{
  recordId: string | null
  cycleId: string
  engineerId: string
  certificateName: string
  noScore?: boolean
  grade: string | null
  acquiredOn: string | null
  issuer: string | null
}>
type ScoreAdjustmentInput = Readonly<{
  adjustmentId: string | null
  cycleId: string
  engineerId: string
  amount: number
  reason: string
}>
type ScheduleFields = Readonly<{
  taskId: string
  title: string
  date: string
  startTime: string | null
  note: string | null
}>

export type RemoteEvaluationCommand =
  | Readonly<{ type: "operator"; action: string; targetId: string | null }>
  | Readonly<{ type: "sheet"; operation: "save_draft" | "submit_sheet"; sheetId: string }>
  | Readonly<{ type: "unlock_request"; sheetId: string; reason: string }>
  | Readonly<{ type: "language_save"; record: LanguageRecordInput }>
  | Readonly<{ type: "language_delete"; recordId: string }>
  | Readonly<{ type: "certification_save"; record: CertificationRecordInput }>
  | Readonly<{ type: "certification_delete"; recordId: string }>
  | Readonly<{ type: "score_adjustment_save"; adjustment: ScoreAdjustmentInput }>
  | Readonly<{ type: "score_adjustment_delete"; adjustmentId: string }>
  | Readonly<{
    type: "schedule_create"
    cycleId: string
    engineerIds: ReadonlyArray<string>
    fields: ScheduleFields
  }>
  | Readonly<{
    type: "schedule_update"
    eventId: string
    engineerId: string
    fields: ScheduleFields
  }>
  | Readonly<{ type: "schedule_delete"; eventId: string }>

const responseSchema = z.object({
  snapshot: evaluationSnapshotSchema,
  revision: z.number().int().nonnegative(),
})
export type RemoteEvaluationState = z.infer<typeof responseSchema>
export type EvaluationView = "default" | "insights"

export function createRemoteLoadRequest(activeRole: Role, view: EvaluationView): unknown {
  return { operation: "load", activeRole, view }
}

export function createRemoteRequest(
  command: RemoteEvaluationCommand,
  snapshot: EvaluationSnapshot,
  baseRevision: number,
  activeRole: Role,
): unknown {
  switch (command.type) {
    case "operator":
      return {
        operation: "operator_commit", activeRole, baseRevision, action: command.action,
        targetId: command.targetId, snapshot,
      }
    case "sheet": {
      const sheet = snapshot.scoreSheets.find((entry) => entry.id === command.sheetId)
      if (sheet === undefined) throw new Error("저장할 평가지를 찾을 수 없습니다.")
      return {
        operation: command.operation, activeRole, baseRevision, sheetId: command.sheetId,
        scores: sheet.scores, passResult: sheet.passResult,
      }
    }
    case "unlock_request":
      return {
        operation: "request_sheet_unlock",
        activeRole,
        baseRevision,
        sheetId: command.sheetId,
        reason: command.reason,
      }
    case "language_save":
      return { operation: "save_language_record", activeRole, baseRevision, record: command.record }
    case "language_delete":
      return { operation: "delete_language_record", activeRole, baseRevision, recordId: command.recordId }
    case "certification_save":
      return { operation: "save_certification_record", activeRole, baseRevision, record: command.record }
    case "certification_delete":
      return { operation: "delete_certification_record", activeRole, baseRevision, recordId: command.recordId }
    case "score_adjustment_save":
      return { operation: "save_score_adjustment", activeRole, baseRevision, adjustment: command.adjustment }
    case "score_adjustment_delete":
      return { operation: "delete_score_adjustment", activeRole, baseRevision, adjustmentId: command.adjustmentId }
    case "schedule_create":
      return {
        operation: "create_schedule_events", activeRole, baseRevision,
        cycleId: command.cycleId, engineerIds: command.engineerIds, ...command.fields,
      }
    case "schedule_update":
      return {
        operation: "update_schedule_event", activeRole, baseRevision,
        eventId: command.eventId, engineerId: command.engineerId, ...command.fields,
      }
    case "schedule_delete":
      return { operation: "delete_schedule_event", activeRole, baseRevision, eventId: command.eventId }
    default:
      return assertNever(command)
  }
}

export async function loadRemoteEvaluation(
  activeRole: Role,
  view: EvaluationView = "default",
): Promise<RemoteEvaluationState> {
  return invokeAuthenticated("evaluation-api", createRemoteLoadRequest(activeRole, view), responseSchema)
}

export async function persistRemoteEvaluation(
  command: RemoteEvaluationCommand,
  snapshot: EvaluationSnapshot,
  revision: number,
  activeRole: Role,
): Promise<RemoteEvaluationState> {
  return invokeAuthenticated(
    "evaluation-api",
    createRemoteRequest(command, snapshot, revision, activeRole),
    responseSchema,
  )
}

function assertNever(value: never): never {
  throw new RangeError(`지원하지 않는 원격 명령입니다: ${String(value)}`)
}
