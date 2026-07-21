import {
  calculateCertificationScore,
  calculateLanguageScore,
  convertDirectScoreRecord,
  type EvaluationSnapshot,
} from "@/domain"
import type { EngineerPortalViewModel } from "@/features/engineer-portal/types"

import { selectEngineerDetail } from "./engineers"
import { selectSourceRecordReview } from "./source-record-review"

export function selectEngineerPortal(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  engineerId: string,
): EngineerPortalViewModel | null {
  const detail = selectEngineerDetail(snapshot, cycleId, engineerId, "engineer")
  if (detail === null) return null
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return null
  const rules = snapshot.directScoreRules.filter((rule) => rule.cycleId === cycleId)
  const languageRules = rules.filter((rule) => rule.kind === "language")
  const certificationRules = rules.filter((rule) => rule.kind === "certification")
  const languageRecords = snapshot.languageScoreRecords.filter(
    (record) => record.cycleId === cycleId && record.engineerId === engineerId,
  )
  const certificationRecords = snapshot.certificationRecords.filter(
    (record) => record.cycleId === cycleId && record.engineerId === engineerId,
  )
  const certificationScore = calculateCertificationScore(
    certificationRecords,
    certificationRules,
    cycle.startsAt,
  )
  const certificationEntries = new Map(
    certificationScore.entries.map((entry) => [entry.recordId, entry]),
  )
  const languageScore = calculateLanguageScore(languageRecords, languageRules, cycle.startsAt)
  const languageEntries = new Map(languageScore.entries.map((entry) => [entry.recordId, entry]))

  return {
    detail,
    ...(languageRecords.find((record) => record.noScore === true)?.id == null ? {} : {
      languageNoScoreRecordId: languageRecords.find((record) => record.noScore === true)!.id,
    }),
    languageRecords: languageRecords.filter((record) => record.noScore !== true).map((record) => ({
        ...languageEntries.get(record.id),
        id: record.id,
        examName: record.examName,
        languageName: record.languageName ?? null,
        languageGroup: record.languageGroup ?? "english",
        result: record.result,
        previousResult: record.previousResult ?? null,
        newlyAcquired: record.newlyAcquired ?? false,
        acquiredOn: record.acquiredOn,
        note: record.note,
        convertedScore: languageEntries.get(record.id)?.baseScore ?? convertDirectScoreRecord(record, languageRules),
        ...selectSourceRecordReview(snapshot, record.id, record.updatedAt),
      })),
    ...(certificationRecords.find((record) => record.noScore === true)?.id == null ? {} : {
      certificationNoScoreRecordId: certificationRecords.find((record) => record.noScore === true)!.id,
    }),
    certificationRecords: certificationRecords.filter((record) => record.noScore !== true).map((record) => {
      const scoreEntry = certificationEntries.get(record.id)
      return {
        id: record.id,
        certificateName: record.certificateName,
        grade: record.grade,
        acquiredOn: record.acquiredOn,
        issuer: record.issuer,
        baseScore: scoreEntry?.baseScore ?? null,
        newAcquisitionBonus: scoreEntry?.newAcquisitionBonus ?? 0,
        includedInTopThree: scoreEntry?.includedInTopThree ?? false,
        bonusApplied: scoreEntry?.bonusApplied ?? false,
        partialScoreApplied: scoreEntry?.partialScoreApplied ?? false,
        ...selectSourceRecordReview(snapshot, record.id, record.updatedAt),
      }
    }),
    certificationOptions: certificationRules
      .filter((rule) =>
        rule.field === "certificateName" &&
        rule.operator === "equals" &&
        rule.ruleType === "base"
      )
      .toSorted((left, right) => left.order - right.order)
      .map((rule) => ({
        name: rule.value,
        category: rule.category ?? null,
        difficulty: rule.difficulty ?? null,
        workRelevance: rule.workRelevance ?? null,
        baseScore: rule.score,
        newAcquisitionBonus: rule.bonus,
        enabled: rule.enabled,
      })),
    certificationScore: {
      score: certificationScore.score,
      baseScore: certificationScore.baseScore,
      bonusScore: certificationScore.bonusScore,
      partialScore: certificationScore.partialScore,
    },
    languageOptions: [...languageRules
      .filter((rule) => rule.enabled && rule.ruleType === "base" && rule.languageGroup != null && rule.examName != null)
      .reduce((options, rule) => {
        const key = `${rule.languageGroup}:${rule.examName}`
        const current = options.get(key) ?? {
          languageGroup: rule.languageGroup!,
          examName: rule.examName!,
          numericResult: false,
          resultOptions: [] as string[],
        }
        current.numericResult ||= rule.operator === "gte"
        if (rule.operator === "equals" && !current.resultOptions.includes(rule.value)) current.resultOptions.push(rule.value)
        options.set(key, current)
        return options
      }, new Map<string, { languageGroup: "english" | "second_language"; examName: string; numericResult: boolean; resultOptions: string[] }>())
      .values()],
    languageScore: {
      score: languageScore.score,
      baseScore: languageScore.baseScore,
      gradeUpgradeBonus: languageScore.gradeUpgradeBonus,
      secondLanguageNewBonus: languageScore.secondLanguageNewBonus,
    },
    cycleStartsAt: cycle.startsAt,
  }
}
