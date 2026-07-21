import type {
  CertificationRecord,
  DirectScoreRule,
  LanguageScoreRecord,
} from "./types"

export type DirectScoreSourceRecord = LanguageScoreRecord | CertificationRecord

export type CertificationScoreEntry = Readonly<{
  recordId: string
  certificateName: string
  baseScore: number
  newAcquisitionBonus: number
  includedInTopThree: boolean
  bonusApplied: boolean
  partialScoreApplied: boolean
}>

export type CertificationScoreBreakdown = Readonly<{
  score: number | null
  baseScore: number
  bonusScore: number
  partialScore: number
  entries: ReadonlyArray<CertificationScoreEntry>
}>

export type LanguageScoreEntry = Readonly<{
  recordId: string
  baseScore: number | null
  selectedAsBest: boolean
  gradeUpgradeApplied: boolean
  secondLanguageNewBonusApplied: boolean
}>

export type LanguageScoreBreakdown = Readonly<{
  score: number | null
  baseScore: number
  gradeUpgradeBonus: number
  secondLanguageNewBonus: number
  entries: ReadonlyArray<LanguageScoreEntry>
}>

function recordValue(
  record: DirectScoreSourceRecord,
  field: DirectScoreRule["field"],
): string {
  switch (field) {
    case "examName":
      return "examName" in record ? record.examName : ""
    case "result":
      return "result" in record ? record.result : ""
    case "certificateName":
      return "certificateName" in record ? record.certificateName : ""
    case "grade":
      return "grade" in record ? (record.grade ?? "") : ""
    default:
      return assertNever(field)
  }
}

export function matchesDirectScoreRule(
  record: DirectScoreSourceRecord,
  rule: DirectScoreRule,
): boolean {
  const actual = recordValue(record, rule.field).trim()
  const expected = rule.value.trim()
  if (actual === "" || expected === "") return false

  switch (rule.operator) {
    case "equals":
      return actual.toLocaleLowerCase("ko-KR") === expected.toLocaleLowerCase("ko-KR")
    case "contains":
      return actual.toLocaleLowerCase("ko-KR").includes(expected.toLocaleLowerCase("ko-KR"))
    case "gte": {
      const actualNumber = Number(actual.replaceAll(",", ""))
      const expectedNumber = Number(expected.replaceAll(",", ""))
      return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber >= expectedNumber
    }
    default:
      return assertNever(rule.operator)
  }
}

export function convertDirectScoreRecord(
  record: DirectScoreSourceRecord,
  rules: ReadonlyArray<DirectScoreRule>,
): number | null {
  const applicable = rules
    .filter((rule) => rule.enabled && rule.kind === ("result" in record ? "language" : "certification"))
    .filter((rule) => !("result" in record) || matchesLanguageRuleScope(record, rule))
    .filter((rule) => matchesDirectScoreRule(record, rule))
  const base = applicable
    .filter((rule) => rule.ruleType === "base")
    .toSorted((left, right) => right.score - left.score || left.order - right.order)[0]
  if (base === undefined) return null
  const bonus = applicable
    .filter((rule) => rule.ruleType === "bonus")
    .reduce((total, rule) => total + rule.bonus, 0)
  return Math.min(100, base.score + bonus)
}

export function highestConvertedDirectScore(
  records: ReadonlyArray<DirectScoreSourceRecord>,
  rules: ReadonlyArray<DirectScoreRule>,
  cycleStartsAt?: string,
): number | null {
  if (rules.some((rule) => rule.kind === "certification")) {
    return calculateCertificationScore(
      records.filter((record): record is CertificationRecord => "certificateName" in record),
      rules,
      cycleStartsAt,
    ).score
  }
  if (rules.some((rule) => rule.kind === "language")) {
    return calculateLanguageScore(
      records.filter((record): record is LanguageScoreRecord => "result" in record),
      rules,
      cycleStartsAt,
    ).score
  }
  const values = records
    .map((record) => convertDirectScoreRecord(record, rules))
    .filter((value): value is number => value !== null)
  return values.length === 0 ? null : Math.max(...values)
}

