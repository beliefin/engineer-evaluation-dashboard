import { describe, expect, it } from "vitest"

import {
  buildMonthGrid,
  groupCalendarEventsByDate,
  parseYearMonth,
  shiftYearMonth,
  sortCalendarEvents,
} from "./calendar-helpers"
import type { CalendarEventView } from "./types"

const EVENTS: readonly CalendarEventView[] = [
  {
    id: "event-3",
    engineerId: "engineer-3",
    engineerName: "박하늘",
    taskId: "task-1",
    taskName: "성장탐구",
    assignmentId: "assignment-3",
    title: "DX 발표",
    date: "2026-07-15",
    startTime: null,
    note: null,
  },
  {
    id: "event-2",
    engineerId: "engineer-2",
    engineerName: "이바다",
    taskId: "task-1",
    taskName: "성장탐구",
    assignmentId: "assignment-2",
    title: "성장탐구 발표",
    date: "2026-07-14",
    startTime: "13:30",
    note: null,
  },
  {
    id: "event-1",
    engineerId: "engineer-1",
    engineerName: "김새벽",
    taskId: "task-1",
    taskName: "성장탐구",
    assignmentId: "assignment-1",
    title: "성장탐구 발표",
    date: "2026-07-14",
    startTime: "09:00",
    note: "2층 회의실",
  },
]

describe("calendar helpers", () => {
  it("parses only canonical YYYY-MM values", () => {
    expect(parseYearMonth("2026-07")).toEqual({ year: 2026, month: 7 })
    expect(parseYearMonth("2026-7")).toBeNull()
    expect(parseYearMonth("2026-13")).toBeNull()
    expect(parseYearMonth("0999-12")).toBeNull()
  })

  it("builds a Sunday-first six-week grid without local timezone drift", () => {
    const grid = buildMonthGrid("2026-07")

    expect(grid).toHaveLength(42)
    expect(grid[0]).toEqual({ date: "2026-06-28", day: 28, isCurrentMonth: false })
    expect(grid[3]).toEqual({ date: "2026-07-01", day: 1, isCurrentMonth: true })
    expect(grid[41]).toEqual({ date: "2026-08-08", day: 8, isCurrentMonth: false })
    expect(buildMonthGrid("invalid")).toEqual([])
  })

  it("shifts across year boundaries", () => {
    expect(shiftYearMonth("2026-01", -1)).toBe("2025-12")
    expect(shiftYearMonth("2026-12", 1)).toBe("2027-01")
    expect(shiftYearMonth("invalid", 1)).toBeNull()
  })

  it("sorts by date, timed events first, and then title and id", () => {
    expect(sortCalendarEvents(EVENTS).map((event) => event.id)).toEqual([
      "event-1",
      "event-2",
      "event-3",
    ])
  })

  it("groups sorted events by date", () => {
    const groups = groupCalendarEventsByDate(EVENTS)

    expect(groups).toHaveLength(2)
    expect(groups[0]?.date).toBe("2026-07-14")
    expect(groups[0]?.events.map((event) => event.id)).toEqual(["event-1", "event-2"])
    expect(groups[1]?.date).toBe("2026-07-15")
  })
})
