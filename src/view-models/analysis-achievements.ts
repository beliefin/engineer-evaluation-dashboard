import type { EvaluationSnapshot } from "@/domain"
import type {
  AchievementSourceAnalysisDatum,
  AnalysisFilterState,
} from "@/features/analysis"

import { selectFilteredSummaries } from "./analysis-common"

type HolderBucket = {
  engineerIds: Set<string>
  acquiredThisYearEngineerIds: Set<string>
}

type LanguageResultBucket = HolderBucket & Readonly<{
  key: string
  scopeLabel: string
  examName: string
  result: string
}>

const roundToOne = (value: number): number => Math.round(value * 10) / 10

function languageScope(record: EvaluationSnapshot["languageScoreRecords"][number]): Readonly<{
  group: "english" | "second_language"
  label: string
}> {
  const group = record.languageGroup ?? (record.examName.includes("제2") ? "second_language" : "english")
  return {
    group,
    label: group === "second_language" ? (record.languageName?.trim() || "제2외국어") : "영어",
  }
}

function shareOfRecorded(holderCount: number, recordedEngineerCount: number): number {
  return recordedEngineerCount === 0
    ? 0
    : roundToOne((holderCount / recordedEngineerCount) * 100)
}

export function selectAchievementSourceAnalysis(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  filters: AnalysisFilterState,
): AchievementSourceAnalysisDatum {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) {
    throw new RangeError(`evaluation cycle not found: ${cycleId}`)
  }
  const filteredSummaries = selectFilteredSummaries(snapshot, cycleId, filters)
  const eligibleEngineerIds = new Set(filteredSummaries.map((summary) => summary.engineer.id))
  const evaluationYear = cycle.startsAt.slice(0, 4)

  const certificationHolders = new Map<string, HolderBucket>()
  const certificationRecordedEngineerIds = new Set<string>()
  const certificationNoScoreEngineerIds = new Set<string>()
  const certificationAcquiredThisYearEngineerIds = new Set<string>()
  for (const record of snapshot.certificationRecords) {
    if (record.cycleId !== cycleId || !eligibleEngineerIds.has(record.engineerId)) continue
    if (record.noScore === true) {
      certificationNoScoreEngineerIds.add(record.engineerId)
      continue
    }
    certificationRecordedEngineerIds.add(record.engineerId)
    const bucket = certificationHolders.get(record.certificateName) ?? {
      engineerIds: new Set<string>(),
      acquiredThisYearEngineerIds: new Set<string>(),
    }
    bucket.engineerIds.add(record.engineerId)
    if (record.acquiredOn?.startsWith(evaluationYear) === true) {
      bucket.acquiredThisYearEngineerIds.add(record.engineerId)
      certificationAcquiredThisYearEngineerIds.add(record.engineerId)
    }
    certificationHolders.set(record.certificateName, bucket)
  }

  const languageResults = new Map<string, LanguageResultBucket>()
  const languageExamKeys = new Set<string>()
  const languageRecordedEngineerIds = new Set<string>()
  const languageNoScoreEngineerIds = new Set<string>()
  const languageAcquiredThisYearEngineerIds = new Set<string>()
  for (const record of snapshot.languageScoreRecords) {
    if (record.cycleId !== cycleId || !eligibleEngineerIds.has(record.engineerId)) continue
    if (record.noScore === true) {
      languageNoScoreEngineerIds.add(record.engineerId)
      continue
    }
    languageRecordedEngineerIds.add(record.engineerId)
    const scope = languageScope(record)
    const resultKey = `${scope.group}:${scope.label}:${record.examName}:${record.result}`
    const resultBucket = languageResults.get(resultKey) ?? {
      key: resultKey,
      scopeLabel: scope.label,
      examName: record.examName,
      result: record.result,
      engineerIds: new Set<string>(),
      acquiredThisYearEngineerIds: new Set<string>(),
    }
    resultBucket.engineerIds.add(record.engineerId)
    if (record.acquiredOn?.startsWith(evaluationYear) === true) {
      resultBucket.acquiredThisYearEngineerIds.add(record.engineerId)
      languageAcquiredThisYearEngineerIds.add(record.engineerId)
    }
    languageResults.set(resultKey, resultBucket)

    const examKey = `${scope.group}:${scope.label}:${record.examName}`
    languageExamKeys.add(examKey)
  }

  const certificationRespondedEngineerIds = new Set([
    ...certificationRecordedEngineerIds,
    ...certificationNoScoreEngineerIds,
  ])
  const languageRespondedEngineerIds = new Set([
    ...languageRecordedEngineerIds,
    ...languageNoScoreEngineerIds,
  ])

  return {
    evaluationYear,
    eligibleEngineerCount: eligibleEngineerIds.size,
    certificationRecordedEngineerCount: certificationRecordedEngineerIds.size,
    certificationNoScoreEngineerCount: certificationNoScoreEngineerIds.size,
    certificationUnreportedEngineerCount:
      eligibleEngineerIds.size - certificationRespondedEngineerIds.size,
    certificationTypeCount: certificationHolders.size,
    certificationAcquiredThisYearEngineerCount:
      certificationAcquiredThisYearEngineerIds.size,
    certificationHoldings: Array.from(certificationHolders, ([certificateName, bucket]) => ({
      certificateName,
      holderCount: bucket.engineerIds.size,
      acquiredThisYearCount: bucket.acquiredThisYearEngineerIds.size,
      shareOfRecordedEngineers: shareOfRecorded(
        bucket.engineerIds.size,
        certificationRecordedEngineerIds.size,
      ),
    })).toSorted((left, right) =>
      right.holderCount - left.holderCount ||
      right.acquiredThisYearCount - left.acquiredThisYearCount ||
      left.certificateName.localeCompare(right.certificateName, "ko")
    ),
    languageRecordedEngineerCount: languageRecordedEngineerIds.size,
    languageNoScoreEngineerCount: languageNoScoreEngineerIds.size,
    languageUnreportedEngineerCount: eligibleEngineerIds.size - languageRespondedEngineerIds.size,
    languageExamCount: languageExamKeys.size,
    languageAcquiredThisYearEngineerCount: languageAcquiredThisYearEngineerIds.size,
    languageResults: Array.from(languageResults.values(), (bucket) => ({
      key: bucket.key,
      scopeLabel: bucket.scopeLabel,
      examName: bucket.examName,
      result: bucket.result,
      holderCount: bucket.engineerIds.size,
      shareOfRecordedEngineers: shareOfRecorded(
        bucket.engineerIds.size,
        languageRecordedEngineerIds.size,
      ),
    })).toSorted((left, right) =>
      right.holderCount - left.holderCount || left.key.localeCompare(right.key, "ko")
    ),
  }
}
