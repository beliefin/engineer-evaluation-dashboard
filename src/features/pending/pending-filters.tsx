import { RotateCcw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PendingEvaluationStatus } from "@/view-models/pending"

import { getPendingStatusLabel } from "./pending-status"

export const PRODUCTION_TEAMS = ["생산 1팀", "생산 2팀"] as const
export type ProductionTeam = (typeof PRODUCTION_TEAMS)[number]

export type PendingFilterState = Readonly<{
  query: string
  team: ProductionTeam | "all"
  status: PendingEvaluationStatus | "all"
}>

export const EMPTY_PENDING_FILTERS: PendingFilterState = {
  query: "",
  team: "all",
  status: "all",
}

type PendingFiltersProps = Readonly<{
  value: PendingFilterState
  resultCount: number
  onChange: (next: PendingFilterState) => void
}>

function isTeamFilter(value: string): value is PendingFilterState["team"] {
  return value === "all" || value === "생산 1팀" || value === "생산 2팀"
}

function isStatusFilter(value: string): value is PendingFilterState["status"] {
  return (
    value === "all" ||
    value === "unassigned" ||
    value === "not_started" ||
    value === "in_progress" ||
    value === "direct_scores_pending"
  )
}

export function PendingFilters({
  value,
  resultCount,
  onChange,
}: PendingFiltersProps) {
  const canReset =
    value.query.length > 0 || value.team !== "all" || value.status !== "all"

  return (
    <div className="grid gap-3 border-b border-border-subtle px-4 py-4 md:grid-cols-[minmax(220px,1fr)_140px_160px] md:items-end md:px-5 xl:grid-cols-[minmax(220px,1fr)_160px_180px_auto]">
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        이름 또는 사번
        <span className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="미평가 대상 검색"
            placeholder="이름 또는 사번 검색"
            value={value.query}
            onChange={(event) =>
              onChange({ ...value, query: event.currentTarget.value })
            }
            className="pl-8"
          />
        </span>
      </label>

      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        팀
        <Select
          value={value.team}
          onValueChange={(team) => {
            if (isTeamFilter(team)) onChange({ ...value, team })
          }}
        >
          <SelectTrigger className="w-full" aria-label="팀 필터">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 팀</SelectItem>
            {PRODUCTION_TEAMS.map((team) => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        미완료 사유
        <Select
          value={value.status}
          onValueChange={(status) => {
            if (isStatusFilter(status)) onChange({ ...value, status })
          }}
        >
          <SelectTrigger className="w-full" aria-label="미완료 사유 필터">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 사유</SelectItem>
            <SelectItem value="unassigned">{getPendingStatusLabel("unassigned")}</SelectItem>
            <SelectItem value="not_started">{getPendingStatusLabel("not_started")}</SelectItem>
            <SelectItem value="in_progress">{getPendingStatusLabel("in_progress")}</SelectItem>
            <SelectItem value="direct_scores_pending">
              {getPendingStatusLabel("direct_scores_pending")}
            </SelectItem>
          </SelectContent>
        </Select>
      </label>

      <div className="flex items-center justify-between gap-3 md:col-span-3 md:justify-end xl:col-span-1">
        <p className="numeric text-xs text-muted-foreground">검색 결과 {resultCount}명</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_PENDING_FILTERS)}
          disabled={!canReset}
        >
          <RotateCcw aria-hidden="true" data-icon="inline-start" />
          초기화
        </Button>
      </div>
    </div>
  )
}
