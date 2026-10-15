"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import "./evaluation-progress-signal.css"

import Link from "next/link"
import { useMemo, useState } from "react"

import { StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type {
  DashboardEvaluationStatus,
  DashboardEvaluationTask,
  EngineerEvaluationProgressRow,
  EngineerTaskProgress,
} from "./dashboard-view-models"
import { EvaluationProgressControls } from "./evaluation-progress-controls"
import {
  filterAndSortProgressRows,
  type ProgressFilters,
  type ProgressSort,
} from "./evaluation-progress-filtering"

type EngineerEvaluationProgressProps = Readonly<{
  tasks: readonly DashboardEvaluationTask[]
  rows: readonly EngineerEvaluationProgressRow[]
}>

const STATUS_LABEL: Record<DashboardEvaluationStatus, string> = {
  not_started: "미진행",
  in_progress: "진행 중",
  complete: "평가 완료",
}

const TASK_STATUS_CLASS: Record<DashboardEvaluationStatus, string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-warning",
  complete: "text-success",
}

const STATUS_CELL_CLASS: Record<DashboardEvaluationStatus, string> = {
  not_started: "bg-progress-pending",
  in_progress: "bg-progress-in-progress",
  complete: "bg-progress-complete",
}

const NOT_APPLICABLE_CELL_CLASS = "bg-progress-not-applicable"

function TaskLegend() {
  return (
    <fieldset className="signal-progress-legend flex flex-wrap gap-x-4 gap-y-1 border-0 p-0 text-[11px] text-muted-foreground">
      <legend className="sr-only">평가 상태 색상 안내</legend>
      <span><span aria-hidden="true" className="mr-1.5 inline-block size-2.5 bg-progress-complete ring-1 ring-success/35" />평가 완료</span>
      <span><span aria-hidden="true" className="mr-1.5 inline-block size-2.5 bg-progress-in-progress ring-1 ring-warning/35" />진행 중</span>
      <span><span aria-hidden="true" className="mr-1.5 inline-block size-2.5 bg-progress-pending ring-1 ring-destructive/30" />미진행</span>
      <span><span aria-hidden="true" className="mr-1.5 inline-block size-2.5 bg-progress-not-applicable ring-1 ring-border" />해당 없음</span>
    </fieldset>
  )
}

function ProgressStatus({ status }: Readonly<{ status: DashboardEvaluationStatus }>) {
  return (
    <StatusBadge
      className={`signal-progress-status signal-progress-status-${status}`}
      status={status === "complete" ? "completed" : status === "in_progress" ? "in_progress" : "pending"}
      label={STATUS_LABEL[status]}
    />
  )
}

function TaskProgress({ task }: Readonly<{ task: EngineerTaskProgress | undefined }>) {
  if (task === undefined) return <span className="signal-progress-not-applicable text-xs text-muted-foreground">해당 없음</span>

  const evaluatorProgress = task.evaluatorCount === null
    ? task.status === "complete" ? "점수 입력 완료" : "점수 없음"
    : `평가자 ${task.completedEvaluatorCount ?? 0}/${task.evaluatorCount}`

  return (
    <div className={`signal-progress-task signal-progress-task-${task.status} min-w-28 space-y-1.5`}>
      <p className={`text-xs font-semibold ${TASK_STATUS_CLASS[task.status]}`}>
        {STATUS_LABEL[task.status]}
      </p>
      <p className="numeric text-xs font-medium text-foreground">
        {task.score === null ? "점수 없음" : `${task.score.toFixed(1)}점`}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {evaluatorProgress} · 가중치 {task.weight}%
      </p>
    </div>
  )
}

