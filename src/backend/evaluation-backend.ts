import { z } from "zod"

import { evaluationSnapshotSchema, type EvaluationSnapshot } from "@/domain"

import { invokeAuthenticated } from "./supabase-http"

type LanguageRecordInput = Readonly<{
  recordId: string | null
  cycleId: string
  engineerId: string
  examName: string
  languageName?: string | null
  result: string
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

export type RemoteEvaluationCommand =
  | Readonly<{ type: "operator"; action: string; targetId: string | null }>
  | Readonly<{ type: "sheet"; operation: "save_draft" | "submit_sheet"; sheetId: string }>
  | Readonly<{ type: "language_save"; record: LanguageRecordInput }>
  | Readonly<{ type: "language_delete"; recordId: string }>
  | Readonly<{ type: "certification_save"; record: CertificationRecordInput }>
  | Readonly<{ type: "certification_delete"; recordId: string }>
  | Readonly<{ type: "score_adjustment_save"; adjustment: ScoreAdjustmentInput }>
  | Readonly<{ type: "score_adjustment_delete"; adjustmentId: string }>

const responseSchema = z.object({
  snapshot: evaluationSnapshotSchema,
  revision: z.number().int().nonnegative(),
})
export type RemoteEvaluationState = z.infer<typeof responseSchema>

export function createRemoteRequest(
  command: RemoteEvaluationCommand,
  snapshot: EvaluationSnapshot,
  baseRevision: number,
): unknown {
  switch (command.type) {
    case "operator":
      return {
        operation: "operator_commit", baseRevision, action: command.action,
        targetId: command.targetId, snapshot,
      }
    case "sheet": {
      const sheet = snapshot.scoreSheets.find((entry) => entry.id === command.sheetId)
      if (sheet === undefined) throw new Error("저장할 평가지를 찾을 수 없습니다.")
      return {
        operation: command.operation, baseRevision, sheetId: command.sheetId,
        scores: sheet.scores, passResult: sheet.passResult,
      }
    }
    case "language_save":
      return { operation: "save_language_record", baseRevision, record: command.record }
    case "language_delete":
      return { operation: "delete_language_record", baseRevision, recordId: command.recordId }
    case "certification_save":
      return { operation: "save_certification_record", baseRevision, record: command.record }
    case "certification_delete":
      return { operation: "delete_certification_record", baseRevision, recordId: command.recordId }
    case "score_adjustment_save":
      return { operation: "save_score_adjustment", baseRevision, adjustment: command.adjustment }
    case "score_adjustment_delete":
      return { operation: "delete_score_adjustment", baseRevision, adjustmentId: command.adjustmentId }
    default:
      return assertNever(command)
  }
}

export async function loadRemoteEvaluation(): Promise<RemoteEvaluationState> {
  return invokeAuthenticated("evaluation-api", { operation: "load" }, responseSchema)
}

export async function persistRemoteEvaluation(
  command: RemoteEvaluationCommand,
  snapshot: EvaluationSnapshot,
  revision: number,
): Promise<RemoteEvaluationState> {
  return invokeAuthenticated(
    "evaluation-api",
    createRemoteRequest(command, snapshot, revision),
    responseSchema,
  )
}

function assertNever(value: never): never {
  throw new RangeError(`지원하지 않는 원격 명령입니다: ${String(value)}`)
}
