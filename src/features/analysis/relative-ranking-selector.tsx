"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { RelativeRankingCandidate } from "@/view-models/relative-ranking"

type RelativeRankingSelectorProps = Readonly<{
  candidates: readonly RelativeRankingCandidate[]
  selectedIds: ReadonlySet<string>
  onToggle: (engineerId: string) => void
  onSelectMany: (engineerIds: readonly string[]) => void
  onClear: () => void
  onReset: () => void
}>

function statusLabel(candidate: RelativeRankingCandidate): string {
  if (candidate.scoreStatus === "confirmed") return "확정"
  if (candidate.scoreStatus === "partial") return "부분점수"
  return "점수 없음"
}

export function RelativeRankingSelector({
  candidates,
  selectedIds,
  onToggle,
  onSelectMany,
  onClear,
  onReset,
}: RelativeRankingSelectorProps) {
  const [query, setQuery] = useState("")
  const [team, setTeam] = useState("all")
  const [department, setDepartment] = useState("all")
  const teams = useMemo(() => Array.from(
    new Set(candidates.map((candidate) => candidate.team)),
  ).toSorted((left, right) => left.localeCompare(right, "ko")), [candidates])
  const departments = useMemo(() => Array.from(
    new Set(candidates
      .filter((candidate) => team === "all" || candidate.team === team)
      .map((candidate) => candidate.department)),
  ).toSorted((left, right) => left.localeCompare(right, "ko")), [candidates, team])
  const normalizedQuery = query.trim().toLocaleLowerCase("ko")
  const filtered = candidates.filter((candidate) => (
    (team === "all" || candidate.team === team) &&
    (department === "all" || candidate.department === department) &&
    (
      normalizedQuery.length === 0 ||
      candidate.engineerName.toLocaleLowerCase("ko").includes(normalizedQuery) ||
      candidate.employeeCode.includes(normalizedQuery)
    )
  ))
  const selectableFilteredIds = filtered.flatMap((candidate) => (
    candidate.score === null ? [] : [candidate.engineerId]
  ))

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">분석 대상 선택</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedIds.size}명 선택 · 점수 없는 인원은 제외
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          초기화
        </Button>
      </div>

      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">이름 또는 사번 검색</span>
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름 또는 사번 검색"
            className="pl-9"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-xs font-medium">
            <span>팀</span>
            <select
              aria-label="상대평가 팀"
              value={team}
              onChange={(event) => {
                setTeam(event.target.value)
                setDepartment("all")
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">전체</option>
              {teams.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span>담당</span>
            <select
              aria-label="상대평가 담당"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">전체</option>
              {departments.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectMany(selectableFilteredIds)}
          >
            검색 결과 선택
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            전체 해제
          </Button>
        </div>
      </div>

      <div className="max-h-[32rem] overflow-y-auto rounded-md border" aria-label="엔지니어 선택 목록">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">조건에 맞는 엔지니어가 없습니다.</p>
        ) : filtered.map((candidate) => {
          const disabled = candidate.score === null
          return (
            <label
              key={candidate.engineerId}
              className="flex cursor-pointer items-start gap-3 border-b px-3 py-3 last:border-b-0 has-[:checked]:bg-accent/70 has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-muted/50"
            >
              <input
                type="checkbox"
                aria-label={`${candidate.engineerName} 분석 포함`}
                checked={!disabled && selectedIds.has(candidate.engineerId)}
                disabled={disabled}
                onChange={() => onToggle(candidate.engineerId)}
                className="mt-1 size-4 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{candidate.engineerName}</span>
                  <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                    {candidate.score === null ? "—" : `${candidate.score.toFixed(1)}점`}
                  </span>
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {candidate.employeeCode} · {candidate.team} · {candidate.department}
                </span>
                <span className={`mt-1 inline-flex text-xs font-medium ${
                  candidate.scoreStatus === "partial"
                    ? "text-warning"
                    : candidate.scoreStatus === "confirmed"
                      ? "text-success"
                      : "text-muted-foreground"
                }`}>
                  {statusLabel(candidate)}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
