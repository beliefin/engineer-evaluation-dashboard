import type { EvaluationSnapshot, ScoreSheet } from "@/domain"

import {
  parseRepositoryInput,
  reopenSheetInputSchema,
  requestSheetUnlockInputSchema,
  saveDraftInputSchema,
  sheetActionInputSchema,
} from "./input-schemas"
import { appendAuditEvent, type MutationContext } from "./mutation-context"
import {
  requireAssignment,
  requireCycleUnlocked,
  requireOperator,
  requireSheet,
  requireSheetActor,
  requireTask,
  validateSheetResponse,
} from "./repository-helpers"
import {
  RepositoryError,
  type ReopenSheetInput,
  type RequestSheetUnlockInput,
  type SaveDraftInput,
  type SheetActionInput,
} from "./types"

export function saveDraftAction(
  context: MutationContext,
  input: SaveDraftInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(saveDraftInputSchema, input)
  const sheet = requireSheet(context.snapshot, parsed.sheetId)
  const assignment = requireAssignment(context.snapshot, sheet.assignmentId)
  requireSheetActor(parsed.actor, assignment)
  requireCycleUnlocked(context.snapshot, assignment.cycleId)
  if (sheet.status === "submitted" && parsed.actor.role !== "operator") {
    throw new RepositoryError("SHEET_LOCKED", "submitted score sheets are locked")
  }
  validateSheetResponse(context.snapshot, assignment, parsed.scores, parsed.passResult)
  const nextSheet: ScoreSheet = {
    ...sheet,
    scores: parsed.scores,
    passResult: parsed.passResult,
    updatedAt: context.now,
  }
  return {
    ...context.snapshot,
    scoreSheets: context.snapshot.scoreSheets.map((candidate) =>
      candidate.id === sheet.id ? nextSheet : candidate,
    ),
  }
}

export function submitSheetAction(
  context: MutationContext,
  input: SheetActionInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(sheetActionInputSchema, input)
  const sheet = requireSheet(context.snapshot, parsed.sheetId)
  const assignment = requireAssignment(context.snapshot, sheet.assignmentId)
  requireSheetActor(parsed.actor, assignment)
  requireCycleUnlocked(context.snapshot, assignment.cycleId)
  if (sheet.status === "submitted" && parsed.actor.role !== "operator") {
    throw new RepositoryError("SHEET_LOCKED", "score sheet is already submitted")
  }
  if (sheet.status === "submitted") return context.snapshot
  const task = requireTask(context.snapshot, assignment.taskId)
  validateSheetResponse(context.snapshot, assignment, sheet.scores, sheet.passResult)
  const incomplete = task.method === "evaluator_score"
    ? sheet.scores.some((entry) => entry.score === null)
    : sheet.passResult === null
  if (incomplete) {
    throw new RepositoryError("INCOMPLETE_SHEET", "모든 평가 내용을 입력해야 제출할 수 있습니다.")
  }
  const nextSheet: ScoreSheet = {
    ...sheet,
    status: "submitted",
    updatedAt: context.now,
    submittedAt: context.now,
  }
  return appendAuditEvent(
    context,
    {
      ...context.snapshot,
      scoreSheets: context.snapshot.scoreSheets.map((candidate) =>
        candidate.id === sheet.id ? nextSheet : candidate,
      ),
    },
    {
      cycleId: assignment.cycleId,
      type: "sheet_submitted",
      actor: parsed.actor,
      targetId: sheet.id,
    },
  )
}

export function requestSheetUnlockAction(
  context: MutationContext,
  input: RequestSheetUnlockInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(requestSheetUnlockInputSchema, input)
  if (parsed.actor.role !== "evaluator") {
    throw new RepositoryError("FORBIDDEN", "평가자만 잠금 해제를 요청할 수 있습니다.")
  }
  const sheet = requireSheet(context.snapshot, parsed.sheetId)
  const assignment = requireAssignment(context.snapshot, sheet.assignmentId)
  requireSheetActor(parsed.actor, assignment)
  requireCycleUnlocked(context.snapshot, assignment.cycleId)
  if (sheet.status !== "submitted") {
    throw new RepositoryError("INVALID_INPUT", "제출되어 잠긴 평가지만 해제를 요청할 수 있습니다.")
  }
  const existing = context.snapshot.unlockRequests.find((request) =>
    request.sheetId === sheet.id && request.status === "pending")
  const request = {
    id: existing?.id ?? context.idFactory(),
    cycleId: assignment.cycleId,
    sheetId: sheet.id,
    evaluatorId: assignment.evaluatorId,
    reason: parsed.reason,
    status: "pending" as const,
    createdAt: existing?.createdAt ?? context.now,
    resolvedAt: null,
  }
  const snapshot: EvaluationSnapshot = {
    ...context.snapshot,
    unlockRequests: existing === undefined
      ? [...context.snapshot.unlockRequests, request]
      : context.snapshot.unlockRequests.map((entry) => entry.id === existing.id ? request : entry),
  }
  return appendAuditEvent(context, snapshot, {
    cycleId: assignment.cycleId,
    type: "sheet_unlock_requested",
    actor: parsed.actor,
    targetId: sheet.id,
    reason: parsed.reason,
  })
}

export function reopenSheetAction(
  context: MutationContext,
  input: ReopenSheetInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(reopenSheetInputSchema, input)
  if (parsed.reason.length === 0) {
    throw new RepositoryError("REASON_REQUIRED", "a reopen reason is required")
  }
  requireOperator(parsed.actor)
  const sheet = requireSheet(context.snapshot, parsed.sheetId)
  if (sheet.status === "draft") {
    throw new RepositoryError("INVALID_INPUT", "score sheet is already open")
  }
  const assignment = requireAssignment(context.snapshot, sheet.assignmentId)
  requireCycleUnlocked(context.snapshot, assignment.cycleId)
  const nextSheet: ScoreSheet = {
    ...sheet,
    status: "draft",
    updatedAt: context.now,
    submittedAt: null,
  }
  return appendAuditEvent(
    context,
    {
      ...context.snapshot,
      scoreSheets: context.snapshot.scoreSheets.map((candidate) =>
        candidate.id === sheet.id ? nextSheet : candidate,
      ),
      unlockRequests: context.snapshot.unlockRequests.map((request) =>
        request.sheetId === sheet.id && request.status === "pending"
          ? { ...request, status: "resolved" as const, resolvedAt: context.now }
          : request),
    },
    {
      cycleId: assignment.cycleId,
      type: "sheet_reopened",
      actor: parsed.actor,
      targetId: sheet.id,
      reason: parsed.reason,
    },
  )
}
