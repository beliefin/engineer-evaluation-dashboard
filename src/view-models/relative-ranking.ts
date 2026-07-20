import type { EvaluationSnapshot } from "@/domain"

import { selectEngineerResultSummaries } from "./results"

export type RelativeGrade = "C" | "B" | "SA" | "unavailable"
export type RelativeScoreStatus = "confirmed" | "partial" | "none"
export type RelativeBoundary = "CB" | "BSA"

export type RelativeRankingCandidate = Readonly<{
  engineerId: string
  engineerName: string
  employeeCode: string
  team: string
  department: string
  position: string
  score: number | null
  scoreStatus: RelativeScoreStatus
  completedTaskCount: number
  taskCount: number
}>

export type RelativeRankingPoint = RelativeRankingCandidate & Readonly<{
  score: number
  ascendingPosition: number
  standardRank: number
  topPercentile: number
  grade: RelativeGrade
  gapToHigher: number | null
  gapToLower: number | null
  isBoundaryTie: boolean
  isBoundaryDense: boolean
}>

export type BoundaryTie = Readonly<{
  boundary: RelativeBoundary
  score: number
  count: number
}>

export type RelativeRankingAnalysis = Readonly<{
  points: readonly RelativeRankingPoint[]
  selectedCount: number
  gradeCounts: Readonly<{ c: number; b: number; sa: number }>
  bCutoff: number | null
  saCutoff: number | null
  cbGap: number | null
  bsaGap: number | null
  cbDensityCount: number
  bsaDensityCount: number
  boundaryWindow: number
  boundaryTies: readonly BoundaryTie[]
  warning: string | null
}>

const roundToOne = (value: number): number => Math.round(value * 10) / 10
const roundToTwo = (value: number): number => Math.round(value * 100) / 100
const clampScore = (value: number): number => Math.min(100, Math.max(0, value))

export function selectRelativeRankingCandidates(
  snapshot: EvaluationSnapshot,
  cycleId: string,
): readonly RelativeRankingCandidate[] {
  return selectEngineerResultSummaries(snapshot, cycleId).map(({ engineer, result }) => {
    const contributionValues = Object.values(result.contributions)
    const completedTaskCount = contributionValues.filter((value) => value !== null).length
    const earnedScore = contributionValues.reduce<number>(
      (total, value) => total + (value ?? 0),
      0,
    )
    const score = result.roundedFinalScore ?? (
      completedTaskCount === 0
        ? null
        : roundToTwo(clampScore(earnedScore + result.adjustmentTotal))
    )
    const scoreStatus: RelativeScoreStatus = result.roundedFinalScore !== null
      ? "confirmed"
      : score === null
        ? "none"
        : "partial"

    return {
      engineerId: engineer.id,
      engineerName: engineer.displayName,
      employeeCode: engineer.employeeCode,
      team: engineer.team,
      department: engineer.department,
      position: engineer.position,
      score,
      scoreStatus,
      completedTaskCount,
      taskCount: contributionValues.length,
    }
  })
}

function calculateGradeCounts(size: number): Readonly<{ c: number; b: number; sa: number }> {
  if (size <= 1) return { c: 0, b: 0, sa: 0 }
  const c = Math.round(size * 0.2)
  const sa = Math.round(size * 0.3)
  return { c, b: size - c - sa, sa }
}

function gradeAt(
  index: number,
  counts: Readonly<{ c: number; b: number; sa: number }>,
): RelativeGrade {
  if (counts.c + counts.b + counts.sa === 0) return "unavailable"
  if (index < counts.c) return "C"
  if (index < counts.c + counts.b) return "B"
  return "SA"
}

function boundaryTie(
  points: readonly RelativeRankingCandidate[],
  boundaryIndex: number,
  boundary: RelativeBoundary,
): BoundaryTie | null {
  const lower = points[boundaryIndex - 1]
  const upper = points[boundaryIndex]
  if (lower?.score === null || upper?.score === null || lower === undefined || upper === undefined) {
    return null
  }
  if (lower.score !== upper.score) return null
  return {
    boundary,
    score: lower.score,
    count: points.filter((point) => point.score === lower.score).length,
  }
}

