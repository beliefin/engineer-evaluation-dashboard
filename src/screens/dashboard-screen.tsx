"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { ErrorState } from "@/components/shared"
import {
  CategoryAverageChart,
  CompletedRanking,
  DashboardHeader,
  MetricStrip,
  ScoreDistributionChart,
  type RankingFilterState,
  type RankingStatusFilter,
} from "@/features/dashboard"
import {
  DEFAULT_RANKING_SORT,
  parseRankingSortState,
  type RankingSortState,
} from "@/features/dashboard/dashboard-view-models"
import { useEvaluation } from "@/providers"
import { selectDashboardViewModel } from "@/view-models/dashboard"

function parseStatus(value: string | null): RankingStatusFilter {
  return value === "confirmed" || value === "tied" ? value : "all"
}

export function DashboardScreen() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { snapshot, activeCycleId, backendMode } = useEvaluation()

  if (snapshot === null) return null
  const model = selectDashboardViewModel(snapshot, activeCycleId)
  if (model === null) {
    return <ErrorState description="선택한 평가 시즌의 데이터를 찾을 수 없습니다." />
  }
  const cycle = snapshot.cycles.find((entry) => entry.id === activeCycleId)
  const filters: RankingFilterState = {
    query: searchParams.get("q") ?? "",
    team: searchParams.get("team") ?? "all",
    status: parseStatus(searchParams.get("status")),
  }
  const sorting = parseRankingSortState(
    searchParams.get("sort"),
    searchParams.get("direction")
  )

  function replaceDashboardUrl(params: URLSearchParams) {
    const query = params.toString()
    router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function updateFilters(next: RankingFilterState) {
    const params = new URLSearchParams(searchParams.toString())
    const values = { q: next.query, team: next.team, status: next.status }
    Object.entries(values).forEach(([key, value]) => {
      if (value === "" || value === "all") params.delete(key)
      else params.set(key, value)
    })
    replaceDashboardUrl(params)
  }

  function updateSorting(next: RankingSortState) {
    const params = new URLSearchParams(searchParams.toString())
    const isDefault =
      next.key === DEFAULT_RANKING_SORT.key &&
      next.direction === DEFAULT_RANKING_SORT.direction

    if (isDefault) {
      params.delete("sort")
      params.delete("direction")
    } else {
      params.set("sort", next.key)
      params.set("direction", next.direction)
    }
    replaceDashboardUrl(params)
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        asOfLabel={cycle === undefined ? "평가 시즌 기준" : `${cycle.startsAt} ~ ${cycle.endsAt}`}
        contextLabel="평가 운영"
        cycleLabel={cycle?.name ?? "평가 시즌"}
        description="시즌 과제의 평가와 운영자 입력이 모두 끝나고 엔지니어별 적용 가중치 합계가 100%인 대상만 공식 순위에 반영됩니다."
        sampleLabel={backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}
        title="엔지니어 역량평가 전체 현황"
      />
      <MetricStrip metrics={model.metrics} />
      <div className="grid gap-6 xl:grid-cols-2">
        <ScoreDistributionChart
          data={model.distribution}
          description="완료자의 시즌별 과제 가중 총점만 0~100 구간에 집계합니다."
          title="가중 총점 분포"
        />
        <CategoryAverageChart
          data={model.categoryAverages}
          description="각 과제에서 확정된 0~100 환산점수의 평균입니다."
          title="과제별 평균"
        />
      </div>
      <CompletedRanking
        description="표시 총점 소수 둘째 자리 기준 공동순위(1, 2, 2, 4)를 적용합니다."
        filters={filters}
        onFiltersChange={updateFilters}
        sorting={sorting}
        onSortingChange={updateSorting}
        rows={model.rankingRows}
        title="완료자 전체 순위"
      />
    </div>
  )
}
