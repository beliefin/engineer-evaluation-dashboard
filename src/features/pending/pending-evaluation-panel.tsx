"use client"

import { useMemo, useState } from "react"
import { ClipboardClock } from "lucide-react"

import type { Role } from "@/domain"
import type { PendingEvaluationRow } from "@/view-models/pending"

import {
  EMPTY_PENDING_FILTERS,
  PendingFilters,
  type PendingFilterState,
} from "./pending-filters"
import { PendingDesktopTable } from "./pending-desktop-table"
import { PendingMobileList } from "./pending-mobile-list"

type PendingEvaluationPanelProps = Readonly<{
  rows: ReadonlyArray<PendingEvaluationRow>
  role: Role
}>

function matchesQuery(row: PendingEvaluationRow, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase("ko-KR")
  if (normalized.length === 0) return true

  return [
    row.engineerName,
    row.employeeCode,
    row.team,
    ...row.missingEvaluatorNames,
  ]
    .join(" ")
    .toLocaleLowerCase("ko-KR")
    .includes(normalized)
}

export function PendingEvaluationPanel({
  rows,
  role,
}: PendingEvaluationPanelProps) {
  const [filters, setFilters] = useState<PendingFilterState>(EMPTY_PENDING_FILTERS)
  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          matchesQuery(row, filters.query) &&
          (filters.team === "all" || row.team === filters.team) &&
          (filters.status === "all" || row.status === filters.status),
      ),
    [filters, rows],
  )

  return (
    <section
      aria-labelledby="pending-evaluations-title"
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <header className="flex items-start gap-3 border-b border-border-subtle p-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
          <ClipboardClock className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="pending-evaluations-title" className="text-xl font-semibold tracking-tight">
            미평가 엔지니어
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            평가자 미배정, 미제출, 직접점수 누락을 한곳에서 확인합니다.
          </p>
        </div>
      </header>

      <PendingFilters
        value={filters}
        resultCount={filteredRows.length}
        onChange={setFilters}
      />

      {filteredRows.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="font-semibold text-foreground">조건에 맞는 미평가 대상이 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            검색어 또는 필터 조건을 변경해 보세요.
          </p>
        </div>
      ) : (
        <>
          <PendingDesktopTable rows={filteredRows} role={role} />
          <PendingMobileList rows={filteredRows} role={role} />
        </>
      )}
    </section>
  )
}
