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
  evaluatorId: string
  evaluatorLabel: string
  averageScore: number
  meanAbsoluteDeviation: number
  sheetCount: number
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
