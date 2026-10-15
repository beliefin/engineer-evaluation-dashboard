"use client"

import Link from "next/link"
import "@/features/analysis/analysis-navigation-signal.css"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { ErrorState, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import {
  AnalysisDashboard,
  RelativeRankingSection,
  type AnalysisFilterKey,
  type AnalysisFilterState,
} from "@/features/analysis"
import { useAuth, useEvaluation } from "@/providers"
import { selectAnalysisViewModel } from "@/view-models/analysis"
import { selectRelativeRankingCandidates } from "@/view-models/relative-ranking"

export function AnalysisScreen() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { snapshot, activeCycleId, backendMode, role, canViewInsights } = useEvaluation()
  const { session } = useAuth()
  if (snapshot === null) return null

  const requestedFilters: AnalysisFilterState = {
    team: searchParams.get("team") ?? "all",
    category: searchParams.get("category") ?? "all",
    status: searchParams.get("status") ?? "all",
  }
  const model = selectAnalysisViewModel(snapshot, activeCycleId, requestedFilters)
  if (model === null) {
    return <ErrorState description="선택한 평가 시즌의 분석 데이터를 찾을 수 없습니다." />
  }
  const activeModel = model
  const activeCycle = snapshot.cycles.find((cycle) => cycle.id === activeCycleId)
  const relativeRankingCandidates = selectRelativeRankingCandidates(snapshot, activeCycleId)

  function updateUrl(next: AnalysisFilterState) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(next).forEach(([key, value]) => {
      if (value === "all") params.delete(key)
      else params.set(key, value)
    })
    const query = params.toString()
    router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function changeFilter(key: AnalysisFilterKey, value: string) {
    updateUrl({ ...activeModel.filters, [key]: value })
  }

  return (
    <div className="signal-analysis-page space-y-6">
      <PageHeader
        className="signal-analysis-page-heading"
        actions={role === "operator" || role === "approver" ||
          (role === "evaluator" && canViewInsights) ? (
          <Button asChild variant="outline">
            <Link href="/analysis/evaluators/detail">평가자 상세</Link>
          </Button>
        ) : undefined}
        description="상대 서열·점수 분포·자격·어학 원천 내역·평가 편차 비교"
        context={`평가 인사이트 · ${backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}`}
        title="평가 항목 분석"
      />
      <RelativeRankingSection
        accountId={session?.id ?? "anonymous"}
        cycleId={activeCycleId}
        key={`${session?.id ?? "anonymous"}:${activeCycleId}`}
        candidates={relativeRankingCandidates}
        seasonLabel={activeCycle?.name ?? "선택 평가 시즌"}
      />
      <AnalysisDashboard
        achievementSources={model.achievementSources}
        categoryAverages={model.categoryAverages}
        evaluatorCalibrations={model.evaluatorCalibrations}
        evaluatorDeviationDomainMax={model.evaluatorDeviationDomainMax}
        evaluatorDeviations={model.evaluatorDeviations}
        evaluatorDisagreementStandardDeviationThreshold={
          model.evaluatorDisagreementStandardDeviationThreshold
        }
        evaluatorExclusionSensitivities={model.evaluatorExclusionSensitivities}
        evaluatorOutlierThreshold={model.evaluatorOutlierThreshold}
        evaluatorRankShiftAlert={model.evaluatorRankShiftAlert}
        evaluatorResiduals={model.evaluatorResiduals}
        evaluatorScoreComparisons={model.evaluatorScoreComparisons}
        evaluationReliability={model.evaluationReliability}
        highlights={model.highlights}
        filters={{
          value: model.filters,
          teamOptions: model.teamOptions,
          categoryOptions: model.categoryOptions,
          statusOptions: model.statusOptions,
          onChange: changeFilter,
          onReset: () => updateUrl({ team: "all", category: "all", status: "all" }),
          resetDisabled: Object.values(model.filters).every((value) => value === "all"),
        }}
        rubricItemAverages={model.rubricItemAverages}
        scoreDistributions={model.scoreDistributions}
        taskCompletionRates={model.taskCompletionRates}
        teamComparison={model.teamComparison}
        teamComparisonCategoryLabel={model.teamComparisonCategoryLabel}
        teamTaskPerformance={model.teamTaskPerformance}
      />
    </div>
  )
}
