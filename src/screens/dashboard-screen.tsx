"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { ErrorState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import {
  CategoryAverageChart,
  CompletedRanking,
  DashboardHeader,
  EngineerEvaluationProgress,
  MetricStrip,
  TaskRankingPanel,
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
  return value === "confirmed" || value === "in_progress" ||
    value === "not_started" || value === "tied"
    ? value
    : "all"
}

export function DashboardScreen() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { snapshot, activeCycleId, backendMode } = useEvaluation()
  const [filters, setFilters] = useState<RankingFilterState>(() => ({
    query: searchParams.get("q") ?? "",
    team: searchParams.get("team") ?? "all",
    status: parseStatus(searchParams.get("status")),
  }))
  const [sorting, setSorting] = useState<RankingSortState>(() =>
    parseRankingSortState(searchParams.get("sort"), searchParams.get("direction")),
  )

  useEffect(() => {
    function restoreUrlState() {
      const params = new URLSearchParams(window.location.search)
      setFilters({
        query: params.get("q") ?? "",
        team: params.get("team") ?? "all",
        status: parseStatus(params.get("status")),
      })
      setSorting(parseRankingSortState(params.get("sort"), params.get("direction")))
    }

    window.addEventListener("popstate", restoreUrlState)
    return () => window.removeEventListener("popstate", restoreUrlState)
  }, [])

  if (snapshot === null) return null
  const teams = Array.from(new Set(snapshot.engineers.map((engineer) => engineer.team)))
    .sort((left, right) => left.localeCompare(right, "ko"))
  const requestedTeam = filters.team
  const selectedTeam = requestedTeam !== null && teams.some((team) => team === requestedTeam)
    ? requestedTeam
    : "all"
  const scopeLabel = selectedTeam === "all" ? "전체" : selectedTeam
  const model = selectDashboardViewModel(snapshot, activeCycleId, selectedTeam)
  if (model === null) {
    return <ErrorState description="선택한 평가 시즌의 데이터를 찾을 수 없습니다." />
  }
  const cycle = snapshot.cycles.find((entry) => entry.id === activeCycleId)
  const visibleFilters: RankingFilterState = { ...filters, team: selectedTeam }

  function replaceDashboardUrl(nextFilters: RankingFilterState, nextSorting: RankingSortState) {
    const params = new URLSearchParams()
    if (nextFilters.query !== "") params.set("q", nextFilters.query)
    if (nextFilters.team !== "all") params.set("team", nextFilters.team)
    if (nextFilters.status !== "all") params.set("status", nextFilters.status)
    const isDefaultSorting =
      nextSorting.key === DEFAULT_RANKING_SORT.key &&
      nextSorting.direction === DEFAULT_RANKING_SORT.direction
    if (!isDefaultSorting) {
      params.set("sort", nextSorting.key)
      params.set("direction", nextSorting.direction)
    }
    const query = params.toString()
    const nextUrl = query.length > 0 ? `${pathname}?${query}` : pathname
    window.history.replaceState(window.history.state, "", nextUrl)
  }

  function updateFilters(next: RankingFilterState) {
    setFilters(next)
    replaceDashboardUrl(next, sorting)
  }

  function updateSorting(next: RankingSortState) {
    setSorting(next)
    replaceDashboardUrl(visibleFilters, next)
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        asOfLabel={cycle === undefined ? "평가 시즌 기준" : `${cycle.startsAt} ~ ${cycle.endsAt}`}
        contextLabel="평가 운영"
        cycleLabel={cycle?.name ?? "평가 시즌"}
        description="과제별 완료 평균과 현재까지 반영된 가중 점수로 순위를 확인합니다. 모든 적용 과제가 끝난 대상은 최종 확정으로 구분합니다."
        sampleLabel={backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}
        title="엔지니어 역량평가 전체 현황"
      />
      <section
        aria-labelledby="dashboard-scope-title"
        className="flex flex-col gap-3 rounded-lg border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-sm font-semibold" id="dashboard-scope-title">현황 범위</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            대상 수, 평가 현황, 과제 평균과 과제·종합 순위를 같은 팀 범위로 전환합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="현황 팀 범위">
          {["all", ...teams].map((team) => {
            const label = team === "all" ? "전체" : team
            const selected = selectedTeam === team
            return (
              <Button
                aria-label={`${label} 현황 보기`}
                aria-pressed={selected}
                key={team}
                onClick={() => updateFilters({ ...visibleFilters, team })}
                size="sm"
                type="button"
                variant={selected ? "default" : "outline"}
              >
                {label}
              </Button>
            )
          })}
        </div>
      </section>
      <MetricStrip metrics={model.metrics} />
      <EngineerEvaluationProgress
        rows={model.evaluationRows}
        tasks={model.evaluationTasks}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <TaskRankingPanel
          description="과제가 완료된 엔지니어는 평가자 가중 평균으로 순위를 매기고, 진행 중·미진행 대상은 순위 아래에 구분해 표시합니다."
          rankings={model.taskRankings}
          title={`${scopeLabel} 과제별 순위`}
        />
        <CategoryAverageChart
          data={model.categoryAverages}
          description={`${scopeLabel}에서 과제가 완료된 엔지니어의 평가자 가중 평균과 단순 평균을 비교합니다.`}
          title={`${scopeLabel} 과제별 평균`}
        />
      </div>
      <CompletedRanking
        description="완료된 과제의 개인별 가중 환산점수를 합산한 현재 점수로 임시 순위를 표시합니다. 모든 적용 과제가 완료되면 최종 확정으로 전환하며, 표시 점수 소수 둘째 자리 기준 공동순위(1, 2, 2, 4)를 적용합니다."
        filters={visibleFilters}
        onFiltersChange={updateFilters}
        sorting={sorting}
        onSortingChange={updateSorting}
        rows={model.rankingRows}
        scoreLabel="현재 종합 점수"
        title={`${scopeLabel} 종합 순위`}
      />
    </div>
  )
}
