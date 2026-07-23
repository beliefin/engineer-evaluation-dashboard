"use client"

import Link from "next/link"
import { useState } from "react"
import { CalendarCheck2, Clock3, FileCheck2, MapPin, UserRound } from "lucide-react"

import { EmptyState, PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCalendarDate } from "@/features/calendar"
import { useEvaluation } from "@/providers"
import { selectScheduledEvaluations } from "@/view-models/today-evaluations"

export function toLocalDateValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

const STATUS = {
  not_started: { label: "미작성", variant: "outline" as const },
  in_progress: { label: "작성 중", variant: "secondary" as const },
  submitted: { label: "제출 완료", variant: "default" as const },
}

export function TodayEvaluationsScreen() {
  const [date, setDate] = useState(() => toLocalDateValue(new Date()))
  const { snapshot, activeCycleId, activeEvaluatorId, backendMode } = useEvaluation()
  if (snapshot === null) return null

  const evaluations = selectScheduledEvaluations(snapshot, activeCycleId, activeEvaluatorId, date)

  return (
    <div className="space-y-6">
      <PageHeader
        actions={(
          <div className="grid min-w-48 gap-1.5">
            <Label htmlFor="today-evaluation-date">평가일</Label>
            <Input
              id="today-evaluation-date"
              onChange={(event) => setDate(event.currentTarget.value)}
              type="date"
              value={date}
            />
          </div>
        )}
        context={`평가자 작업 공간 · ${backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}`}
        description="날짜를 선택해 예정된 발표를 확인하고, 평가표를 바로 엽니다. 기본 날짜는 오늘입니다."
        title="오늘의 평가"
      />

      <section aria-labelledby="scheduled-evaluations-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold" id="scheduled-evaluations-title">
              {formatCalendarDate(date)} 평가 대상
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">시작 시간순으로 {evaluations.length}건</p>
          </div>
          <Badge variant="secondary">선택 날짜 {date}</Badge>
        </div>

        {evaluations.length === 0 ? (
          <EmptyState
            description="선택한 날짜에 본인에게 배정된 평가 일정이 없습니다. 전체 일정은 평가 일정 메뉴에서 확인할 수 있습니다."
            icon={CalendarCheck2}
            title="예정된 평가가 없습니다"
          />
        ) : (
          <ol className="grid gap-3 lg:grid-cols-2">
            {evaluations.map((evaluation) => {
              const status = STATUS[evaluation.status]
              return (
                <li className="border border-border bg-card p-4 sm:p-5" key={evaluation.eventId}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary">{evaluation.taskName}</p>
                      <h3 className="mt-1 text-lg font-semibold">{evaluation.engineerName}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{evaluation.team} · {evaluation.title}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <dl className="mt-4 grid gap-2 border-y border-border-subtle py-3 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Clock3 aria-hidden="true" className="size-4 text-muted-foreground" />
                      <dt className="sr-only">시작 시간</dt>
                      <dd>{evaluation.startTime ?? "시간 미정"}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserRound aria-hidden="true" className="size-4 text-muted-foreground" />
                      <dt className="sr-only">입력 진행</dt>
                      <dd>{evaluation.totalItems > 0
                        ? `${evaluation.completedItems}/${evaluation.totalItems}개 항목`
                        : "P/F 평가"}</dd>
                    </div>
                    {evaluation.note === null ? null : (
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <dt className="sr-only">일정 메모</dt>
                        <dd className="text-muted-foreground">{evaluation.note}</dd>
                      </div>
                    )}
                  </dl>

                  <Button asChild className="mt-4 w-full sm:w-auto">
                    <Link href={
                      `/evaluations/detail?assignmentId=${encodeURIComponent(evaluation.assignmentId)}` +
                      (evaluation.parallelAssignmentId === null
                        ? ""
                        : `&parallelAssignmentId=${encodeURIComponent(evaluation.parallelAssignmentId)}`)
                    }>
                      <FileCheck2 aria-hidden="true" />
                      {evaluation.status === "not_started" ? "평가 시작" : "평가표 열기"}
                    </Link>
                  </Button>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </div>
  )
}
