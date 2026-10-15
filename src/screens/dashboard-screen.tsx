"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { ErrorState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import {
  CategoryAverageChart,
  CompletedRanking,
  downloadOverallRankingExcel,
  downloadTaskRankingsExcel,
  EngineerEvaluationProgress,
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
import "@/features/dashboard/dashboard-ranking-signal.css"

function parseStatus(value: string | null): RankingStatusFilter {
  return value === "confirmed" || value === "in_progress" ||
    value === "not_started" || value === "tied"
    ? value
    : "all"
}

export function DashboardScreen() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { snapshot, activeCycleId } = useEvaluation()
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
  const seasonPopulationRows = selectedTeam === "all"
    ? model.rankingRows
    : selectDashboardViewModel(snapshot, activeCycleId, "all")?.rankingRows ?? model.rankingRows
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
    <div className="signal-dashboard signal-dashboard-original">
      <header className="signal-dashboard-intro">
        <div>
          <p className="signal-dashboard-context">평가 운영</p>
          <h1>엔지니어 역량평가 전체 현황</h1>
          <p>과제 평균과 현재 점수 기준 순위 확인. 모든 평가 완료 후 최종 결과 확정</p>
        </div>
        <p className="signal-dashboard-period">{cycle === undefined ? "평가 시즌 기준" : `${cycle.startsAt} ~ ${cycle.endsAt}`}</p>
      </header>
      <section className="signal-dashboard-scope" aria-labelledby="dashboard-scope-title">
        <div>
          <h2 id="dashboard-scope-title">현황 범위</h2>
          <p>팀 선택 범위를 대상·평가 현황·과제 평균·종합 순위에 동일 적용</p>
        </div>
        <fieldset>
          <legend className="sr-only">현황 팀 범위</legend>
          {["all", ...teams].map((team) => (
            <Button
              aria-label={`${team === "all" ? "전체" : team} 현황 보기`}
              aria-pressed={selectedTeam === team}
              key={team}
              onClick={() => updateFilters({ ...visibleFilters, team })}
              type="button"
              variant="outline"
            >
              {team === "all" ? "전체" : team}
            </Button>
          ))}
        </fieldset>
      </section>
      <section aria-label="평가 현황 요약" className="signal-dashboard-source-metrics">
        <dl>{model.metrics.map((metric) => (
          <div key={metric.id}>
            <dt>{metric.label}</dt>
            <dd className="numeric">{metric.value}<span>{metric.unit}</span><p>{metric.description}</p></dd>
          </div>
        ))}</dl>
      </section>
      <EngineerEvaluationProgress rows={model.evaluationRows} tasks={model.evaluationTasks} />
      <div className="signal-dashboard-task-grid">
        <TaskRankingPanel
          description="평가 완료자는 평가자 가중 평균 기준 순위 산정. 진행 중·미진행 대상은 순위 하단 분리"
          onDownload={() => downloadTaskRankingsExcel(cycle?.name ?? "평가 시즌", scopeLabel, model.taskRankings)}
          rankings={model.taskRankings}
          title={`${scopeLabel} 과제별 순위`}
        />
        <CategoryAverageChart
          data={model.categoryAverages}
          description={`${scopeLabel} 평가 완료자의 평가자 가중 평균과 단순 평균 비교`}
          title={`${scopeLabel} 과제별 평균`}
        />
      </div>
      <CompletedRanking
        description="완료 과제의 개인별 가중 환산점수 합산 기준 임시 순위. 모든 적용 과제 완료 시 최종 확정, 표시 점수 소수 둘째 자리 기준 공동순위(1, 2, 2, 4) 적용"
        filters={visibleFilters}
        onFiltersChange={updateFilters}
        sorting={sorting}
        onSortingChange={updateSorting}
        onDownload={(rows) => downloadOverallRankingExcel(cycle?.name ?? "평가 시즌", scopeLabel, rows)}
        rows={model.rankingRows}
        scoreLabel="현재 종합 점수"
        title={`${scopeLabel} 종합 순위`}
        populationSelectable
        populationRows={seasonPopulationRows}
        populationResetKey={activeCycleId}
      />
    </div>
  )
}
