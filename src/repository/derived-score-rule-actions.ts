import type { DerivedScoreRule, EvaluationSnapshot } from "@/domain"

import {
  deleteDerivedScoreRuleInputSchema,
  parseRepositoryInput,
  saveDerivedScoreRuleInputSchema,
} from "./input-schemas"
import { appendAuditEvent, createEntityId, type MutationContext } from "./mutation-context"
import {
  requireCycleUnlocked,
  requireEngineer,
  requireOperator,
  requireTask,
} from "./repository-helpers"
import {
  RepositoryError,
  type DeleteDerivedScoreRuleInput,
  type SaveDerivedScoreRuleInput,
} from "./types"

export function saveDerivedScoreRuleAction(
  context: MutationContext,
  input: SaveDerivedScoreRuleInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(saveDerivedScoreRuleInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  const task = requireTask(context.snapshot, parsed.taskId)
  const sourceTask = requireTask(context.snapshot, parsed.sourceTaskId)
  requireEngineer(context.snapshot, parsed.targetEngineerId)
  parsed.sourceEngineerIds.forEach((engineerId) => requireEngineer(context.snapshot, engineerId))
  if (task.cycleId !== parsed.cycleId || task.method !== "derived_score") {
    throw new RepositoryError("INVALID_INPUT", "파생 평균형 과제만 연결할 수 있습니다.")
  }
  if (sourceTask.cycleId !== parsed.cycleId ||
    (sourceTask.method !== "evaluator_score" && sourceTask.method !== "evaluator_pass_fail")) {
    throw new RepositoryError("INVALID_INPUT", "평가자 점수형 또는 P/F형 과제만 원천으로 선택할 수 있습니다.")
  }
  if (parsed.sourceEngineerIds.includes(parsed.targetEngineerId)) {
    throw new RepositoryError("INVALID_INPUT", "점수를 받을 본인은 원천 인원에서 제외해 주세요.")
  }
  const existing = parsed.ruleId === null
    ? undefined
    : context.snapshot.derivedScoreRules.find((rule) => rule.id === parsed.ruleId)
  if (parsed.ruleId !== null && existing === undefined) {
    throw new RepositoryError("NOT_FOUND", "연계 점수 규칙을 찾을 수 없습니다.")
  }
  const duplicate = context.snapshot.derivedScoreRules.some((rule) =>
    rule.id !== existing?.id &&
    rule.cycleId === parsed.cycleId &&
    rule.taskId === parsed.taskId &&
    rule.targetEngineerId === parsed.targetEngineerId)
  if (duplicate) {
    throw new RepositoryError("INVALID_INPUT", "같은 대상과 파생 과제에는 하나의 연계 규칙만 저장할 수 있습니다.")
  }
  const rule: DerivedScoreRule = {
    id: existing?.id ?? createEntityId(context, "derived-rule"),
    cycleId: parsed.cycleId,
    taskId: parsed.taskId,
    targetEngineerId: parsed.targetEngineerId,
    sourceTaskId: parsed.sourceTaskId,
    sourceEngineerIds: parsed.sourceEngineerIds,
    aggregation: "average",
  }
  return appendAuditEvent(context, {
    ...context.snapshot,
    derivedScoreRules: existing === undefined
      ? [...context.snapshot.derivedScoreRules, rule]
      : context.snapshot.derivedScoreRules.map((entry) => entry.id === rule.id ? rule : entry),
  }, {
    cycleId: parsed.cycleId,
    type: "derived_score_rule_saved",
    actor: parsed.actor,
    targetId: rule.id,
  })
}

export function deleteDerivedScoreRuleAction(
  context: MutationContext,
  input: DeleteDerivedScoreRuleInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(deleteDerivedScoreRuleInputSchema, input)
  requireOperator(parsed.actor)
  const rule = context.snapshot.derivedScoreRules.find((entry) => entry.id === parsed.ruleId)
  if (rule === undefined) throw new RepositoryError("NOT_FOUND", "연계 점수 규칙을 찾을 수 없습니다.")
  requireCycleUnlocked(context.snapshot, rule.cycleId)
  return appendAuditEvent(context, {
    ...context.snapshot,
    derivedScoreRules: context.snapshot.derivedScoreRules.filter((entry) => entry.id !== rule.id),
  }, {
    cycleId: rule.cycleId,
    type: "derived_score_rule_deleted",
    actor: parsed.actor,
    targetId: rule.id,
  })
}
