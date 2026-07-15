"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  EvaluationCalendar,
  parseYearMonth,
  type EvaluationCalendarInput,
} from "@/features/calendar"
import { useEvaluation } from "@/providers"

export function CalendarScreen() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    snapshot,
    activeCycleId,
    role,
    createScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
  } = useEvaluation()
  if (snapshot === null) return null

  const cycle = snapshot.cycles.find((entry) => entry.id === activeCycleId)
  const events = snapshot.scheduleEvents
    .filter((event) => event.cycleId === activeCycleId)
    .flatMap((event) => {
      const engineer = snapshot.engineers.find((entry) => entry.id === event.engineerId)
      if (engineer === undefined) return []
      return [{
        id: event.id,
        engineerId: engineer.id,
        engineerName: engineer.displayName,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        note: event.note,
      }]
    })
  const fallbackMonth =
    events[0]?.date.slice(0, 7) ?? cycle?.startsAt.slice(0, 7) ?? "2026-01"
  const requestedMonth = searchParams.get("month")
  const month =
    requestedMonth !== null && parseYearMonth(requestedMonth) !== null
      ? requestedMonth
      : fallbackMonth

  function changeMonth(nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextMonth === fallbackMonth) params.delete("month")
    else params.set("month", nextMonth)
    const query = params.toString()
    router.replace(query.length === 0 ? pathname : `${pathname}?${query}`, {
      scroll: false,
    })
  }

  function createEvent(input: EvaluationCalendarInput): boolean {
    return createScheduleEvent(input)
  }

  function updateEvent(eventId: string, input: EvaluationCalendarInput): boolean {
    return updateScheduleEvent(eventId, input)
  }

  return (
    <EvaluationCalendar
      engineers={snapshot.engineers.map((engineer) => ({
        id: engineer.id,
        displayName: engineer.displayName,
        team: engineer.team,
      }))}
      events={events}
      month={month}
      onCreate={createEvent}
      onDelete={deleteScheduleEvent}
      onMonthChange={changeMonth}
      onUpdate={updateEvent}
      readOnly={role === "approver"}
    />
  )
}
