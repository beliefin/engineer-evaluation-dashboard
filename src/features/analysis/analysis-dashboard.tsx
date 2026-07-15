"use client"

import { cn } from "@/lib/utils"

import { AnalysisFilters } from "./analysis-filters"
import { AnalysisInsightStrip } from "./analysis-insight-strip"
import { CategoryAverageChart } from "./category-average-chart"
import { EvaluatorDeviationChart } from "./evaluator-deviation-chart"
import { RubricItemChart } from "./rubric-item-chart"
import { ScoreDistributionChart } from "./score-distribution-chart"
import { TaskCompletionChart } from "./task-completion-chart"
import { TeamComparisonChart } from "./team-comparison-chart"
import { TeamTaskPerformanceMatrix } from "./team-task-performance-matrix"
import type {
  AnalysisFiltersProps,
  AnalysisHighlightDatum,
  CategoryAverageDatum,
  EvaluatorDeviationDatum,
  RubricItemAverageDatum,
  ScoreDistributionDatum,
  TaskCompletionDatum,
  TeamComparisonDatum,
  TeamTaskPerformanceDatum,
} from "./types"

export type AnalysisDashboardProps = Readonly<{
  filters: AnalysisFiltersProps
  highlights: readonly AnalysisHighlightDatum[]
  scoreDistributions: readonly ScoreDistributionDatum[]
  taskCompletionRates: readonly TaskCompletionDatum[]
  teamTaskPerformance: readonly TeamTaskPerformanceDatum[]
  categoryAverages: readonly CategoryAverageDatum[]
  rubricItemAverages: readonly RubricItemAverageDatum[]
  teamComparison: readonly TeamComparisonDatum[]
  evaluatorDeviations: readonly EvaluatorDeviationDatum[]
  teamComparisonCategoryLabel: string
  evaluatorDeviationDomainMax?: number
  isLoading?: boolean
  className?: string
}>

export function AnalysisDashboard({
  filters,
  highlights,
  scoreDistributions,
  taskCompletionRates,
  teamTaskPerformance,
  categoryAverages,
  rubricItemAverages,
  teamComparison,
  evaluatorDeviations,
  teamComparisonCategoryLabel,
  evaluatorDeviationDomainMax,
  isLoading = false,
  className,
}: AnalysisDashboardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <AnalysisFilters {...filters} />
      <AnalysisInsightStrip data={highlights} />

      <section aria-labelledby="decision-analysis-heading" className="space-y-4">
        <div>
          <h2 id="decision-analysis-heading" className="text-xl font-semibold tracking-tight">
            의사결정 진단
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            점수의 분포, 진행 병목, 팀별 상대 성과를 함께 비교합니다.
          </p>
        </div>
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          <ScoreDistributionChart data={scoreDistributions} isLoading={isLoading} />
          <TaskCompletionChart data={taskCompletionRates} isLoading={isLoading} />
        </div>
        <TeamTaskPerformanceMatrix data={teamTaskPerformance} isLoading={isLoading} />
      </section>

      <section aria-labelledby="detail-analysis-heading" className="space-y-4">
        <div>
          <h2 id="detail-analysis-heading" className="text-xl font-semibold tracking-tight">
            상세 분석
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            분야, 팀, 문항, 평가자 단위의 평균과 편차를 확인합니다.
          </p>
        </div>
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          <CategoryAverageChart data={categoryAverages} isLoading={isLoading} />
          <TeamComparisonChart
            data={teamComparison}
            categoryLabel={teamComparisonCategoryLabel}
            isLoading={isLoading}
          />
          <RubricItemChart data={rubricItemAverages} isLoading={isLoading} />
          <EvaluatorDeviationChart
            data={evaluatorDeviations}
            isLoading={isLoading}
            {...(evaluatorDeviationDomainMax === undefined
              ? {}
              : { domainMax: evaluatorDeviationDomainMax })}
          />
        </div>
      </section>
    </div>
  )
}
