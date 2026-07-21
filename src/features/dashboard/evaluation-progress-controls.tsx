"use client"

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

import type { DashboardEvaluationTask } from "./dashboard-view-models"
import type {
  ProgressFilters,
  ProgressSort,
  ProgressTaskFilter,
} from "./evaluation-progress-filtering"

type Props = Readonly<{
  tasks: readonly DashboardEvaluationTask[]
  filters: ProgressFilters
  sort: ProgressSort
  resultCount: number
  totalCount: number
  onFiltersChange: (next: ProgressFilters) => void
  onSortChange: (next: ProgressSort) => void
  onReset: () => void
}>

const TASK_FILTER_OPTIONS: readonly Readonly<{ value: ProgressTaskFilter; label: string }>[] = [
  { value: "all", label: "전체" },
  { value: "complete", label: "평가 완료" },
  { value: "in_progress", label: "진행 중" },
  { value: "not_started", label: "미진행" },
  { value: "scored", label: "점수 있음" },
  { value: "not_applicable", label: "해당 없음" },
]

export function EvaluationProgressControls({
  tasks,
  filters,
  sort,
  resultCount,
  totalCount,
  onFiltersChange,
  onSortChange,
  onReset,
}: Props) {
  function updateTaskFilter(taskId: string, value: ProgressTaskFilter) {
    onFiltersChange({
      ...filters,
      taskFilters: { ...filters.taskFilters, [taskId]: value },
    })
  }

  return (
    <div className="border-b border-border-subtle bg-muted/35 px-5 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-56 flex-1 text-xs font-semibold">
          엔지니어
          <span className="relative mt-1.5 block">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="평가 현황 엔지니어 검색"
              className="pl-9"
              onChange={(event) => onFiltersChange({ ...filters, query: event.currentTarget.value })}
              placeholder="이름 또는 사번"
              type="search"
              value={filters.query}
            />
          </span>
        </label>
        <label className="min-w-44 text-xs font-semibold">
          전체 상태
          <Select
            onValueChange={(value) => onFiltersChange({
              ...filters,
              overallStatus: value as ProgressFilters["overallStatus"],
            })}
            value={filters.overallStatus}
          >
            <SelectTrigger aria-label="평가 현황 전체 상태 필터" className="mt-1.5 w-full bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="complete">평가 완료</SelectItem>
              <SelectItem value="in_progress">진행 중</SelectItem>
              <SelectItem value="not_started">미진행</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="min-w-56 text-xs font-semibold">
          정렬 기준
          <Select onValueChange={(value) => onSortChange(value as ProgressSort)} value={sort}>
            <SelectTrigger aria-label="평가 현황 정렬 기준" className="mt-1.5 w-full bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">기본 순서</SelectItem>
              <SelectItem value="name_asc">이름 가나다순</SelectItem>
              <SelectItem value="name_desc">이름 역순</SelectItem>
              <SelectItem value="overall_desc">전체 완료 많은순</SelectItem>
              <SelectItem value="overall_asc">전체 완료 적은순</SelectItem>
              {tasks.map((task) => (
                <SelectItem key={`${task.id}-status`} value={`task:${task.id}:status`}>{task.label} 완료순</SelectItem>
              ))}
              {tasks.map((task) => (
                <SelectItem key={`${task.id}-score`} value={`task:${task.id}:score_desc`}>{task.label} 점수 높은순</SelectItem>
              ))}
              {tasks.map((task) => (
                <SelectItem key={`${task.id}-score-asc`} value={`task:${task.id}:score_asc`}>{task.label} 점수 낮은순</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <Button aria-label="평가 현황 필터 초기화" onClick={onReset} size="sm" type="button" variant="outline">
          <RotateCcw aria-hidden="true" /> 초기화
        </Button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="과제별 상태 필터">
        {tasks.map((task) => (
          <label className="min-w-40 text-[11px] font-semibold text-muted-foreground" key={task.id}>
            {task.label}
            <Select
              onValueChange={(value) => updateTaskFilter(task.id, value as ProgressTaskFilter)}
              value={filters.taskFilters[task.id] ?? "all"}
            >
              <SelectTrigger aria-label={`${task.label} 상태 필터`} className="mt-1 h-8 w-full bg-card text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TASK_FILTER_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
        ))}
        <p className="ml-auto self-end whitespace-nowrap pb-2 text-xs text-muted-foreground">
          표시 <span className="numeric font-semibold text-foreground">{resultCount}/{totalCount}명</span>
        </p>
      </div>
    </div>
  )
}
