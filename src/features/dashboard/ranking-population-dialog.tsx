"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import type { CompletedRankingRow } from "./dashboard-view-models"

type Props = Readonly<{
  rows: readonly CompletedRankingRow[]
  selectedIds: ReadonlySet<string>
  onChange: (next: ReadonlySet<string>) => void
}>

export function RankingPopulationDialog({ rows, selectedIds, onChange }: Props) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLocaleLowerCase("ko")
  const visibleRows = useMemo(
    () => rows.filter((row) =>
      row.name.toLocaleLowerCase("ko").includes(normalizedQuery) ||
      row.team.toLocaleLowerCase("ko").includes(normalizedQuery)),
    [normalizedQuery, rows],
  )

  function toggle(id: string, checked: boolean) {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    onChange(next)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          순위 대상 관리
        </Button>
      </DialogTrigger>
      <DialogContent className="grid max-h-[min(42rem,calc(100dvh-2rem))] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border-subtle px-5 py-4 pr-12">
          <DialogTitle>전체 종합 순위 대상</DialogTitle>
          <DialogDescription>
            체크를 해제한 인원은 현재 화면의 종합 순위에서만 제외됩니다. 저장된 평가 결과는 변경되지 않습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 border-b border-border-subtle px-5 py-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <label className="text-xs font-semibold" htmlFor="ranking-population-search">이름 또는 팀 검색</label>
            <Input
              className="mt-1.5"
              id="ranking-population-search"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="이름 또는 팀"
              type="search"
              value={query}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onChange(new Set(rows.map((row) => row.id)))}
              size="sm"
              type="button"
              variant="outline"
            >
              전체 선택
            </Button>
            <Button onClick={() => onChange(new Set())} size="sm" type="button" variant="ghost">
              전체 해제
            </Button>
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 py-2">
          <p className="py-2 text-xs text-muted-foreground">
            선택 {selectedIds.size}/{rows.length}명 · 검색 결과 {visibleRows.length}명
          </p>
          <ul className="divide-y divide-border-subtle" aria-label="종합 순위 대상 목록">
            {visibleRows.map((row) => (
              <li className="flex items-center gap-3 py-2.5" key={row.id}>
                <input
                  aria-label={`${row.name} 순위 포함`}
                  checked={selectedIds.has(row.id)}
                  className="size-4 accent-primary"
                  onChange={(event) => toggle(row.id, event.currentTarget.checked)}
                  type="checkbox"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.team}</p>
                </div>
                <p className="numeric text-xs font-semibold text-muted-foreground">
                  {row.totalScore === null ? "점수 없음" : `${row.totalScore.toFixed(2)}점`}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter className="m-0 rounded-none px-5 py-3">
          <DialogClose asChild><Button type="button">확인</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
