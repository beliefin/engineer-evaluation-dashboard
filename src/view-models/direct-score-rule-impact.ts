import type { DirectScoreRule, EvaluationSnapshot } from "@/domain"

import { selectEngineerResultSummaries } from "./results"

export type DirectScoreRuleImpactDraft = Readonly<{
  ruleId: string | null
  taskId: string
  kind: DirectScoreRule["kind"]
  label: string
  field: DirectScoreRule["field"]
  operator: DirectScoreRule["operator"]
  value: string
  ruleType: DirectScoreRule["ruleType"]
  score: number
  rawScore?: number | null
  bonus: number
  enabled: boolean
  category?: string | null
  difficulty?: string | null
  workRelevance?: string | null
  languageGroup?: DirectScoreRule["languageGroup"]
  examName?: string | null
  bonusCondition?: DirectScoreRule["bonusCondition"]
}>

export type DirectScoreRuleImpactRow = Readonly<{
  engineerId: string
  engineerName: string
  currentTaskScore: number | null
  proposedTaskScore: number | null
  currentFinalScore: number | null
  proposedFinalScore: number | null
}>

export type DirectScoreRuleImpact = Readonly<{
  affectedCount: number
  rows: ReadonlyArray<DirectScoreRuleImpactRow>
}>

function scoreChanged(left: number | null, right: number | null): boolean {
  if (left === null || right === null) return left !== right
  return Math.abs(left - right) > 0.000_001
}

export function selectDirectScoreRuleImpact(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  draft: DirectScoreRuleImpactDraft,
): DirectScoreRuleImpact {
  const existing = draft.ruleId === null
    ? undefined
    : snapshot.directScoreRules.find((rule) => rule.id === draft.ruleId)
  const nextRule: DirectScoreRule = {
    id: existing?.id ?? "preview-direct-score-rule",
    cycleId,
    taskId: draft.taskId,
    kind: draft.kind,
    label: draft.label,
    field: draft.field,
    operator: draft.operator,
    value: draft.value,
    ruleType: draft.ruleType,
    score: draft.score,
    rawScore: draft.rawScore ?? null,
    bonus: draft.bonus,
    enabled: draft.enabled,
    order: existing?.order ?? Math.max(
      0,
      ...snapshot.directScoreRules.filter((rule) => rule.cycleId === cycleId).map((rule) => rule.order),
    ) + 1,
    category: draft.category ?? null,
    difficulty: draft.difficulty ?? null,
    workRelevance: draft.workRelevance ?? null,
    languageGroup: draft.languageGroup ?? null,
    examName: draft.examName ?? null,
    bonusCondition: draft.bonusCondition ?? null,
  }
  const proposedSnapshot: EvaluationSnapshot = {
    ...snapshot,
    directScoreRules: existing === undefined
      ? [...snapshot.directScoreRules, nextRule]
      : snapshot.directScoreRules.map((rule) => rule.id === nextRule.id ? nextRule : rule),
  }
  const currentByEngineer = new Map(
    selectEngineerResultSummaries(snapshot, cycleId).map((summary) => [summary.engineer.id, summary]),
  )
  const proposedByEngineer = new Map(
    selectEngineerResultSummaries(proposedSnapshot, cycleId).map((summary) => [summary.engineer.id, summary]),
  )
  const rows = snapshot.engineers.flatMap((engineer) => {
    const current = currentByEngineer.get(engineer.id)?.result
    const proposed = proposedByEngineer.get(engineer.id)?.result
    if (current === undefined || proposed === undefined) return []
    const currentTaskScore = current.taskResults.find((result) => result.taskId === draft.taskId)?.score ?? null
    const proposedTaskScore = proposed.taskResults.find((result) => result.taskId === draft.taskId)?.score ?? null
    if (!scoreChanged(currentTaskScore, proposedTaskScore) &&
      !scoreChanged(current.roundedFinalScore, proposed.roundedFinalScore)) return []
    return [{
      engineerId: engineer.id,
      engineerName: engineer.displayName,
      currentTaskScore,
      proposedTaskScore,
      currentFinalScore: current.roundedFinalScore,
      proposedFinalScore: proposed.roundedFinalScore,
    }]
  })
  return { affectedCount: rows.length, rows }
}
