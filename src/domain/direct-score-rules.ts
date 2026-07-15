import type {
  CertificationRecord,
  DirectScoreRule,
  LanguageScoreRecord,
} from "./types"

export type DirectScoreSourceRecord = LanguageScoreRecord | CertificationRecord

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
    .filter((rule) => matchesDirectScoreRule(record, rule))
  const base = applicable
    .filter((rule) => rule.ruleType === "base")
    .toSorted((left, right) => left.order - right.order)[0]
  if (base === undefined) return null
  const bonus = applicable
    .filter((rule) => rule.ruleType === "bonus")
    .reduce((total, rule) => total + rule.bonus, 0)
  return Math.min(100, base.score + bonus)
}

export function highestConvertedDirectScore(
  records: ReadonlyArray<DirectScoreSourceRecord>,
  rules: ReadonlyArray<DirectScoreRule>,
): number | null {
  const values = records
    .map((record) => convertDirectScoreRecord(record, rules))
    .filter((value): value is number => value !== null)
  return values.length === 0 ? null : Math.max(...values)
}

function assertNever(value: never): never {
  throw new RangeError(`unsupported direct score rule value: ${String(value)}`)
}
