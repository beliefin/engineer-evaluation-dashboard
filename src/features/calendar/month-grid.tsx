import { Clock3 } from "lucide-react"

import { formatCalendarDate } from "./calendar-helpers"
import type { CalendarDay, CalendarEventView } from "./types"

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const

type MonthGridProps = Readonly<{
  days: readonly CalendarDay[]
  events: readonly CalendarEventView[]
  readOnly: boolean
  onSelectEvent: (event: CalendarEventView) => void
}>

function eventLabel(event: CalendarEventView): string {
  const time = event.startTime === null ? "시간 미정" : event.startTime
  return `${event.engineerName} ${event.title}, ${formatCalendarDate(event.date)} ${time}`
}

function CalendarEventChip({
  event,
  readOnly,
  onSelectEvent,
}: Readonly<{
  event: CalendarEventView
  readOnly: boolean
  onSelectEvent: (event: CalendarEventView) => void
}>) {
  const content = (
    <>
      <span className="block truncate font-semibold">{event.title}</span>
      <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
        <Clock3 aria-hidden="true" className="size-3" />
        {event.startTime ?? "시간 미정"} · {event.engineerName}
      </span>
    </>
  )

  if (readOnly) {
    return <div className="rounded-md border-l-2 border-l-primary bg-accent px-2 py-1.5">{content}</div>
  }
  return (
    <button
      aria-label={eventLabel(event)}
      className="w-full rounded-md border-l-2 border-l-primary bg-accent px-2 py-1.5 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onSelectEvent(event)}
      type="button"
    >
      {content}
    </button>
  )
}

export function MonthGrid({ days, events, readOnly, onSelectEvent }: MonthGridProps) {
  const eventsByDate = new Map<string, CalendarEventView[]>()
  for (const event of events) {
    const dateEvents = eventsByDate.get(event.date)
    if (dateEvents === undefined) eventsByDate.set(event.date, [event])
    else dateEvents.push(event)
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <table className="w-full table-fixed border-collapse" aria-label="월간 발표 일정">
        <thead>
          <tr className="bg-muted/60">
            {WEEKDAYS.map((weekday) => (
              <th className="border-b border-border px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground" key={weekday} scope="col">
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, weekIndex) => (
            <tr key={`week-${weekIndex}`}>
              {days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => {
                const dayEvents = eventsByDate.get(day.date) ?? []
                return (
                  <td
                    className="h-28 border-r border-b border-border-subtle p-2 align-top last:border-r-0"
                    key={day.date}
                  >
                    <time
                      className={day.isCurrentMonth ? "text-xs font-semibold" : "text-xs text-muted-foreground"}
                      dateTime={day.date}
                    >
                      {day.day}
                    </time>
                    <div className="mt-1.5 grid gap-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <CalendarEventChip
                          event={event}
                          key={event.id}
                          onSelectEvent={onSelectEvent}
                          readOnly={readOnly}
                        />
                      ))}
                      {dayEvents.length > 2 ? (
                        <p className="px-1 text-xs font-medium text-muted-foreground">
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