function languageGroup(record: LanguageScoreRecord): "english" | "second_language" {
  return record.languageGroup ?? (record.examName.includes("제2") ? "second_language" : "english")
}

function matchesLanguageRuleScope(record: LanguageScoreRecord, rule: DirectScoreRule): boolean {
  if (rule.kind !== "language") return true
  if (rule.languageGroup != null && rule.languageGroup !== languageGroup(record)) return false
  if (rule.examName != null && rule.examName.toLocaleLowerCase("ko-KR") !== record.examName.toLocaleLowerCase("ko-KR")) return false
  return true
}

function matchingLanguageBaseRule(
  record: LanguageScoreRecord,
  rules: ReadonlyArray<DirectScoreRule>,
  result = record.result,
): DirectScoreRule | undefined {
  const candidate = { ...record, result }
  return rules
    .filter((rule) =>
      rule.enabled &&
      rule.kind === "language" &&
      rule.ruleType === "base" &&
      matchesLanguageRuleScope(candidate, rule) &&
      matchesDirectScoreRule(candidate, rule)
    )
    .toSorted((left, right) => right.score - left.score || left.order - right.order)[0]
}

function languageBonus(
  rules: ReadonlyArray<DirectScoreRule>,
  condition: NonNullable<DirectScoreRule["bonusCondition"]>,
): number {
  return rules
    .filter((rule) =>
      rule.enabled && rule.kind === "language" && rule.ruleType === "bonus" && rule.bonusCondition === condition
    )
    .reduce((highest, rule) => Math.max(highest, rule.bonus), 0)
}

export function calculateLanguageScore(
  records: ReadonlyArray<LanguageScoreRecord>,
  rules: ReadonlyArray<DirectScoreRule>,
  cycleStartsAt?: string,
): LanguageScoreBreakdown {
  if (records.some((record) => record.noScore === true)) {
    return {
      score: 0,
      baseScore: 0,
      gradeUpgradeBonus: 0,
      secondLanguageNewBonus: 0,
      entries: records.map((record) => ({
        recordId: record.id,
        baseScore: record.noScore === true ? 0 : null,
        selectedAsBest: false,
        gradeUpgradeApplied: false,
        secondLanguageNewBonusApplied: false,
      })),
    }
  }
  const matched = records.map((record) => ({
    record,
    rule: matchingLanguageBaseRule(record, rules),
  }))
  const ranked = matched
    .filter((entry): entry is { record: LanguageScoreRecord; rule: DirectScoreRule } => entry.rule !== undefined)
    .toSorted((left, right) => right.rule.score - left.rule.score || left.rule.order - right.rule.order)
  const best = ranked[0]
  const upgradedRecordIds = new Set(ranked.flatMap(({ record, rule }) => {
    if (record.previousResult == null || record.previousResult.trim() === "") return []
    const previousRule = matchingLanguageBaseRule(record, rules, record.previousResult)
    return previousRule !== undefined && rule.score > previousRule.score ? [record.id] : []
  }))
  const evaluationYear = cycleStartsAt?.slice(0, 4)
  const newSecondLanguageRecordIds = new Set(ranked.flatMap(({ record }) => {
    const acquiredInSeasonYear = evaluationYear === undefined || record.acquiredOn?.startsWith(evaluationYear) === true
    return languageGroup(record) === "second_language" && record.newlyAcquired === true && acquiredInSeasonYear
      ? [record.id]
      : []
  }))
  const gradeUpgradeBonus = upgradedRecordIds.size > 0 ? languageBonus(rules, "grade_upgrade") : 0
  const secondLanguageNewBonus = newSecondLanguageRecordIds.size > 0
    ? languageBonus(rules, "second_language_new")
    : 0
  const baseScore = best?.rule.score ?? 0
  return {
    score: best === undefined ? null : Math.min(100, baseScore + gradeUpgradeBonus + secondLanguageNewBonus),
    baseScore,
    gradeUpgradeBonus,
    secondLanguageNewBonus,
    entries: matched.map(({ record, rule }) => ({
      recordId: record.id,
      baseScore: rule?.score ?? null,
      selectedAsBest: best?.record.id === record.id,
      gradeUpgradeApplied: upgradedRecordIds.has(record.id) && gradeUpgradeBonus > 0,
      secondLanguageNewBonusApplied: newSecondLanguageRecordIds.has(record.id) && secondLanguageNewBonus > 0,
    })),
  }
}