export function EngineerEvaluationProgress({ tasks, rows }: EngineerEvaluationProgressProps) {
  const completedCount = rows.filter((row) => row.status === "complete").length
  const [filters, setFilters] = useState<ProgressFilters>({
    query: "",
    overallStatus: "all",
    taskFilters: {},
  })
  const [sort, setSort] = useState<ProgressSort>("default")
  const visibleRows = useMemo(
    () => filterAndSortProgressRows(rows, filters, sort),
    [filters, rows, sort],
  )

  function resetControls() {
    setFilters({ query: "", overallStatus: "all", taskFilters: {} })
    setSort("default")
  }

  return (
    <section className="signal-engineer-progress overflow-hidden rounded-md border border-border bg-card">
      <div className="signal-progress-heading flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">엔지니어별 평가 현황</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            가중치가 있는 과제만 표시. 배정 평가자 전원 제출 시 완료 처리
          </p>
        </div>
        <Badge variant="outline" className="numeric">
          완료 {completedCount}/{rows.length}명
        </Badge>
      </div>

      <div className="signal-progress-band"><h3>과제별 상태 필터</h3><TaskLegend /></div>
      <EvaluationProgressControls
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetControls}
        onSortChange={setSort}
        resultCount={visibleRows.length}
        sort={sort}
        tasks={tasks}
        totalCount={rows.length}
      />

      {visibleRows.length === 0 ? (
        <div role="status" className="px-5 py-12 text-center text-sm text-muted-foreground">
          조건에 맞는 평가 대상이 없습니다.
        </div>
      ) : (
        <>
          <HorizontalScroll className="signal-progress-desktop hidden overflow-x-auto md:block" aria-label="엔지니어별 평가 현황 표, 가로 스크롤 영역">
            <Table scrollable={false} className="min-w-max">
              <TableCaption className="sr-only">엔지니어별 적용 과제 평가 현황</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-52 bg-card px-5">엔지니어</TableHead>
                  <TableHead className="min-w-32">전체 상태</TableHead>
                  {tasks.map((task) => (
                    <TableHead className="min-w-44 whitespace-normal" key={task.id}>{task.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="sticky left-0 z-10 bg-card px-5 py-3">
                      <Link className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline" href={row.href}>
                        {row.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{row.employeeCode} · {row.team}</p>
                    </TableCell>
                    <TableCell className={STATUS_CELL_CLASS[row.status]}>
                      <ProgressStatus status={row.status} />
                      <p className="numeric mt-1.5 text-xs text-muted-foreground">
                        {row.completedTaskCount}/{row.taskCount}개 과제 완료
                      </p>
                    </TableCell>
                    {tasks.map((task) => {
                      const progress = row.tasks.find((entry) => entry.taskId === task.id)
                      return (
                      <TableCell
                        className={`border-l border-border-subtle py-3 align-top ${progress === undefined ? NOT_APPLICABLE_CELL_CLASS : STATUS_CELL_CLASS[progress.status]}`}
                        key={task.id}
                      >
                        <TaskProgress task={progress} />
                      </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </HorizontalScroll>

          <ul className="signal-progress-mobile divide-y divide-border md:hidden" aria-label="엔지니어별 평가 현황">
            {visibleRows.map((row) => {
              const outstandingTasks = row.tasks.filter((task) => task.status !== "complete")
              const visibleOutstandingTasks = outstandingTasks.slice(0, 2)
              const hiddenOutstandingCount = outstandingTasks.length - visibleOutstandingTasks.length

              return (
              <li className={`px-4 py-3.5 ${STATUS_CELL_CLASS[row.status]}`} key={row.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link className="truncate font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline" href={row.href}>
                      {row.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{row.employeeCode} · {row.team}</p>
                  </div>
                  <ProgressStatus status={row.status} />
                </div>
                <p className="numeric mt-2.5 text-xs font-medium text-muted-foreground">
                  적용 과제 {row.completedTaskCount}/{row.taskCount}개 완료
                </p>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {outstandingTasks.length === 0
                    ? "모든 적용 과제 평가 완료"
                    : <>남은 과제: {visibleOutstandingTasks.map((task) => task.label).join(", ")}{hiddenOutstandingCount > 0 ? ` 외 ${hiddenOutstandingCount}개` : ""}</>}
                </p>
              </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
