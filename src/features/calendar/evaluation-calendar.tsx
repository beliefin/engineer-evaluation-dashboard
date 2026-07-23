"use client"

import { useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { CalendarAgenda } from "./calendar-agenda"
import {
  buildMonthGrid,
  eventsInMonth,
  formatYearMonth,
  shiftYearMonth,
  sortCalendarEvents,
} from "./calendar-helpers"
import { DeleteEventDialog } from "./delete-event-dialog"
import { EventEditorDialog } from "./event-editor-dialog"
import { MonthGrid } from "./month-grid"
import type { CalendarEventView, EvaluationCalendarProps } from "./types"

export function EvaluationCalendar({
  month,
  events,
  engineers,
  tasks,
  mode,
  onMonthChange,
  onCreate,
  onUpdate,
  onDelete,
  onOpenEvaluation,
}: EvaluationCalendarProps) {
  const [creating, setCreating] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEventView | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<CalendarEventView | null>(null)
  const grid = buildMonthGrid(month)
  const gridEvents = sortCalendarEvents(events)
  const agendaEvents = sortCalendarEvents(eventsInMonth(events, month))
  const monthLabel = formatYearMonth(month)
  const canNavigate = grid.length > 0
  const canManage = mode === "manage"

  function selectEvent(event: CalendarEventView) {
    if (mode === "manage") {
      setEditingEvent(event)
      return
    }
    if (mode === "evaluate" && event.assignmentId !== null) {
      onOpenEvaluation(event.assignmentId, event.parallelAssignmentId)
    }
  }

  function moveMonth(offset: number) {
    const nextMonth = shiftYearMonth(month, offset)
    if (nextMonth !== null) onMonthChange(nextMonth)
  }

  function requestDelete(event: CalendarEventView) {
    setDeletingEvent(event)
  }

  function deleteEvent(eventId: string): boolean {
    const deleted = onDelete(eventId)
    if (deleted) setEditingEvent(null)
    return deleted
  }

  return (
    <section aria-labelledby="evaluation-calendar-title" className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-5 text-primary" />
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]" id="evaluation-calendar-title">
              발표 일정
            </h1>
            {mode === "evaluate" ? <Badge variant="secondary">일정에서 평가 열기</Badge> : null}
            {mode === "read" ? <Badge variant="secondary">읽기 전용</Badge> : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            평가 발표일과 장소, 준비사항을 월별로 확인합니다.
          </p>
        </div>
        {canManage ? (
          <Button disabled={engineers.length === 0 || tasks.length === 0 || !canNavigate} onClick={() => setCreating(true)} type="button">
            <Plus aria-hidden="true" />
            일정 추가
          </Button>
        ) : null}
      </header>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
        <Button
          aria-label="이전 달"
          disabled={!canNavigate}
          onClick={() => moveMonth(-1)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <div className="text-center">
          <h2 aria-live="polite" className="text-base font-semibold">{monthLabel}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">등록 일정 {agendaEvents.length}건</p>
        </div>
        <Button
          aria-label="다음 달"
          disabled={!canNavigate}
          onClick={() => moveMonth(1)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      {canNavigate ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <MonthGrid
            days={grid}
            events={gridEvents}
            mode={mode}
            onSelectEvent={selectEvent}
          />
          <aside aria-labelledby="calendar-agenda-title" className="rounded-lg border border-border bg-card p-4 md:p-5">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold" id="calendar-agenda-title">이달 일정</h2>
              <span className="text-xs text-muted-foreground">{monthLabel}</span>
            </div>
            <CalendarAgenda
              events={agendaEvents}
              mode={mode}
              onSelectEvent={selectEvent}
            />
          </aside>
        </div>
      ) : (
        <div className="rounded-lg border border-destructive/30 bg-danger-soft p-5" role="alert">
          <p className="font-semibold text-destructive">월 정보를 불러올 수 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">YYYY-MM 형식의 월을 다시 선택해 주세요.</p>
        </div>
      )}

      {creating && canManage ? (
        <EventEditorDialog
          engineers={engineers}
          event={null}
          month={month}
          tasks={tasks}
          onClose={() => setCreating(false)}
          onCreate={onCreate}
          onDeleteRequest={requestDelete}
          onUpdate={onUpdate}
        />
      ) : null}
      {editingEvent === null || !canManage ? null : (
        <EventEditorDialog
          engineers={engineers}
          event={editingEvent}
          month={month}
          tasks={tasks}
          onClose={() => setEditingEvent(null)}
          onCreate={onCreate}
          onDeleteRequest={requestDelete}
          onUpdate={onUpdate}
        />
      )}
      {deletingEvent === null ? null : (
        <DeleteEventDialog
          event={deletingEvent}
          onClose={() => setDeletingEvent(null)}
          onDelete={deleteEvent}
        />
      )}
    </section>
  )
}
