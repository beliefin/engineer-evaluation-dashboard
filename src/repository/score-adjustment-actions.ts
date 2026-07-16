import type { EngineerScoreAdjustment, EvaluationSnapshot } from "@/domain"

import {
  deleteScoreAdjustmentInputSchema,
  parseRepositoryInput,
  saveScoreAdjustmentInputSchema,
} from "./input-schemas"
import { appendAuditEvent, createEntityId, type MutationContext } from "./mutation-context"
import { requireCycleUnlocked, requireEngineer, requireOperator } from "./repository-helpers"
import { RepositoryError, type DeleteScoreAdjustmentInput, type SaveScoreAdjustmentInput } from "./types"

export function saveScoreAdjustmentAction(
  context: MutationContext,
  input: SaveScoreAdjustmentInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(saveScoreAdjustmentInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireEngineer(context.snapshot, parsed.engineerId)

  const existing = parsed.adjustmentId === null
    ? undefined
    : context.snapshot.scoreAdjustments.find((entry) => entry.id === parsed.adjustmentId)
  if (parsed.adjustmentId !== null && existing === undefined) {
    throw new RepositoryError("NOT_FOUND", "수정할 가·감점 내역을 찾을 수 없습니다.")
  }
  if (existing !== undefined && (
    existing.cycleId !== parsed.cycleId || existing.engineerId !== parsed.engineerId
  )) {
    throw new RepositoryError("INVALID_INPUT", "가·감점 대상과 평가 시즌이 일치하지 않습니다.")
  }

  const adjustment: EngineerScoreAdjustment = {
    id: existing?.id ?? createEntityId(context, "score-adjustment"),
    cycleId: parsed.cycleId,
    engineerId: parsed.engineerId,
    amount: parsed.amount,
    reason: parsed.reason,
    createdAt: existing?.createdAt ?? context.now,
    updatedAt: context.now,
  }
  const scoreAdjustments = existing === undefined
    ? [...context.snapshot.scoreAdjustments, adjustment]
    : context.snapshot.scoreAdjustments.map((entry) =>
        entry.id === existing.id ? adjustment : entry,
      )

  return appendAuditEvent(context, { ...context.snapshot, scoreAdjustments }, {
    cycleId: parsed.cycleId,
    type: "score_adjustment_saved",
    actor: parsed.actor,
    targetId: adjustment.id,
    reason: parsed.reason,
  })
}

export function deleteScoreAdjustmentAction(
  context: MutationContext,
  input: DeleteScoreAdjustmentInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(deleteScoreAdjustmentInputSchema, input)
  requireOperator(parsed.actor)
  const existing = context.snapshot.scoreAdjustments.find(
    (entry) => entry.id === parsed.adjustmentId,
  )
  if (existing === undefined) {
    throw new RepositoryError("NOT_FOUND", "삭제할 가·감점 내역을 찾을 수 없습니다.")
  }
  requireCycleUnlocked(context.snapshot, existing.cycleId)

  return appendAuditEvent(context, {
    ...context.snapshot,
    scoreAdjustments: context.snapshot.scoreAdjustments.filter(
      (entry) => entry.id !== existing.id,
    ),
  }, {
    cycleId: existing.cycleId,
    type: "score_adjustment_deleted",
    actor: parsed.actor,
    targetId: existing.id,
    reason: existing.reason,
  })
}
