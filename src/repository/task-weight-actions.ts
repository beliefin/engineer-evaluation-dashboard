import type { EvaluationSnapshot } from "@/domain"

import {
  parseRepositoryInput,
  updateEngineerTaskWeightsInputSchema,
} from "./input-schemas"
import { appendAuditEvent, type MutationContext } from "./mutation-context"
import {
  requireCycleUnlocked,
  requireEngineer,
  requireOperator,
} from "./repository-helpers"
import {
  RepositoryError,
  type UpdateEngineerTaskWeightsInput,
} from "./types"

const TOTAL_WEIGHT = 100
const WEIGHT_EPSILON = 0.000_001

export function updateEngineerTaskWeightsAction(
  context: MutationContext,
  input: UpdateEngineerTaskWeightsInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(updateEngineerTaskWeightsInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireEngineer(context.snapshot, parsed.engineerId)

  const tasks = context.snapshot.tasks.filter((task) => task.cycleId === parsed.cycleId)
  const taskIds = new Set(tasks.map((task) => task.id))
  const receivedIds = parsed.weights.map((entry) => entry.taskId)
  const hasExactTaskSet =
    receivedIds.length === taskIds.size &&
    new Set(receivedIds).size === receivedIds.length &&
    receivedIds.every((taskId) => taskIds.has(taskId))
  if (!hasExactTaskSet) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "현재 평가 시즌의 모든 과제 가중치를 한 번씩 입력해 주세요.",
    )
  }
  const seasonWeightTotal = tasks.reduce((sum, task) => sum + task.weight, 0)
  if (parsed.useSeasonDefaults && Math.abs(seasonWeightTotal - TOTAL_WEIGHT) >= WEIGHT_EPSILON) {
    throw new RepositoryError(
      "INVALID_INPUT",
      `시즌 기본 가중치 합계가 ${seasonWeightTotal}%이므로 개인별 가중치 100%를 확정할 수 없습니다. 택1 과제는 시즌 기본값 적용을 해제해 엔지니어별로 선택해 주세요.`,
    )
  }
  const total = parsed.weights.reduce((sum, entry) => sum + entry.weight, 0)
  if (!parsed.useSeasonDefaults && Math.abs(total - TOTAL_WEIGHT) >= WEIGHT_EPSILON) {
    throw new RepositoryError(
      "INVALID_INPUT",
      `개인별 과제 가중치 합계를 100%로 맞춰 주세요. 현재 ${total}%입니다.`,
    )
  }

  const retained = context.snapshot.engineerTaskWeights.filter(
    (entry) => !(
      entry.cycleId === parsed.cycleId && entry.engineerId === parsed.engineerId
    ),
  )
  const snapshot: EvaluationSnapshot = {
    ...context.snapshot,
    engineerTaskWeights: [
      ...(!parsed.useSeasonDefaults
        ? [...retained, ...parsed.weights.map((entry) => ({
            cycleId: parsed.cycleId,
            engineerId: parsed.engineerId,
            taskId: entry.taskId,
            weight: entry.weight,
          }))]
        : retained),
    ],
  }
  return appendAuditEvent(context, snapshot, {
    cycleId: parsed.cycleId,
    type: "engineer_task_weights_updated",
    actor: parsed.actor,
    targetId: parsed.engineerId,
  })
}
