import { CalendarX2, Clock3, MapPin } from "lucide-react"

import { formatCalendarDate, groupCalendarEventsByDate } from "./calendar-helpers"
import type { CalendarEventView } from "./types"

type CalendarAgendaProps = Readonly<{
  events: readonly CalendarEventView[]
  readOnly: boolean
  onSelectEvent: (event: CalendarEventView) => void
}>

function AgendaEvent({
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm leading-snug font-semibold">{event.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{event.engineerName}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums">
          <Clock3 aria-hidden="true" className="size-3.5 text-primary" />
          {event.startTime ?? "시간 미정"}
        </span>
      </div>
      {event.note === null ? null : (
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{event.note}</span>
        </p>
      )}
    </>
  )

  if (readOnly) {
    return <div className="border-l-2 border-l-primary bg-accent/55 p-3">{content}</div>
  }
  return (
    <button
      aria-label={`${event.engineerName} ${event.title}, ${formatCalendarDate(event.date)} ${event.startTime ?? "시간 미정"}`}
      className="w-full border-l-2 border-l-primary bg-accent/55 p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onSelectEvent(event)}
      type="button"
    >
      {content}
    </button>
  )
}

export function CalendarAgenda({ events, readOnly, onSelectEvent }: CalendarAgendaProps) {
  const groups = groupCalendarEventsByDate(events)
  if (groups.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <CalendarX2 aria-hidden="true" className="size-5" />
        </span>
        <p className="mt-3 text-sm font-semibold">이달에 등록된 일정이 없습니다</p>
        <p className="mt-1 text-sm text-muted-foreground">새 일정을 추가하면 날짜순으로 표시됩니다.</p>
      </div>
    )
  }

  return (
    <ol className="grid gap-5">
      {groups.map((group) => (
        <li key={group.date}>
          <h3 className="mb-2 flex items-baseline justify-between gap-3">
            <time className="text-sm font-semibold" dateTime={group.date}>
              {formatCalendarDate(group.date)}
            </time>
            <span className="text-xs text-muted-foreground">{group.events.length}건</span>
          </h3>
          <div className="grid gap-2">
            {group.events.map((event) => (
              <AgendaEvent
                event={event}
                key={event.id}
                onSelectEvent={onSelectEvent}
                readOnly={readOnly}
              />
            ))}
          </div>
        </li>
      ))}
    </ol>
  )
}
