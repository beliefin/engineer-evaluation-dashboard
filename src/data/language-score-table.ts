import type { LanguageBonusCondition, LanguageGroup } from "@/domain"

export type LanguageScoreTableEntry = Readonly<{
  languageGroup: LanguageGroup
  examName: string
  result: string
  operator: "equals" | "gte"
  score: number
}>

export const LANGUAGE_SCORE_TABLE: ReadonlyArray<LanguageScoreTableEntry> = [
  { languageGroup: "english", examName: "OPIc", result: "AL", operator: "equals", score: 100 },
  { languageGroup: "english", examName: "OPIc", result: "IH", operator: "equals", score: 90 },
  { languageGroup: "english", examName: "OPIc", result: "IM3", operator: "equals", score: 70 },
  { languageGroup: "english", examName: "OPIc", result: "IM2", operator: "equals", score: 60 },
  { languageGroup: "english", examName: "OPIc", result: "IM1", operator: "equals", score: 50 },
  { languageGroup: "english", examName: "TOEIC Speaking", result: "170", operator: "gte", score: 100 },
  { languageGroup: "english", examName: "TOEIC Speaking", result: "160", operator: "gte", score: 90 },
  { languageGroup: "english", examName: "TOEIC Speaking", result: "140", operator: "gte", score: 70 },
  { languageGroup: "english", examName: "TOEIC Speaking", result: "120", operator: "gte", score: 60 },
  { languageGroup: "english", examName: "TOEIC Speaking", result: "110", operator: "gte", score: 50 },
  { languageGroup: "second_language", examName: "OPIc", result: "AL", operator: "equals", score: 110 },
  { languageGroup: "second_language", examName: "OPIc", result: "IH", operator: "equals", score: 100 },
  { languageGroup: "second_language", examName: "OPIc", result: "IM3", operator: "equals", score: 80 },
  { languageGroup: "second_language", examName: "OPIc", result: "IM2", operator: "equals", score: 70 },
  { languageGroup: "second_language", examName: "OPIc", result: "IM1", operator: "equals", score: 60 },
]

export const LANGUAGE_BONUS_TABLE: ReadonlyArray<Readonly<{
  condition: LanguageBonusCondition
  label: string
  bonus: number
}>> = [
  { condition: "grade_upgrade", label: "전년 동일 언어 등급 상향", bonus: 10 },
  { condition: "second_language_new", label: "제2외국어 IM1 이상 신규 취득", bonus: 10 },
]
