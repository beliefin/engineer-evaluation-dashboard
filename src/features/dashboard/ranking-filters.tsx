"use client"

import { RotateCcw, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import type { RankingFilterState } from "./dashboard-view-models"

interface RankingFiltersProps {
  readonly value: RankingFilterState
  readonly teams: readonly string[]
  readonly resultCount: number
  readonly onChange: (next: RankingFilterState) => void
}

interface FilterFieldsProps extends RankingFiltersProps {
  readonly idPrefix: string
  readonly className: string
}

const EMPTY_FILTERS: RankingFilterState = {
  query: "",
  team: "all",
  status: "all",
}

function FilterFields({
  value,
  teams,
  onChange,
  idPrefix,
  className,
}: FilterFieldsProps) {
  return (
    <div className={className}>
      <label className="grid min-w-48 gap-1 text-xs font-medium text-muted-foreground">
        이름 검색
        <Input
          id={`${idPrefix}-ranking-search`}
          type="search"
          placeholder="엔지니어 이름"
          value={value.query}
          onChange={(event) =>
            onChange({ ...value, query: event.currentTarget.value })
          }
        />
      </label>

      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        팀
        <Select
          value={value.team}
          onValueChange={(team) => onChange({ ...value, team })}
        >
          <SelectTrigger className="w-full min-w-36" aria-label="팀 필터">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 팀</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        진행 상태
        <Select
          value={value.status}
          onValueChange={(status) => {
            if (
              status === "all" || status === "confirmed" || status === "in_progress" ||
              status === "not_started" || status === "tied"
            ) {
              onChange({ ...value, status })
            }
          }}
        >
          <SelectTrigger className="w-full min-w-36" aria-label="순위 상태 필터">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="confirmed">최종 확정</SelectItem>
            <SelectItem value="in_progress">진행 중</SelectItem>
            <SelectItem value="not_started">미진행</SelectItem>
            <SelectItem value="tied">공동 순위</SelectItem>
          </SelectContent>
        </Select>
      </label>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange(EMPTY_FILTERS)}
        disabled={
          value.query.length === 0 && value.team === "all" && value.status === "all"
        }
      >
        <RotateCcw aria-hidden="true" data-icon="inline-start" />
        초기화
      </Button>
    </div>
  )
}

export function RankingFilters(props: RankingFiltersProps) {
  const activeCount =
    Number(props.value.query.length > 0) +
    Number(props.value.team !== "all") +
    Number(props.value.status !== "all")

  return (
    <>
      <div className="hidden items-end justify-between gap-4 border-b border-border-subtle px-5 py-4 md:flex">
        <FilterFields
          {...props}
          idPrefix="desktop"
          className="flex items-end gap-3"
        />
        <p className="numeric pb-2 text-xs text-muted-foreground">
          검색 결과 {props.resultCount}명
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 md:hidden">
        <p className="numeric text-xs text-muted-foreground">
          검색 결과 {props.resultCount}명
        </p>
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <SlidersHorizontal aria-hidden="true" data-icon="inline-start" />
              필터{activeCount > 0 ? ` ${activeCount}` : ""}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>순위표 필터</SheetTitle>
              <SheetDescription>
                이름, 팀, 진행 상태로 순위 대상을 좁힙니다.
              </SheetDescription>
            </SheetHeader>
            <FilterFields
              {...props}
              idPrefix="mobile"
              className="grid gap-4 px-4"
            />
            <SheetFooter>
              <SheetClose asChild>
                <Button type="button">결과 보기</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
