import type { DirectScore, EvaluationSnapshot } from "@/domain"

import { parseRepositoryInput, updateDirectScoreInputSchema } from "./input-schemas"
import { appendAuditEvent, type MutationContext } from "./mutation-context"
import {
  requireCycleUnlocked,
  requireEngineer,
  requireOperator,
  requireTask,
} from "./repository-helpers"
import { RepositoryError, type UpdateDirectScoreInput } from "./types"

export function updateDirectScoreAction(
  context: MutationContext,
  input: UpdateDirectScoreInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(updateDirectScoreInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireEngineer(context.snapshot, parsed.engineerId)
  const task = requireTask(context.snapshot, parsed.taskId)
  if (task.cycleId !== parsed.cycleId) {
    throw new RepositoryError("INVALID_INPUT", "과제와 평가 시즌이 일치하지 않습니다.")
  }
  if (task.method === "evaluator_score" || task.method === "evaluator_pass_fail") {
    throw new RepositoryError("INVALID_INPUT", "평가자 과제는 직접 점수로 입력할 수 없습니다.")
  }
  if (task.method === "operator_score" && parsed.passResult !== null) {
    throw new RepositoryError("INVALID_INPUT", "점수형 과제에는 P/F 결과를 입력할 수 없습니다.")
  }
  if (task.method === "operator_pass_fail" && parsed.score !== null) {
    throw new RepositoryError("INVALID_INPUT", "P/F 과제에는 점수를 입력할 수 없습니다.")
  }
  const existing = context.snapshot.directScores.find(
    (score) =>
      score.cycleId === parsed.cycleId &&
      score.engineerId === parsed.engineerId &&
      score.taskId === parsed.taskId,
  )
  const nextScore: DirectScore = {
    id: existing?.id ?? `direct-${parsed.engineerId}-${parsed.taskId}`,
    cycleId: parsed.cycleId,
    engineerId: parsed.engineerId,
    taskId: parsed.taskId,
    score: parsed.score,
    passResult: parsed.passResult,
    updatedAt: context.now,
  }
  const directScores = existing
    ? context.snapshot.directScores.map((score) =>
        score.id === existing.id ? nextScore : score,
      )
    : [...context.snapshot.directScores, nextScore]
  return appendAuditEvent(
    context,
    { ...context.snapshot, directScores },
    {
      cycleId: parsed.cycleId,
      type: "direct_score_updated",
      actor: parsed.actor,
      targetId: nextScore.id,
    },
  )
}
