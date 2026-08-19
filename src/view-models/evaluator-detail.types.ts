import type { EvaluationSnapshot } from "@/domain"

export type EvaluatorConsistency = Readonly<{
  status: "stable" | "review" | "limited"
  label: string
  detail: string
}>

export type EvaluatorTaskTendency = Readonly<{
  taskId: string
  taskLabel: string
  evaluationCount: number
  averageScore: number
  peerAverage: number | null
  meanResidual: number | null
  meanAbsoluteResidual: number | null
  residualStandardDeviation: number | null
  outlierCount: number
}>

export type EvaluatorItemProfile = Readonly<{
  taskId: string
  taskLabel: string
  itemId: string
  itemNumber: number
  itemLabel: string
  evaluatorAverage: number
  peerAverage: number | null
  delta: number | null
  responseCount: number
}>

export type EvaluatorRecentEvaluation = Readonly<{
  assignmentId: string
  engineerId: string
  engineerLabel: string
  teamLabel: string
  taskId: string
  taskLabel: string
  score: number
  peerAverage: number | null
  residual: number | null
  isOutlier: boolean
  submittedAt: string
}>

export type EvaluatorDetailViewModel = Readonly<{
  evaluator: EvaluationSnapshot["evaluators"][number]
  cycleName: string
  summary: Readonly<{
    assignedCount: number
    submittedCount: number
    uniqueEngineerCount: number
    scoredCount: number
    averageScore: number | null
    medianScore: number | null
    minimumScore: number | null
    maximumScore: number | null
    comparisonCount: number
    meanSignedResidual: number | null
    meanAbsoluteResidual: number | null
    residualStandardDeviation: number | null
    outlierCount: number
    consistency: EvaluatorConsistency
  }>
  taskTendencies: readonly EvaluatorTaskTendency[]
  itemProfiles: readonly EvaluatorItemProfile[]
  recentEvaluations: readonly EvaluatorRecentEvaluation[]
  characteristics: readonly string[]
}>
