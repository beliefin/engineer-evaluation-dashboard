"use client"

import { RotateCcwIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react"

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

import type { AssignedEvaluationStatus } from "./types"

export type AssignmentStatusFilter = "all" | AssignedEvaluationStatus

interface AssignmentFiltersProps {
  readonly query: string
  readonly status: AssignmentStatusFilter
  readonly evaluatorId: string
  readonly evaluatorOptions: ReadonlyArray<Readonly<{ id: string; name: string }>>
  readonly onQueryChange: (value: string) => void
  readonly onStatusChange: (value: AssignmentStatusFilter) => void
  readonly onEvaluatorChange: (value: string) => void
  readonly onReset: () => void
}

interface FilterFieldsProps extends AssignmentFiltersProps {
  readonly className: string
}

function isStatusFilter(value: string): value is AssignmentStatusFilter {
  return (
    value === "all" ||
    value === "pending" ||
    value === "in_progress" ||
    value === "submitted"
  )
}

function FilterFields({
  query,
  status,
  evaluatorId,
  evaluatorOptions,
  onQueryChange,
  onStatusChange,
  onEvaluatorChange,
  className,
}: FilterFieldsProps) {
  return (
    <div className={className}>
      <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
        배정 검색
        <span className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="배정 평가 검색"
            className="h-9 pl-9"
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder={
              evaluatorOptions.length > 0
                ? "이름, 팀, 분야, 평가자"
                : "이름, 팀, 평가 분야"
            }
            type="search"
            value={query}
          />
        </span>
      </label>

      {evaluatorOptions.length > 0 ? (
        <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
          평가자
          <Select onValueChange={onEvaluatorChange} value={evaluatorId}>
            <SelectTrigger aria-label="평가자 필터" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 평가자</SelectItem>
              {evaluatorOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ) : null}

      <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
        진행 상태
        <Select
          onValueChange={(value) => {
            if (isStatusFilter(value)) onStatusChange(value)
          }}
          value={status}
        >
          <SelectTrigger aria-label="진행 상태 필터" className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">미작성</SelectItem>
            <SelectItem value="in_progress">작성 중</SelectItem>
            <SelectItem value="submitted">제출 완료</SelectItem>
          </SelectContent>
        </Select>
      </label>
    </div>
  )
}

export function AssignmentFilters(props: AssignmentFiltersProps) {
  const activeCount =
    Number(props.query.length > 0) +
    Number(props.status !== "all") +
    Number(props.evaluatorId !== "all")
  const desktopColumns =
    props.evaluatorOptions.length > 0
      ? "hidden gap-3 md:grid md:grid-cols-[minmax(220px,1fr)_144px_128px]"
      : "hidden gap-3 md:grid md:grid-cols-[minmax(220px,1fr)_128px]"

  return (
    <>
      <FilterFields {...props} className={desktopColumns} />
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full" size="sm" type="button" variant="outline">
              <SlidersHorizontalIcon aria-hidden="true" />
              필터{activeCount > 0 ? ` ${activeCount}` : ""}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full" side="right">
            <SheetHeader>
              <SheetTitle>배정 평가 필터</SheetTitle>
              <SheetDescription>
                {props.evaluatorOptions.length > 0
                  ? "이름, 팀, 평가 분야, 평가자와 진행 상태로 배정을 좁힙니다."
                  : "이름, 팀, 평가 분야와 진행 상태로 배정을 좁힙니다."}
              </SheetDescription>
            </SheetHeader>
            <FilterFields {...props} className="grid gap-4 px-4" />
            <div className="px-4">
              <Button
                className="w-full"
                disabled={activeCount === 0}
                onClick={props.onReset}
                type="button"
                variant="outline"
              >
                <RotateCcwIcon aria-hidden="true" />
                필터 초기화
              </Button>
            </div>
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
