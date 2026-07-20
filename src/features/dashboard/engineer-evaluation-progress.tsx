"use client"

import Link from "next/link"

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

function ProgressStatus({ status }: Readonly<{ status: DashboardEvaluationStatus }>) {
  return (
    <StatusBadge
      status={status === "complete" ? "completed" : status === "in_progress" ? "in_progress" : "pending"}
      label={STATUS_LABEL[status]}
    />
  )
}

function TaskProgress({ task }: Readonly<{ task: EngineerTaskProgress | undefined }>) {
  if (task === undefined) return <span className="text-xs text-muted-foreground">해당 없음</span>

  const evaluatorProgress = task.evaluatorCount === null
    ? task.status === "complete" ? "점수 입력 완료" : "점수 없음"
    : `평가자 ${task.completedEvaluatorCount ?? 0}/${task.evaluatorCount}`

  return (
    <div className="min-w-28 space-y-1.5">
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

  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">엔지니어별 평가 현황</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            가중치가 있는 과제만 표시합니다. 평가자 전원이 제출하면 완료됩니다.
          </p>
        </div>
        <Badge variant="outline" className="numeric">
          완료 {completedCount}/{rows.length}명
        </Badge>
      </div>

      {rows.length === 0 ? (
        <div role="status" className="px-5 py-12 text-center text-sm text-muted-foreground">
          선택한 범위에 평가 대상이 없습니다.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-max">
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
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="sticky left-0 z-10 bg-card px-5 py-3">
                      <Link className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline" href={row.href}>
                        {row.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{row.employeeCode} · {row.team}</p>
                    </TableCell>
                    <TableCell>
                      <ProgressStatus status={row.status} />
                      <p className="numeric mt-1.5 text-xs text-muted-foreground">
                        {row.completedTaskCount}/{row.taskCount}개 과제 완료
                      </p>
                    </TableCell>
                    {tasks.map((task) => (
                      <TableCell className="py-3 align-top" key={task.id}>
                        <TaskProgress task={row.tasks.find((entry) => entry.taskId === task.id)} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y divide-border md:hidden" aria-label="엔지니어별 평가 현황">
            {rows.map((row) => {
              const outstandingTasks = row.tasks.filter((task) => task.status !== "complete")
              const visibleOutstandingTasks = outstandingTasks.slice(0, 2)
              const hiddenOutstandingCount = outstandingTasks.length - visibleOutstandingTasks.length

              return (
              <li className="bg-card px-4 py-3.5" key={row.id}>
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
