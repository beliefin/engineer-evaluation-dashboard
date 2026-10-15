import { formatCalendarDate, toLocalDateValue } from "./calendar-helpers"
import type { CalendarDay, CalendarEventView, CalendarInteractionMode } from "./types"

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const

type MonthGridProps = Readonly<{
  days: readonly CalendarDay[]
  events: readonly CalendarEventView[]
  mode: CalendarInteractionMode
  onSelectEvent: (event: CalendarEventView) => void
}>

function eventLabel(event: CalendarEventView): string {
  const time = event.startTime === null ? "시간 미정" : event.startTime
  return `${event.engineerName} ${event.title}, ${formatCalendarDate(event.date)} ${time}`
}

function CalendarEventChip({
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
      <span className="signal-calendar-chip-title">{event.title}</span>
      <span className="numeric">{event.startTime ?? "시간 미정"}</span>
      <span>{event.engineerName}</span>
    </>
  )

  const actionable = mode === "manage" || mode === "evaluate" && event.assignmentId !== null
  if (!actionable) {
    return <div className="signal-calendar-chip">{content}</div>
  }
  return (
    <button
      aria-label={eventLabel(event)}
      className="signal-calendar-chip"
      onClick={() => onSelectEvent(event)}
      type="button"
    >
      {content}
    </button>
  )
}

export function MonthGrid({ days, events, mode, onSelectEvent }: MonthGridProps) {
  const today = toLocalDateValue(new Date())
  const weeks = Array.from({ length: 6 }, (_, weekIndex) =>
    days.slice(weekIndex * 7, weekIndex * 7 + 7))
  const eventsByDate = new Map<string, CalendarEventView[]>()
  for (const event of events) {
    const dateEvents = eventsByDate.get(event.date)
    if (dateEvents === undefined) eventsByDate.set(event.date, [event])
    else dateEvents.push(event)
  }

  return (
    <div className="signal-calendar-grid">
      <table className="signal-calendar-table" aria-label="월간 발표 일정">
        <caption className="sr-only">일요일부터 토요일까지 6주간의 발표 일정. 이달의 모든 일정은 아래 이달 일정 목록에서 확인할 수 있습니다.</caption>
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th key={weekday} scope="col">
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.map((day) => day.date).join("|")}>
              {week.map((day) => {
                const dayEvents = eventsByDate.get(day.date) ?? []
                const isToday = day.date === today
                return (
                  <td
                    className={day.isCurrentMonth ? "signal-calendar-day" : "signal-calendar-day signal-calendar-day-outside"}
                    key={day.date}
                  >
                    <time
                      aria-current={isToday ? "date" : undefined}
                      className={isToday ? "signal-calendar-date signal-calendar-date-today" : "signal-calendar-date"}
                      dateTime={day.date}
                    >
                      {day.day}
                      {isToday ? <span className="sr-only">일, 오늘</span> : null}
                    </time>
                    {dayEvents.length > 0 ? (
                      <span aria-label={`${formatCalendarDate(day.date)} 일정 ${dayEvents.length}건`} className="signal-calendar-compact-count">{dayEvents.length}건</span>
                    ) : null}
                    <div className="signal-calendar-day-events">
                      {dayEvents.slice(0, 2).map((event) => (
                        <CalendarEventChip
                          event={event}
                          key={event.id}
                          onSelectEvent={onSelectEvent}
                          mode={mode}
                        />
                      ))}
                      {dayEvents.length > 2 ? (
                        <p className="signal-calendar-more">
                          일정 {dayEvents.length - 2}건 더 있음
                        </p>
                      ) : null}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
