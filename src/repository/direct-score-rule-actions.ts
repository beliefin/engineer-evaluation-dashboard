import type { DirectScoreRule, EvaluationSnapshot } from "@/domain"

import {
  deleteDirectScoreRuleInputSchema,
  parseRepositoryInput,
  saveDirectScoreRuleInputSchema,
} from "./input-schemas"
import { appendAuditEvent, createEntityId, type MutationContext } from "./mutation-context"
import { requireCycleUnlocked, requireOperator, requireTask } from "./repository-helpers"
import {
  RepositoryError,
  type DeleteDirectScoreRuleInput,
  type SaveDirectScoreRuleInput,
} from "./types"

export function saveDirectScoreRuleAction(
  context: MutationContext,
  input: SaveDirectScoreRuleInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(saveDirectScoreRuleInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  const task = requireTask(context.snapshot, parsed.taskId)
  if (task.cycleId !== parsed.cycleId || task.method !== "operator_score") {
    throw new RepositoryError("INVALID_INPUT", "?섏궛 ?쒖꽦??怨쇱젣留??좏깮?????덉뒿?덈떎.")
  }
  const existing = parsed.ruleId === null
    ? undefined
    : context.snapshot.directScoreRules.find((rule) => rule.id === parsed.ruleId)
  if (parsed.ruleId !== null && existing === undefined) {
    throw new RepositoryError("NOT_FOUND", "?섏궛 援칙???李얠쓣 ???놁뒿?덈떎.")
  }
  if (existing !== undefined && existing.cycleId !== parsed.cycleId) {
    throw new RepositoryError("INVALID_INPUT", "다른 평가 시즌의 규칙은 수정할 수 없습니다.")
  }
  const conflictingKind = context.snapshot.directScoreRules.find(
    (rule) => rule.cycleId === parsed.cycleId && rule.taskId === parsed.taskId && rule.kind !== parsed.kind,
  )
  if (conflictingKind !== undefined) {
    throw new RepositoryError("INVALID_INPUT", "하나의 과제에는 어학 또는 자격증 중 한 종류의 원천만 연결할 수 있습니다.")
  }
  if (parsed.kind === "language" && !["examName", "result"].includes(parsed.field)) {
    throw new RepositoryError("INVALID_INPUT", "어학 규칙은 시험명 또는 결과 필드를 사용해야 합니다.")
  }
  if (parsed.kind === "certification" && !["certificateName", "grade"].includes(parsed.field)) {
    throw new RepositoryError("INVALID_INPUT", "자격증 규칙은 자격증명 또는 등급 필드를 사용해야 합니다.")
  }
  const rule: DirectScoreRule = {
    id: existing?.id ?? createEntityId(context, "score-rule"),
    cycleId: parsed.cycleId,
    taskId: parsed.taskId,
    kind: parsed.kind,
    label: parsed.label,
    field: parsed.field,
    operator: parsed.operator,
    value: parsed.value,
    ruleType: parsed.ruleType,
    score: parsed.score,
    bonus: parsed.bonus,
    enabled: parsed.enabled,
    order: existing?.order ?? Math.max(0, ...context.snapshot.directScoreRules.filter((entry) => entry.cycleId === parsed.cycleId).map((entry) => entry.order)) + 1,
  }
  const next: EvaluationSnapshot = {
    ...context.snapshot,
    directScoreRules: existing === undefined
      ? [...context.snapshot.directScoreRules, rule]
      : context.snapshot.directScoreRules.map((entry) => entry.id === rule.id ? rule : entry),
  }
  return appendAuditEvent(context, next, {
    cycleId: parsed.cycleId,
    type: "direct_score_updated",
    actor: parsed.actor,
    targetId: rule.id,
  })
}

export function deleteDirectScoreRuleAction(
  context: MutationContext,
  input: DeleteDirectScoreRuleInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(deleteDirectScoreRuleInputSchema, input)
  requireOperator(parsed.actor)
  const rule = context.snapshot.directScoreRules.find((entry) => entry.id === parsed.ruleId)
  if (rule === undefined) throw new RepositoryError("NOT_FOUND", "?섏궛 援칙???李얠쓣 ???놁뒿?덈떎.")
  return appendAuditEvent(context, {
    ...context.snapshot,
    directScoreRules: context.snapshot.directScoreRules.filter((entry) => entry.id !== rule.id),
  }, {
    cycleId: rule.cycleId,
    type: "direct_score_updated",
    actor: parsed.actor,
    targetId: rule.id,
  })
}
