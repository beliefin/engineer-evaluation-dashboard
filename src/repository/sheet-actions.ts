import type { EvaluationSnapshot, ScoreSheet } from "@/domain"

import {
  parseRepositoryInput,
  reopenSheetInputSchema,
  saveDraftInputSchema,
  sheetActionInputSchema,
} from "./input-schemas"
import { appendAuditEvent, type MutationContext } from "./mutation-context"
import {
  requireAssignment,
  requireOperator,
  requireSheet,
  requireSheetActor,
  requireTask,
  validateSheetResponse,
} from "./repository-helpers"
import {
  RepositoryError,
  type ReopenSheetInput,
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
  if (sheet.status === "submitted") {
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
  if (sheet.status === "submitted") {
    throw new RepositoryError("SHEET_LOCKED", "score sheet is already submitted")
  }
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
