"use client"

import { SlidersHorizontal } from "lucide-react"
import { useId } from "react"

import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

import type {
  AnalysisFilterKey,
  AnalysisFilterOption,
  AnalysisFiltersProps,
} from "./types"

type FilterSelectProps = Readonly<{
  id: string
  label: string
  value: string
  options: readonly AnalysisFilterOption[]
  onChange: (value: string) => void
}>

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-9 w-full bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type FilterGridProps = Pick<
  AnalysisFiltersProps,
  "value" | "teamOptions" | "categoryOptions" | "statusOptions" | "onChange"
> &
  Readonly<{ idPrefix: string; className: string }>

function FilterGrid({
  value,
  teamOptions,
  categoryOptions,
  statusOptions,
  onChange,
  idPrefix,
  className,
}: FilterGridProps) {
  const update = (key: AnalysisFilterKey) => (nextValue: string) => {
    onChange(key, nextValue)
  }

  return (
    <div className={className}>
      <FilterSelect
        id={`${idPrefix}-team`}
        label="팀"
        value={value.team}
        options={teamOptions}
        onChange={update("team")}
      />
      <FilterSelect
        id={`${idPrefix}-category`}
        label="평가 분야"
        value={value.category}
        options={categoryOptions}
        onChange={update("category")}
      />
      <FilterSelect
        id={`${idPrefix}-status`}
        label="진행 상태"
        value={value.status}
        options={statusOptions}
        onChange={update("status")}
      />
    </div>
  )
}

export function AnalysisFilters({
  value,
  teamOptions,
  categoryOptions,
  statusOptions,
  onChange,
  onReset,
  resetDisabled = false,
  className,
}: AnalysisFiltersProps) {
  const id = useId()
  const activeCount = Object.values(value).filter((entry) => entry !== "all").length

  return (
    <>
      <section
        aria-labelledby={`${id}-desktop-heading`}
        className={cn(
          "hidden border-y border-border bg-muted/45 px-5 py-4 sm:block",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 id={`${id}-desktop-heading`} className="text-sm font-semibold">
              분석 필터
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              팀, 평가 분야, 진행 상태를 기준으로 모든 분석을 갱신합니다.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={resetDisabled}
          >
            초기화
          </Button>
        </div>
        <FilterGrid
          categoryOptions={categoryOptions}
          className="grid grid-cols-3 gap-3"
          idPrefix={`${id}-desktop`}
          onChange={onChange}
          statusOptions={statusOptions}
          teamOptions={teamOptions}
          value={value}
        />
      </section>

      <div className={cn("sm:hidden", className)}>
        <Sheet>
          <div className="flex items-center justify-between gap-3 border-y border-border bg-muted/45 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">분석 필터</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activeCount === 0 ? "전체 조건 적용" : `${activeCount}개 조건 적용`}
              </p>
            </div>
            <SheetTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <SlidersHorizontal aria-hidden="true" />
                필터{activeCount > 0 ? ` ${activeCount}` : ""}
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent className="w-full" side="right">
            <SheetHeader>
              <SheetTitle>분석 필터</SheetTitle>
              <SheetDescription>
                팀, 평가 분야, 진행 상태를 기준으로 모든 분석을 갱신합니다.
              </SheetDescription>
            </SheetHeader>
            <FilterGrid
              categoryOptions={categoryOptions}
              className="grid gap-4 px-4"
              idPrefix={`${id}-mobile`}
              onChange={onChange}
              statusOptions={statusOptions}
              teamOptions={teamOptions}
              value={value}
            />
            <div className="px-4">
              <Button
                className="w-full"
                disabled={resetDisabled}
                onClick={onReset}
                type="button"
                variant="outline"
              >
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
