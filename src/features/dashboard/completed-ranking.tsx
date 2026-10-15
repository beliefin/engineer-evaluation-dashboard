"use client"

import "./dashboard-ranking-signal.css"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"

import { createRankingColumns } from "./ranking-columns"
import { RankingDesktopTable } from "./ranking-desktop-table"
import { RankingFilters } from "./ranking-filters"
import { RankingMobileList } from "./ranking-mobile-list"
import { RankingPopulationDialog } from "./ranking-population-dialog"
import { RankingExportButton } from "./ranking-export-button"
import {
  DEFAULT_RANKING_SORT,
  parseRankingSortState,
  type CompletedRankingProps,
  type RankingFilterState,
  type RankingSortState,
} from "./dashboard-view-models"

const DEFAULT_FILTERS: RankingFilterState = {
  query: "",
  team: "all",
  status: "all",
}

const useDashboardTable = useReactTable
function readPopulationSelection(key: string | undefined): readonly string[] | null {
  if (key === undefined || typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) return null
    return [...new Set(parsed)]
  } catch {
    return null
  }
}

function storePopulationSelection(key: string | undefined, ids: ReadonlySet<string>): boolean {
  if (key === undefined || typeof window === "undefined") return false
  try {
    window.localStorage.setItem(key, JSON.stringify([...ids]))
    return true
  } catch {
    return false
  }
}

