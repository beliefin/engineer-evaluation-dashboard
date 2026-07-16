import { describe, expect, it } from "vitest"

import { calculateLanguageScore, convertDirectScoreRecord, highestConvertedDirectScore } from "./direct-score-rules"
import type {
  CertificationRecord,
  DirectScoreRule,
  LanguageScoreRecord,
} from "./types"

const record: LanguageScoreRecord = {
  id: "language-1",
  cycleId: "cycle-1",
  engineerId: "engineer-1",
  examName: "TOEIC",
  result: "850",
  acquiredOn: null,
  note: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const rule = (input: Partial<DirectScoreRule>): DirectScoreRule => ({
  id: "rule-1",
  cycleId: "cycle-1",
  taskId: "task-language",
  kind: "language",
  label: "TOEIC 800",
  field: "result",
  operator: "gte",
  value: "800",
  ruleType: "base",
  score: 80,
  bonus: 0,
  enabled: true,
  order: 1,
  ...input,
})

describe("direct score rules", () => {
  it("converts a numeric threshold and adds matching bonuses", () => {
    expect(convertDirectScoreRecord(record, [
      rule({}),
      rule({ id: "rule-2", label: "TOEIC bonus", ruleType: "bonus", operator: "equals", field: "examName", value: "TOEIC", bonus: 5 }),
    ])).toBe(85)
  })

  it("returns the highest converted record and ignores disabled rules", () => {
    expect(highestConvertedDirectScore([record], [rule({ enabled: false })])).toBeNull()
  })

  it("uses the highest matching language band when multiple thresholds match", () => {
    // Given
    const rules = [
      rule({ id: "rule-600", value: "600", score: 60, order: 1 }),
      rule({ id: "rule-800", value: "800", score: 80, order: 2 }),
    ]

    // When
    const score = highestConvertedDirectScore([record], rules)

    // Then
    expect(score).toBe(80)
  })

  it("uses the higher score across English and a second language and adds one grade-up bonus", () => {
    const english = languageRecord("english-current", "english", "OPIc", "IM2", { previousResult: "IM1" })
    const second = languageRecord("second-current", "second_language", "OPIc", "IM2", { previousResult: "IM1", languageName: "중국어" })

    const breakdown = calculateLanguageScore([english, second], languageRules(), "2026-01-01")

    expect(breakdown).toMatchObject({ score: 80, baseScore: 70, gradeUpgradeBonus: 10, secondLanguageNewBonus: 0 })
  })

  it("adds the second-language new-acquisition bonus even when English is the higher base score", () => {
    const english = languageRecord("english-ih", "english", "OPIc", "IH")
    const second = languageRecord("second-im1", "second_language", "OPIc", "IM1", {
      languageName: "일본어",
      newlyAcquired: true,
      acquiredOn: "2026-04-01",
    })

    const breakdown = calculateLanguageScore([english, second], languageRules(), "2026-01-01")

    expect(breakdown).toMatchObject({ score: 100, baseScore: 90, gradeUpgradeBonus: 0, secondLanguageNewBonus: 10 })
  })

  it("does not award an English grade-up bonus when there was no prior-year result", () => {
    const english = languageRecord("english-new", "english", "OPIc", "IH", { newlyAcquired: true })

    expect(calculateLanguageScore([english], languageRules(), "2026-01-01")).toMatchObject({
      score: 90,
      baseScore: 90,
      gradeUpgradeBonus: 0,
      secondLanguageNewBonus: 0,
    })
  })

  it("caps a second-language AL score at the platform task maximum", () => {
    const second = languageRecord("second-al", "second_language", "OPIc", "AL", { languageName: "중국어" })

    expect(calculateLanguageScore([second], languageRules(), "2026-01-01")).toMatchObject({ score: 100, baseScore: 100 })
  })

  it("sums the three highest certification base scores", () => {
    // Given
    const records: ReadonlyArray<CertificationRecord> = [
      certificationRecord("산업안전지도사"),
      certificationRecord("ADP(데이터분석전문가)"),
      certificationRecord("화공기사"),
      certificationRecord("위험물산업기사"),
    ]
    const rules = [
      certificationRule("산업안전지도사", 28, 15, 1),
      certificationRule("ADP(데이터분석전문가)", 22, 15, 2),
      certificationRule("화공기사", 23, 15, 3),
      certificationRule("위험물산업기사", 17, 9, 4),
    ]

    // When
    const score = highestConvertedDirectScore(records, rules)

    // Then
    expect(score).toBe(73)
  })

  it("adds only the highest current-year acquisition bonus even when that certificate is outside the top three", () => {
    // Given
    const records: ReadonlyArray<CertificationRecord> = [
      certificationRecord("산업안전지도사"),
      certificationRecord("ADP(데이터분석전문가)"),
      certificationRecord("화공기사"),
      { ...certificationRecord("위험물산업기사"), acquiredOn: "2026-04-30" },
    ]
    const rules = [
      certificationRule("산업안전지도사", 28, 15, 1),
      certificationRule("ADP(데이터분석전문가)", 22, 15, 2),
      certificationRule("화공기사", 23, 15, 3),
      certificationRule("위험물산업기사", 17, 9, 4),
    ]

    // When
    const score = highestConvertedDirectScore(records, rules, "2026-01-01")

    // Then
    expect(score).toBe(82)
  })

  it("adds one current-year written-exam partial score outside the top three", () => {
    // Given
    const records: ReadonlyArray<CertificationRecord> = [
      certificationRecord("산업안전기사"),
      certificationRecord("에너지관리기사"),
      certificationRecord("컴퓨터활용능력 1급"),
      { ...certificationRecord("필기 합격"), acquiredOn: "2026-06-15" },
    ]
    const rules = [
      certificationRule("산업안전기사", 22, 15, 1),
      certificationRule("에너지관리기사", 21, 12, 2),
      certificationRule("컴퓨터활용능력 1급", 8, 6, 3),
      certificationRule("필기 합격", 2, 0, 4),
    ]

    // When
    const score = highestConvertedDirectScore(records, rules, "2026-01-01")

    // Then
    expect(score).toBe(53)
  })
})

function certificationRecord(certificateName: string): CertificationRecord {
  return {
    id: `record-${certificateName}`,
    cycleId: "cycle-1",
    engineerId: "engineer-1",
    certificateName,
    grade: null,
    acquiredOn: null,
    issuer: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

function languageRecord(
  id: string,
  languageGroup: "english" | "second_language",
  examName: string,
  result: string,
  overrides: Partial<LanguageScoreRecord> = {},
): LanguageScoreRecord {
  return {
    id,
    cycleId: "cycle-1",
    engineerId: "engineer-1",
    languageGroup,
    languageName: null,
    examName,
    result,
    previousResult: null,
    newlyAcquired: false,
    acquiredOn: null,
    note: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function languageRules(): DirectScoreRule[] {
  const entries = [
    ["english", "OPIc", "AL", 100],
    ["english", "OPIc", "IH", 90],
    ["english", "OPIc", "IM3", 70],
    ["english", "OPIc", "IM2", 60],
    ["english", "OPIc", "IM1", 50],
    ["second_language", "OPIc", "AL", 110],
    ["second_language", "OPIc", "IH", 100],
    ["second_language", "OPIc", "IM3", 80],
    ["second_language", "OPIc", "IM2", 70],
    ["second_language", "OPIc", "IM1", 60],
  ] as const
  return [
    ...entries.map(([languageGroup, examName, value, score], index) => rule({
      id: `language-base-${index}`,
      label: `${languageGroup}-${value}`,
      value,
      operator: "equals",
      score: Math.min(100, score),
      rawScore: score > 100 ? score : null,
      order: index + 1,
      languageGroup,
      examName,
    })),
    rule({ id: "upgrade", label: "상향", value: "*", ruleType: "bonus", score: 0, bonus: 10, bonusCondition: "grade_upgrade", order: 20 }),
    rule({ id: "second-new", label: "신규", value: "*", ruleType: "bonus", score: 0, bonus: 10, bonusCondition: "second_language_new", order: 21 }),
  ]
}

function certificationRule(
  certificateName: string,
  score: number,
  bonus: number,
  order: number,
): DirectScoreRule {
  return rule({
    id: `rule-${order}`,
    taskId: "task-certification",
    kind: "certification",
    label: certificateName,
    field: "certificateName",
    operator: "equals",
    value: certificateName,
    score,
    bonus,
    order,
  })
}
