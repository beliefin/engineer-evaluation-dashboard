export type DashboardMetricTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"

export interface DashboardMetric {
  readonly id: string
  readonly label: string
  readonly value: number | string
  readonly unit: string
  readonly description: string
  readonly tone: DashboardMetricTone
}

export interface ScoreDistributionDatum {
  readonly range: "0~59" | "60~69" | "70~79" | "80~89" | "90~100"
  readonly count: number
}

export interface CategoryAverageDatum {
  readonly id: string
  readonly label: string
  readonly score: number
}

export type RankingStatus = "confirmed" | "tied"

export interface CompletedRankingRow {
  readonly id: string
  readonly href: string
  readonly rank: number
  readonly name: string
  readonly team: string
  readonly totalScore: number
  readonly status: RankingStatus
}

export type RankingStatusFilter = "all" | RankingStatus

export type RankingSortKey = keyof Pick<
  CompletedRankingRow,
  | "rank"
  | "name"
  | "team"
  | "totalScore"
>

export type RankingSortDirection = "asc" | "desc"

export interface RankingSortState {
  readonly key: RankingSortKey
  readonly direction: RankingSortDirection
}

export const DEFAULT_RANKING_SORT: RankingSortState = {
  key: "rank",
  direction: "asc",
}

function parseRankingSortKey(value: string | null): RankingSortKey | null {
  switch (value) {
    case "rank":
    case "name":
    case "team":
    case "totalScore":
      return value
    default:
      return null
  }
}

export function parseRankingSortState(
  key: string | null,
  direction: string | null
): RankingSortState {
  const parsedKey = parseRankingSortKey(key)
  if (parsedKey === null) return DEFAULT_RANKING_SORT

  return {
    key: parsedKey,
    direction: direction === "desc" ? "desc" : "asc",
  }
}

export interface RankingFilterState {
  readonly query: string
  readonly team: string
  readonly status: RankingStatusFilter
}

export interface DashboardHeaderProps {
  readonly contextLabel: string
  readonly title: string
  readonly description: string
  readonly cycleLabel: string
  readonly asOfLabel: string
  readonly sampleLabel: string
}

export interface MetricStripProps {
  readonly metrics: readonly DashboardMetric[]
  readonly loading?: boolean
}

export interface ScoreDistributionChartProps {
  readonly title: string
  readonly description: string
  readonly data: readonly ScoreDistributionDatum[]
}

export interface CategoryAverageChartProps {
  readonly title: string
  readonly description: string
  readonly data: readonly CategoryAverageDatum[]
}

export interface CompletedRankingProps {
  readonly title: string
  readonly description: string
  readonly rows: readonly CompletedRankingRow[]
  readonly filters?: RankingFilterState
  readonly onFiltersChange?: (next: RankingFilterState) => void
  readonly sorting?: RankingSortState
  readonly onSortingChange?: (next: RankingSortState) => void
}
