import { CalendarX2 } from "lucide-react"

import {
  formatCalendarDate,
  groupCalendarEventsByDate,
  toLocalDateValue,
} from "./calendar-helpers"
import type { CalendarEventView, CalendarInteractionMode } from "./types"

type CalendarAgendaProps = Readonly<{
  events: readonly CalendarEventView[]
  mode: CalendarInteractionMode
  onSelectEvent: (event: CalendarEventView) => void
}>

function AgendaEvent({
  event,
  mode,
  onSelectEvent,
}: Readonly<{
  event: CalendarEventView
  mode: CalendarInteractionMode
  onSelectEvent: (event: CalendarEventView) => void
}>) {
  const content = (
    <>
      <p className="signal-calendar-agenda-title break-words">{event.title}</p>
      <p className="signal-calendar-agenda-engineer">{event.engineerName}</p>
      <p className="numeric signal-calendar-agenda-time">{event.startTime ?? "시간 미정"}</p>
      {event.note === null ? null : <p className="signal-calendar-agenda-note">{event.note}</p>}
    </>
  )

  const actionable = mode === "manage" || mode === "evaluate" && event.assignmentId !== null
  if (!actionable) {
    return <div className="signal-calendar-agenda-event">{content}</div>
  }
  return (
    <button
      aria-label={`${event.engineerName} ${event.title}, ${formatCalendarDate(event.date)} ${event.startTime ?? "시간 미정"}`}
      className="signal-calendar-agenda-event"
      onClick={() => onSelectEvent(event)}
      type="button"
    >
      {content}
    </button>
  )
}

export function CalendarAgenda({ events, mode, onSelectEvent }: CalendarAgendaProps) {
  const groups = groupCalendarEventsByDate(events)
  const today = toLocalDateValue(new Date())
  if (groups.length === 0) {
    return (
      <div className="signal-calendar-empty">
        <span className="signal-calendar-empty-icon">
          <CalendarX2 aria-hidden="true" className="size-5" />
        </span>
        <p className="signal-calendar-empty-title">이달에 등록된 일정이 없습니다</p>
        <p>{mode === "manage" ? "새 일정을 추가하면 날짜순으로 표시됩니다." : "등록된 일정이 있으면 날짜순으로 표시됩니다."}</p>
      </div>
    )
  }

  return (
    <ol className="signal-calendar-agenda-groups">
      {groups.map((group) => {
        const isToday = group.date === today
        return (
          <li key={group.date} id={`calendar-date-${group.date}`}>
            <h3 className="signal-calendar-agenda-date">
              <time
                aria-current={isToday ? "date" : undefined}
                dateTime={group.date}
              >
                {formatCalendarDate(group.date)}
              </time>
              <span className="signal-calendar-agenda-count">
                {isToday ? (
                  <span className="signal-calendar-today-label">오늘</span>
                ) : null}
                {group.events.length}건
              </span>
            </h3>
            <div className="signal-calendar-agenda-events">
              {group.events.map((event) => (
                <AgendaEvent
                  event={event}
                  key={event.id}
                  onSelectEvent={onSelectEvent}
                  mode={mode}
                />
              ))}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
