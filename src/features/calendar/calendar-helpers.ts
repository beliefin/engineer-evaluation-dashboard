import type {
  CalendarDay,
  CalendarEventGroup,
  CalendarEventView,
} from "./types"

export type YearMonth = Readonly<{
  year: number
  month: number
}>

const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/
const DATE_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

function formatUtcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function parseYearMonth(value: string): YearMonth | null {
  const match = YEAR_MONTH_PATTERN.exec(value)
  const yearText = match?.[1]
  const monthText = match?.[2]
  if (yearText === undefined || monthText === undefined) {
    return null
  }

  const year = Number(yearText)
  if (year < 1000 || year > 9999) {
    return null
  }
  return { year, month: Number(monthText) }
}

export function isCanonicalDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value)
  const yearText = match?.[1]
  const monthText = match?.[2]
  const dayText = match?.[3]
  if (yearText === undefined || monthText === undefined || dayText === undefined) {
    return false
  }

  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (year < 1000 || year > 9999) {
    return false
  }
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function buildMonthGrid(value: string): readonly CalendarDay[] {
  const parsed = parseYearMonth(value)
  if (parsed === null) {
    return []
  }

  const firstDay = new Date(Date.UTC(parsed.year, parsed.month - 1, 1))
  const gridStart = Date.UTC(parsed.year, parsed.month - 1, 1 - firstDay.getUTCDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart + index * 86_400_000)
    return {
      date: formatUtcDate(date),
      day: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === parsed.month - 1,
    }
  })
}

export function shiftYearMonth(value: string, offset: number): string | null {
  const parsed = parseYearMonth(value)
  if (parsed === null) {
    return null
  }
  const shifted = new Date(Date.UTC(parsed.year, parsed.month - 1 + offset, 1))
  if (shifted.getUTCFullYear() < 1000 || shifted.getUTCFullYear() > 9999) {
    return null
  }
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}`
}

export function formatYearMonth(value: string): string {
  const parsed = parseYearMonth(value)
  return parsed === null ? "유효하지 않은 월" : `${parsed.year}년 ${parsed.month}월`
}

export function formatCalendarDate(value: string): string {
  if (!isCanonicalDate(value)) {
    return value
  }
  const parts = value.split("-").map(Number)
  const year = parts[0]
  const month = parts[1]
  const day = parts[2]
  if (year === undefined || month === undefined || day === undefined) {
    return value
  }
  const weekday = WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${month}월 ${day}일 (${weekday ?? ""})`
}

export function sortCalendarEvents(
  events: readonly CalendarEventView[],
): readonly CalendarEventView[] {
  return [...events].sort((left, right) => {
    const dateOrder = left.date.localeCompare(right.date)
    if (dateOrder !== 0) return dateOrder
    const timeOrder = (left.startTime ?? "99:99").localeCompare(right.startTime ?? "99:99")
    if (timeOrder !== 0) return timeOrder
    const titleOrder = left.title.localeCompare(right.title, "ko-KR")
    return titleOrder !== 0 ? titleOrder : left.id.localeCompare(right.id)
  })
}

export function groupCalendarEventsByDate(
  events: readonly CalendarEventView[],
): readonly CalendarEventGroup[] {
  const groups = new Map<string, CalendarEventView[]>()
  for (const event of sortCalendarEvents(events)) {
    const group = groups.get(event.date)
    if (group === undefined) {
      groups.set(event.date, [event])
    } else {
      group.push(event)
    }
  }
  return [...groups].map(([date, groupedEvents]) => ({ date, events: groupedEvents }))
}

export function eventsInMonth(
  events: readonly CalendarEventView[],
  month: string,
): readonly CalendarEventView[] {
  if (parseYearMonth(month) === null) {
    return []
  }
  return events.filter((event) => event.date.startsWith(`${month}-`))
}
