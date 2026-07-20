"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { ErrorState, PageHeader } from "@/components/shared"
import {
  AnalysisDashboard,
  RelativeRankingSection,
  type AnalysisFilterKey,
  type AnalysisFilterState,
} from "@/features/analysis"
import { useEvaluation } from "@/providers"
import { selectAnalysisViewModel } from "@/view-models/analysis"
import { selectRelativeRankingCandidates } from "@/view-models/relative-ranking"

export function AnalysisScreen() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { snapshot, activeCycleId, backendMode } = useEvaluation()
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
    <div className="space-y-6">
      <PageHeader
        description="상대 서열, 점수 분포, 완료 병목과 평가 편차를 비교합니다."
        context={`평가 인사이트 · ${backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}`}
        title="평가 항목 분석"
      />
      <RelativeRankingSection
        key={activeCycleId}
        candidates={relativeRankingCandidates}
        seasonLabel={activeCycle?.name ?? "선택 평가 시즌"}
      />
      <AnalysisDashboard
        categoryAverages={model.categoryAverages}
        evaluatorDeviationDomainMax={model.evaluatorDeviationDomainMax}
        evaluatorDeviations={model.evaluatorDeviations}
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
