import type { Profile, Snapshot, Task } from "./model.ts"
import { aggregateEvaluatorScore, derivedScore } from "./projection.ts"

type Rule = Snapshot["directScoreRules"][number]
type LanguageRecord = Snapshot["languageScoreRecords"][number]
type CertificationRecord = Snapshot["certificationRecords"][number]
type SourceRecord = LanguageRecord | CertificationRecord

export type ViewerRanking = Readonly<{
  cycleId: string
  engineerId: string
  rank: number | null
  cohortCount: number
}>

function recordValue(record: SourceRecord, field: Rule["field"]): string {
  switch (field) {
    case "examName": return "examName" in record ? record.examName : ""
    case "result": return "result" in record ? record.result : ""
    case "certificateName": return "certificateName" in record ? record.certificateName : ""
    case "grade": return "grade" in record ? (record.grade ?? "") : ""
  }
}

function matchesRule(record: SourceRecord, rule: Rule): boolean {
  const actual = recordValue(record, rule.field).trim()
  const expected = rule.value.trim()
  if (actual === "" || expected === "") return false
  switch (rule.operator) {
    case "equals": return actual.toLocaleLowerCase("ko-KR") === expected.toLocaleLowerCase("ko-KR")
    case "contains": return actual.toLocaleLowerCase("ko-KR").includes(expected.toLocaleLowerCase("ko-KR"))
    case "gte": {
      const actualNumber = Number(actual.replaceAll(",", ""))
      const expectedNumber = Number(expected.replaceAll(",", ""))
      return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber >= expectedNumber
    }
  }
}

function languageGroup(record: LanguageRecord): "english" | "second_language" {
  return record.languageGroup ?? (record.examName.includes("제2") ? "second_language" : "english")
}

function languageBaseRule(record: LanguageRecord, rules: readonly Rule[], result = record.result): Rule | undefined {
  const candidate = { ...record, result }
  return rules.filter((rule) =>
    rule.enabled && rule.kind === "language" && rule.ruleType === "base" &&
    (rule.languageGroup == null || rule.languageGroup === languageGroup(candidate)) &&
    (rule.examName == null || rule.examName.toLocaleLowerCase("ko-KR") === candidate.examName.toLocaleLowerCase("ko-KR")) &&
    matchesRule(candidate, rule)
  ).toSorted((left, right) => right.score - left.score || left.order - right.order)[0]
}

function languageBonus(rules: readonly Rule[], condition: NonNullable<Rule["bonusCondition"]>): number {
  return rules.filter((rule) =>
    rule.enabled && rule.kind === "language" && rule.ruleType === "bonus" && rule.bonusCondition === condition
  ).reduce((highest, rule) => Math.max(highest, rule.bonus), 0)
}

function calculateLanguageScore(records: readonly LanguageRecord[], rules: readonly Rule[], startsAt: string): number | null {
  if (records.some((record) => record.noScore === true)) return 0
  const ranked = records.flatMap((record) => {
    const rule = languageBaseRule(record, rules)
    return rule === undefined ? [] : [{ record, rule }]
  }).toSorted((left, right) => right.rule.score - left.rule.score || left.rule.order - right.rule.order)
  const best = ranked[0]
  if (best === undefined) return null
  const upgraded = ranked.some(({ record, rule }) => {
    if (record.previousResult == null || record.previousResult.trim() === "") return false
    const previous = languageBaseRule(record, rules, record.previousResult)
    return previous !== undefined && rule.score > previous.score
  })
  const evaluationYear = startsAt.slice(0, 4)
  const newSecondLanguage = ranked.some(({ record }) =>
    languageGroup(record) === "second_language" && record.newlyAcquired === true &&
    record.acquiredOn?.startsWith(evaluationYear) === true
  )
  return Math.min(100, best.rule.score +
    (upgraded ? languageBonus(rules, "grade_upgrade") : 0) +
    (newSecondLanguage ? languageBonus(rules, "second_language_new") : 0))
}

