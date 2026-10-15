"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

import { CalendarAgenda } from "./calendar-agenda"
import "./calendar-signal.css"
import {
  buildMonthGrid,
  eventsInMonth,
  formatYearMonth,
  formatCalendarDate,
  shiftYearMonth,
  sortCalendarEvents,
  toLocalDateValue,
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
  const today = toLocalDateValue(new Date())
  const isCurrentMonth = today.startsWith(`${month}-`)
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
    <section aria-labelledby="evaluation-calendar-title" className="signal-calendar">
      <header className="signal-calendar-header">
        <div>
          <div className="signal-calendar-heading">
            <h1 id="evaluation-calendar-title">발표 일정</h1>
            {mode === "evaluate" ? <span className="signal-calendar-role">일정에서 평가 열기</span> : null}
            {mode === "read" ? <span className="signal-calendar-role">읽기 전용</span> : null}
          </div>
          <p>평가 발표일·장소·준비사항 월별 확인</p>
        </div>
        <div className="signal-calendar-header-actions">
          <p className="numeric">등록 일정 {agendaEvents.length}건</p>
          {canManage ? (
            <Button disabled={engineers.length === 0 || tasks.length === 0 || !canNavigate} onClick={() => setCreating(true)} type="button">
              <Plus aria-hidden="true" />
              일정 추가
            </Button>
          ) : null}
        </div>
      </header>

      <div className="signal-calendar-layout">
        <div className="signal-calendar-month">
          <div className="signal-calendar-month-toolbar">
            <Button
              aria-label="이전 달"
              disabled={!canNavigate}
              onClick={() => moveMonth(-1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <h2 aria-live="polite">{monthLabel}</h2>
            <Button
              aria-label="다음 달"
              disabled={!canNavigate}
              onClick={() => moveMonth(1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          {isCurrentMonth ? <p className="signal-calendar-today">오늘 {formatCalendarDate(today)}</p> : null}
          {canNavigate ? (
            <MonthGrid
              days={grid}
              events={gridEvents}
              mode={mode}
              onSelectEvent={selectEvent}
            />
          ) : (
            <div className="signal-calendar-error" role="alert">
              <p>월 정보를 불러올 수 없습니다.</p>
              <p>YYYY-MM 형식의 월을 다시 선택해 주세요.</p>
            </div>
          )}
        </div>
        {canNavigate ? (
          <aside aria-labelledby="calendar-agenda-title" className="signal-calendar-agenda">
            <h2 id="calendar-agenda-title">이달 일정</h2>
            <CalendarAgenda
              events={agendaEvents}
              mode={mode}
              onSelectEvent={selectEvent}
            />
          </aside>
        ) : null}
      </div>

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