export function calculateCertificationScore(
  records: ReadonlyArray<CertificationRecord>,
  rules: ReadonlyArray<DirectScoreRule>,
  cycleStartsAt?: string,
): CertificationScoreBreakdown {
  if (records.some((record) => record.noScore === true)) {
    return {
      score: 0,
      baseScore: 0,
      bonusScore: 0,
      partialScore: 0,
      entries: records.flatMap((record) => record.noScore === true ? [{
        recordId: record.id,
        certificateName: record.certificateName,
        baseScore: 0,
        newAcquisitionBonus: 0,
        includedInTopThree: false,
        bonusApplied: false,
        partialScoreApplied: false,
      }] : []),
    }
  }
  const matched = records.flatMap((record) => {
    const rule = rules
      .filter((candidate) =>
        candidate.enabled &&
        candidate.kind === "certification" &&
        candidate.ruleType === "base" &&
        matchesDirectScoreRule(record, candidate)
      )
      .toSorted((left, right) => right.score - left.score || left.order - right.order)[0]
    return rule === undefined ? [] : [{ record, rule }]
  })
  const partial = matched.filter(({ rule }) => rule.value === "필기 합격")
  const ranked = matched
    .filter(({ rule }) => rule.value !== "필기 합격")
    .toSorted((left, right) => right.rule.score - left.rule.score || left.rule.order - right.rule.order)
  const topThree = ranked.slice(0, 3)
  const topThreeRecordIds = new Set(topThree.map(({ record }) => record.id))
  const evaluationYear = cycleStartsAt?.slice(0, 4)
  const acquiredThisYear = evaluationYear === undefined
    ? []
    : ranked.filter(({ record }) => record.acquiredOn?.startsWith(evaluationYear) === true)
  const bonusCandidate = acquiredThisYear
    .toSorted((left, right) => right.rule.bonus - left.rule.bonus || left.rule.order - right.rule.order)[0]
  const partialCandidate = evaluationYear === undefined
    ? undefined
    : partial
        .filter(({ record }) => record.acquiredOn?.startsWith(evaluationYear) === true)
        .toSorted((left, right) => right.rule.score - left.rule.score || left.rule.order - right.rule.order)[0]
  const baseScore = topThree.reduce((total, entry) => total + entry.rule.score, 0)
  const bonusScore = bonusCandidate?.rule.bonus ?? 0
  const partialScore = partialCandidate?.rule.score ?? 0
  const entries = matched.map(({ record, rule }) => ({
    recordId: record.id,
    certificateName: record.certificateName,
    baseScore: rule.score,
    newAcquisitionBonus: rule.bonus,
    includedInTopThree: topThreeRecordIds.has(record.id),
    bonusApplied: bonusCandidate?.record.id === record.id && bonusScore > 0,
    partialScoreApplied: partialCandidate?.record.id === record.id && partialScore > 0,
  }))
  return {
    score: matched.length === 0 ? null : Math.min(100, baseScore + bonusScore + partialScore),
    baseScore,
    bonusScore,
    partialScore,
    entries,
  }
}

function assertNever(value: never): never {
  throw new RangeError(`unsupported direct score rule value: ${String(value)}`)
}
