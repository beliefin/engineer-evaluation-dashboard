"use client"

import { useMemo, useState } from "react"
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

export function CompletedRanking({
  title,
  description,
  rows,
  filters,
  onFiltersChange,
  sorting,
  onSortingChange,
}: CompletedRankingProps) {
  const [internalFilters, setInternalFilters] =
    useState<RankingFilterState>(DEFAULT_FILTERS)
  const [internalSorting, setInternalSorting] =
    useState<RankingSortState>(DEFAULT_RANKING_SORT)
  const activeFilters = filters ?? internalFilters
  const activeSorting = sorting ?? internalSorting
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
      Array.from(new Set(rows.map((row) => row.team))).sort((left, right) =>
        left.localeCompare(right, "ko")
      ),
    [rows]
  )
  const filteredRows = useMemo(() => {
    const query = activeFilters.query.trim().toLocaleLowerCase("ko")

    return rows.filter((row) => {
      const matchesQuery = row.name.toLocaleLowerCase("ko").includes(query)
      const matchesTeam =
        activeFilters.team === "all" || row.team === activeFilters.team
      const matchesStatus =
        activeFilters.status === "all" || row.status === activeFilters.status

      return matchesQuery && matchesTeam && matchesStatus
    })
  }, [activeFilters, rows])
  const columns = useMemo(() => createRankingColumns(), [])
  const table = useDashboardTable({
    data: [...filteredRows],
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

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <Badge variant="outline" className="numeric rounded-md">
          완료 {rows.length}명
        </Badge>
      </div>

      <RankingFilters
        value={activeFilters}
        teams={teams}
        resultCount={visibleRows.length}
        onChange={updateFilters}
      />

      {visibleRows.length > 0 ? (
        <>
          <RankingDesktopTable table={table} />
          <RankingMobileList rows={visibleRows} />
        </>
      ) : (
        <div role="status" className="px-5 py-12 text-center">
          <p className="text-sm font-medium">조건에 맞는 완료자가 없습니다.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            검색어나 팀, 순위 상태 필터를 조정해 주세요.
          </p>
        </div>
      )}
    </section>
  )
}
