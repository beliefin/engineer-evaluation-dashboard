"use client"

import { useMemo, useState } from "react"
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
      className="signal-pending-panel"
    >
      <header className="signal-pending-panel-heading">
        <p className="signal-pending-eyebrow">Exception register</p>
        <div>
          <h2 id="pending-evaluations-title">
            미평가 엔지니어
          </h2>
          <p className="signal-pending-panel-description">
            평가자 미배정·미제출·직접점수 누락 통합 확인
          </p>
        </div>
      </header>

      <PendingFilters
        value={filters}
        resultCount={filteredRows.length}
        onChange={setFilters}
      />

      {filteredRows.length === 0 ? (
        <div className="signal-pending-empty">
          <p>조건에 맞는 미평가 대상이 없습니다.</p>
          <p>
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