export function calculateRelativeRanking(
  candidates: readonly RelativeRankingCandidate[],
  boundaryWindow = 1,
): RelativeRankingAnalysis {
  const sorted = candidates
    .filter((candidate): candidate is RelativeRankingCandidate & Readonly<{ score: number }> => (
      candidate.score !== null
    ))
    .toSorted((left, right) => (
      left.score === right.score
        ? left.engineerId.localeCompare(right.engineerId)
        : left.score - right.score
    ))
  const selectedCount = sorted.length
  const gradeCounts = calculateGradeCounts(selectedCount)
  const bBoundaryIndex = gradeCounts.c
  const saBoundaryIndex = gradeCounts.c + gradeCounts.b
  const bCutoff = gradeCounts.b > 0 ? sorted[bBoundaryIndex]?.score ?? null : null
  const saCutoff = gradeCounts.sa > 0 ? sorted[saBoundaryIndex]?.score ?? null : null
  const cMaximum = gradeCounts.c > 0 ? sorted[bBoundaryIndex - 1]?.score ?? null : null
  const bMaximum = gradeCounts.b > 0 ? sorted[saBoundaryIndex - 1]?.score ?? null : null
  const cbGap = bCutoff === null || cMaximum === null ? null : roundToTwo(bCutoff - cMaximum)
  const bsaGap = saCutoff === null || bMaximum === null ? null : roundToTwo(saCutoff - bMaximum)
  const boundaryTies = [
    boundaryTie(sorted, bBoundaryIndex, "CB"),
    boundaryTie(sorted, saBoundaryIndex, "BSA"),
  ].filter((tie): tie is BoundaryTie => tie !== null)
  const tieScores = new Set(boundaryTies.map((tie) => tie.score))
  const nearBoundary = (score: number): boolean => (
    (bCutoff !== null && Math.abs(score - bCutoff) <= boundaryWindow) ||
    (saCutoff !== null && Math.abs(score - saCutoff) <= boundaryWindow)
  )
  const rankByScore = new Map<number, number>()
  sorted.toReversed().forEach((candidate, index) => {
    if (!rankByScore.has(candidate.score)) rankByScore.set(candidate.score, index + 1)
  })
  const points = sorted.map((candidate, index): RelativeRankingPoint => {
    const higher = sorted[index + 1]
    const lower = sorted[index - 1]
    return {
      ...candidate,
      score: candidate.score,
      ascendingPosition: index + 1,
      standardRank: rankByScore.get(candidate.score) ?? index + 1,
      topPercentile: roundToOne(((rankByScore.get(candidate.score) ?? index + 1) / selectedCount) * 100),
      grade: gradeAt(index, gradeCounts),
      gapToHigher: higher === undefined ? null : roundToTwo(higher.score - candidate.score),
      gapToLower: lower === undefined ? null : roundToTwo(candidate.score - lower.score),
      isBoundaryTie: tieScores.has(candidate.score),
      isBoundaryDense: nearBoundary(candidate.score),
    }
  })

  const warning = selectedCount === 1
    ? "선택 인원이 1명이라 상대평가를 계산할 수 없습니다."
    : selectedCount > 1 && selectedCount < 5
      ? "선택 인원이 적어 상대 등급의 해석 안정성이 낮습니다."
      : null

  return {
    points,
    selectedCount,
    gradeCounts,
    bCutoff,
    saCutoff,
    cbGap,
    bsaGap,
    cbDensityCount: bCutoff === null
      ? 0
      : sorted.filter((candidate) => Math.abs(candidate.score - bCutoff) <= boundaryWindow).length,
    bsaDensityCount: saCutoff === null
      ? 0
      : sorted.filter((candidate) => Math.abs(candidate.score - saCutoff) <= boundaryWindow).length,
    boundaryWindow,
    boundaryTies,
    warning,
  }
}