function clearPopulationSelection(key: string | undefined): boolean {
  if (key === undefined || typeof window === "undefined") return false
  try {
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function recalculateRankingRows(
  rows: ReadonlyArray<CompletedRankingProps["rows"][number]>,
  selectedIds: ReadonlySet<string>,
): ReadonlyArray<CompletedRankingProps["rows"][number]> {
  const selected = rows.filter((row) => selectedIds.has(row.id))
  const scores = selected.flatMap((row) => row.totalScore === null ? [] : [row.totalScore])
  const scoreCounts = new Map<number, number>()
  scores.forEach((score) => scoreCounts.set(score, (scoreCounts.get(score) ?? 0) + 1))
  const sortedScores = [...new Set(scores)].toSorted((left, right) => right - left)
  const rankByScore = new Map(sortedScores.map((score) => [
    score,
    selected.filter((row) => row.totalScore !== null && row.totalScore > score).length + 1,
  ]))

  return selected.map((row) => ({
    ...row,
    rank: row.totalScore === null ? null : rankByScore.get(row.totalScore) ?? null,
    isTied: row.totalScore !== null && (scoreCounts.get(row.totalScore) ?? 0) > 1,
  }))
}

export function CompletedRanking({
  title,
  description,
  rows,
  scoreLabel = "종합 점수",
  filters,
  onFiltersChange,
  sorting,
  onSortingChange,
  populationSelectable = false,
  populationRows: populationCandidates = rows,
  populationResetKey,
  populationStorageKey,
  onDownload,
}: CompletedRankingProps) {
  const [internalFilters, setInternalFilters] =
    useState<RankingFilterState>(DEFAULT_FILTERS)
  const [internalSorting, setInternalSorting] =
    useState<RankingSortState>(DEFAULT_RANKING_SORT)
  const activeFilters = filters ?? internalFilters
  const activeSorting = sorting ?? internalSorting
  const populationKey = populationResetKey ?? populationCandidates.map((row) => row.id).join("|")
  const defaultSelectedIds = useMemo(
    () => new Set(populationCandidates.map((row) => row.id)),
    [populationCandidates],
  )
  const [storedSelection] = useState<readonly string[] | null>(() => (
    readPopulationSelection(populationStorageKey)
  ))
  const candidateIdsKey = populationCandidates.map((row) => row.id).join("\u0000")
  const previousCandidateIdsKeyRef = useRef(candidateIdsKey)
  const [populationSelection, setPopulationSelection] = useState<Readonly<{
    key: string
    ids: ReadonlySet<string>
  }>>(() => ({
    key: populationKey,
    ids: storedSelection === null
      ? defaultSelectedIds
      : new Set(storedSelection.filter((id) => defaultSelectedIds.has(id))),
  }))
  useEffect(() => {
    if (previousCandidateIdsKeyRef.current === candidateIdsKey) return
    previousCandidateIdsKeyRef.current = candidateIdsKey
    setPopulationSelection((current) => ({
      key: populationKey,
      ids: new Set([...current.ids].filter((id) => defaultSelectedIds.has(id))),
    }))
  }, [candidateIdsKey, defaultSelectedIds, populationKey])
  const selectedIds = useMemo(
    () => populationSelection.key === populationKey ? populationSelection.ids : defaultSelectedIds,
    [defaultSelectedIds, populationKey, populationSelection],
  )
  const populationRows = useMemo(
    () => populationSelectable ? recalculateRankingRows(rows, selectedIds) : rows,
    [populationSelectable, rows, selectedIds],
  )
  const tableSorting = useMemo<SortingState>(
    () => [
      {
        id: activeSorting.key,
        desc: activeSorting.direction === "desc",
      },
    ],
    [activeSorting.direction, activeSorting.key]
  )

  const teams = useMemo(
    () =>
      Array.from(new Set(populationRows.map((row) => row.team))).sort((left, right) =>
        left.localeCompare(right, "ko")
      ),
    [populationRows]
  )
  const filteredRows = useMemo(() => {
    const query = activeFilters.query.trim().toLocaleLowerCase("ko")

    return populationRows.filter((row) => {
      const matchesQuery = row.name.toLocaleLowerCase("ko").includes(query)
      const matchesTeam =
        activeFilters.team === "all" || row.team === activeFilters.team
      const matchesStatus =
        activeFilters.status === "all" ||
        (activeFilters.status === "tied" ? row.isTied === true : row.status === activeFilters.status)

      return matchesQuery && matchesTeam && matchesStatus
    })
  }, [activeFilters, populationRows])
  const columns = useMemo(() => createRankingColumns(scoreLabel), [scoreLabel])
  const table = useDashboardTable({
    data: filteredRows,
    columns,
    state: { sorting: tableSorting },
    onSortingChange: (updater) => {
      const nextTableSorting =
        typeof updater === "function" ? updater(tableSorting) : updater
      const firstSort = nextTableSorting[0]
      const nextSorting = parseRankingSortState(
        firstSort?.id ?? null,
        firstSort?.desc === true ? "desc" : "asc"
      )

      if (onSortingChange) {
        onSortingChange(nextSorting)
        return
      }

      setInternalSorting(nextSorting)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
  const visibleRows = table.getRowModel().rows.map((row) => row.original)

  function updateFilters(next: RankingFilterState) {
    if (onFiltersChange) {
      onFiltersChange(next)
      return
    }

    setInternalFilters(next)
  }

  function resetPopulationSelection(): boolean {
    const cleared = clearPopulationSelection(populationStorageKey)
    setPopulationSelection({ key: populationKey, ids: defaultSelectedIds })
    return cleared
  }

  function savePopulationSelection(): boolean {
    if (populationStorageKey === undefined) return true
    const saved = storePopulationSelection(populationStorageKey, selectedIds)
    return saved
  }

  return (
    <section className="signal-completed-ranking">
      <div className="signal-completed-ranking-heading">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="signal-completed-ranking-actions">
          <Badge variant="outline" className="numeric">
            점수 반영 {populationRows.filter((row) => row.totalScore !== null).length}/{populationRows.length}명
          </Badge>
          {populationSelectable ? (
            <RankingPopulationDialog
              onChange={(ids) => setPopulationSelection({ key: populationKey, ids })}
              onReset={resetPopulationSelection}
              onSave={savePopulationSelection}
              rows={populationCandidates}
              selectedIds={selectedIds}
            />
          ) : null}
          {onDownload === undefined ? null : (
            <RankingExportButton
              label="종합 순위 Excel"
              pendingLabel="파일 생성 중"
              onDownload={() => onDownload(populationRows)}
            />
          )}
        </div>
      </div>

      <RankingFilters
        value={activeFilters}
        teams={teams}
        resultCount={visibleRows.length}
        onChange={updateFilters}
      />

      <label className="signal-ranking-mobile-sort">
        정렬 기준
        <select
          aria-label="종합 순위 정렬 기준"
          value={`${activeSorting.key}:${activeSorting.direction}`}
          onChange={(event) => {
            const [key, direction] = event.currentTarget.value.split(":")
            const next = parseRankingSortState(key ?? null, direction ?? null)
            if (onSortingChange) onSortingChange(next)
            else setInternalSorting(next)
          }}
        >
          <option value="rank:asc">순위 오름차순</option>
          <option value="rank:desc">순위 내림차순</option>
          <option value="name:asc">이름 오름차순</option>
          <option value="name:desc">이름 내림차순</option>
          <option value="team:asc">팀 오름차순</option>
          <option value="team:desc">팀 내림차순</option>
          <option value="totalScore:desc">점수 높은 순</option>
          <option value="totalScore:asc">점수 낮은 순</option>
        </select>
      </label>

      {visibleRows.length > 0 ? (
        <>
          <RankingDesktopTable table={table} />
          <RankingMobileList rows={visibleRows} />
        </>
      ) : (
        <div role="status" className="px-5 py-12 text-center">
          <p className="text-sm font-medium">조건에 맞는 대상자가 없습니다.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            검색어나 팀, 진행 상태 필터를 조정해 주세요.
          </p>
        </div>
      )}
    </section>
  )
}