function calculateCertificationScore(records: readonly CertificationRecord[], rules: readonly Rule[], startsAt: string): number | null {
  if (records.some((record) => record.noScore === true)) return 0
  const matched = records.flatMap((record) => {
    const rule = rules.filter((candidate) =>
      candidate.enabled && candidate.kind === "certification" && candidate.ruleType === "base" &&
      matchesRule(record, candidate)
    ).toSorted((left, right) => right.score - left.score || left.order - right.order)[0]
    return rule === undefined ? [] : [{ record, rule }]
  })
  if (matched.length === 0) return null
  const ranked = matched.filter(({ rule }) => rule.value !== "필기 합격")
    .toSorted((left, right) => right.rule.score - left.rule.score || left.rule.order - right.rule.order)
  const evaluationYear = startsAt.slice(0, 4)
  const bonus = ranked.filter(({ record }) => record.acquiredOn?.startsWith(evaluationYear) === true)
    .toSorted((left, right) => right.rule.bonus - left.rule.bonus || left.rule.order - right.rule.order)[0]
  const partial = matched.filter(({ record, rule }) =>
    rule.value === "필기 합격" && record.acquiredOn?.startsWith(evaluationYear) === true
  ).toSorted((left, right) => right.rule.score - left.rule.score || left.rule.order - right.rule.order)[0]
  const base = ranked.slice(0, 3).reduce((total, entry) => total + entry.rule.score, 0)
  return Math.min(100, base + (bonus?.rule.bonus ?? 0) + (partial?.rule.score ?? 0))
}

function verified(snapshot: Snapshot, recordId: string): boolean {
  const latest = snapshot.auditEvents.findLast((event) => event.targetId === recordId && (
    event.type === "language_record_saved" || event.type === "certification_record_saved" ||
    event.type === "source_record_verified"
  ))
  return latest === undefined || latest.type === "source_record_verified" || latest.actorRole !== "engineer"
}

function taskScore(snapshot: Snapshot, task: Task, engineerId: string, startsAt: string): number | null {
  if (task.method === "evaluator_score" || task.method === "evaluator_pass_fail") {
    return aggregateEvaluatorScore(snapshot, task, engineerId)
  }
  if (task.method === "derived_score") return derivedScore(snapshot, task.id, engineerId)
  const stored = snapshot.directScores.find((entry) =>
    entry.cycleId === task.cycleId && entry.engineerId === engineerId && entry.taskId === task.id)
  if (task.method === "operator_pass_fail") {
    return stored?.passResult == null ? null : stored.passResult ? 100 : 0
  }
  const rules = snapshot.directScoreRules.filter((rule) => rule.taskId === task.id)
  if (rules.length === 0) return stored?.score ?? null
  if (rules[0]?.kind === "language") {
    return calculateLanguageScore(snapshot.languageScoreRecords.filter((record) =>
      record.cycleId === task.cycleId && record.engineerId === engineerId && verified(snapshot, record.id)
    ), rules, startsAt)
  }
  return calculateCertificationScore(snapshot.certificationRecords.filter((record) =>
    record.cycleId === task.cycleId && record.engineerId === engineerId && verified(snapshot, record.id)
  ), rules, startsAt)
}

function currentScore(snapshot: Snapshot, cycleId: string, engineerId: string): number | null {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return null
  const contributions = snapshot.tasks.filter((task) => task.cycleId === cycleId).flatMap((task) => {
    const weight = snapshot.engineerTaskWeights.find((entry) =>
      entry.cycleId === cycleId && entry.engineerId === engineerId && entry.taskId === task.id)?.weight ?? task.weight
    if (weight <= 0) return []
    const score = taskScore(snapshot, task, engineerId, cycle.startsAt)
    return score === null ? [] : [score * (weight / 100)]
  })
  if (contributions.length === 0) return null
  const adjustment = snapshot.scoreAdjustments.filter((entry) =>
    entry.cycleId === cycleId && entry.engineerId === engineerId
  ).reduce((total, entry) => total + entry.amount, 0)
  const score = Math.min(100, Math.max(0, contributions.reduce((total, value) => total + value, 0) + adjustment))
  return Math.round((score + Number.EPSILON) * 100) / 100
}

export function projectViewerRankings(snapshot: Snapshot, profile: Profile): readonly ViewerRanking[] {
  if (profile.role !== "engineer" || profile.engineer_id === null) return []
  return snapshot.cycles.map((cycle) => {
    const candidates = snapshot.engineers.flatMap((engineer) => {
      const score = currentScore(snapshot, cycle.id, engineer.id)
      return score === null ? [] : [{ engineerId: engineer.id, score }]
    }).toSorted((left, right) => right.score - left.score || left.engineerId.localeCompare(right.engineerId))
    const target = candidates.find((entry) => entry.engineerId === profile.engineer_id)
    return {
      cycleId: cycle.id,
      engineerId: profile.engineer_id,
      rank: target === undefined ? null : candidates.findIndex((entry) => entry.score === target.score) + 1,
      cohortCount: candidates.length,
    }
  })
}
