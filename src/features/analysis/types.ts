export type AnalysisFilterOption = Readonly<{
  value: string
  label: string
}>

export type AnalysisFilterState = Readonly<{
  team: string
  category: string
  status: string
}>

export type AnalysisFilterKey = keyof AnalysisFilterState

export type AnalysisFiltersProps = Readonly<{
  value: AnalysisFilterState
  teamOptions: readonly AnalysisFilterOption[]
  categoryOptions: readonly AnalysisFilterOption[]
  statusOptions: readonly AnalysisFilterOption[]
  onChange: (key: AnalysisFilterKey, value: string) => void
  onReset: () => void
  resetDisabled?: boolean
  className?: string
}>

export type CategoryAverageDatum = Readonly<{
  key: string
  label: string
  score: number
  completedCount: number
}>

export type RubricItemAverageDatum = Readonly<{
  taskId: string
  taskLabel: string
  itemNumber: number
  label: string
  score: number
  responseCount: number
}>

export type TeamComparisonDatum = Readonly<{
  teamId: string
  teamLabel: string
  score: number
  completedCount: number
}>

export type EvaluatorDeviationDatum = Readonly<{
  taskId: string
  taskLabel: string
  evaluatorId: string
  evaluatorLabel: string
  averageScore: number
  meanAbsoluteDeviation: number
  sheetCount: number
}>

export type EvaluatorScoreObservationDatum = Readonly<{
  evaluatorId: string
  evaluatorLabel: string
  score: number
  deltaFromConsensus: number
  isOutlier: boolean
}>

export type EvaluatorScoreComparisonDatum = Readonly<{
  taskId: string
  taskLabel: string
  engineerId: string
  engineerLabel: string
  teamLabel: string
  consensusScore: number
  minimumScore: number
  maximumScore: number
  scoreRange: number
  submittedCount: number
  outlierCount: number
  observations: readonly EvaluatorScoreObservationDatum[]
}>

export type EvaluatorCalibrationDatum = Readonly<{
  taskId: string
  taskLabel: string
  evaluatorId: string
  evaluatorLabel: string
  averageScore: number
  meanSignedDelta: number
  meanAbsoluteDelta: number
  comparisonCount: number
  outlierCount: number
}>

export type EvaluationReliabilityDatum = Readonly<{
  taskId: string
  taskLabel: string
  engineerId: string
  engineerLabel: string
  teamLabel: string
  consensusScore: number
  evaluatorCount: number
  scoreRange: number
  standardDeviation: number
  leaveOneOutOutlierCount: number
  isHighDisagreement: boolean
}>

export type EvaluatorResidualDatum = Readonly<{
  taskId: string
  taskLabel: string
  engineerId: string
  engineerLabel: string
  teamLabel: string
  evaluatorId: string
  evaluatorLabel: string
  score: number
  leaveOneOutAverage: number
  residual: number
  isOutlier: boolean
}>

export type EvaluatorExclusionSensitivityRowDatum = Readonly<{
  engineerId: string
  engineerLabel: string
  teamLabel: string
  baselineScore: number
  excludedScore: number
  scoreDelta: number
  baselineRank: number
  excludedRank: number
  rankDelta: number
  isHighImpact: boolean
}>

export type EvaluatorExclusionSensitivityDatum = Readonly<{
  taskId: string
  taskLabel: string
  evaluatorId: string
  evaluatorLabel: string
  cohortCount: number
  rows: readonly EvaluatorExclusionSensitivityRowDatum[]
}>

export type ScoreDistributionDatum = Readonly<{
  taskId: string
  taskLabel: string
  minimum: number
  firstQuartile: number
  median: number
  thirdQuartile: number
  maximum: number
  completedCount: number
}>

export type TaskCompletionDatum = Readonly<{
  taskId: string
  taskLabel: string
  completedCount: number
  eligibleCount: number
  completionRate: number
}>

export type TeamTaskPerformanceDatum = Readonly<{
  teamId: string
  teamLabel: string
  taskId: string
  taskLabel: string
  metric: "score" | "pass-rate"
  score: number
  overallScore: number
  delta: number
  completedCount: number
}>

export type AnalysisHighlightKind =
  | "score-spread"
  | "completion-bottleneck"
  | "team-gap"

export type AnalysisHighlightDatum = Readonly<{
  kind: AnalysisHighlightKind
  label: string
  value: string
  detail: string
}>

export type AnalysisChartProps<Data> = Readonly<{
  data: readonly Data[]
  isLoading?: boolean
}>
