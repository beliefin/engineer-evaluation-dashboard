"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  EvaluationCalendar,
  parseYearMonth,
  type CalendarEventView,
  type EvaluationCalendarCreateInput,
  type EvaluationCalendarInput,
} from "@/features/calendar"
import { useEvaluation } from "@/providers"

function collapseEvaluatorPresentationGroups(
  events: readonly CalendarEventView[],
): readonly CalendarEventView[] {
  const seenGroups = new Set<string>()
  return events.flatMap((event) => {
    const groupId = event.presentationGroupId
    if (groupId === null) return [event]
    if (seenGroups.has(groupId)) return []
    seenGroups.add(groupId)
    const evaluable = events.filter((candidate) =>
      candidate.presentationGroupId === groupId && candidate.assignmentId !== null,
    )
    const first = evaluable[0]
    const second = evaluable[1]
    if (first === undefined) return [event]
    if (second === undefined) return [first]
    return [{
      ...first,
      engineerName: `${first.engineerName} · ${second.engineerName}`,
      parallelAssignmentId: second.assignmentId,
    }]
  })
}

export function CalendarScreen() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    snapshot,
    activeCycleId,
    role,
    activeEvaluatorId,
    createScheduleEvents,
    updateScheduleEvent,
    deleteScheduleEvent,
  } = useEvaluation()
  if (snapshot === null) return null

  const cycle = snapshot.cycles.find((entry) => entry.id === activeCycleId)
  const tasks = snapshot.tasks.filter((task) =>
    task.cycleId === activeCycleId &&
    (task.method === "evaluator_score" || task.method === "evaluator_pass_fail"),
  )
  const baseEvents = snapshot.scheduleEvents
    .filter((event) => event.cycleId === activeCycleId)
    .flatMap((event) => {
      const engineer = snapshot.engineers.find((entry) => entry.id === event.engineerId)
      if (engineer === undefined) return []
      const task = event.taskId === null
        ? undefined
        : snapshot.tasks.find((entry) => entry.id === event.taskId)
      const assignment = event.taskId === null
        ? undefined
        : snapshot.assignments.find((entry) =>
          entry.cycleId === event.cycleId &&
          entry.engineerId === event.engineerId &&
          entry.taskId === event.taskId &&
          entry.evaluatorId === activeEvaluatorId,
        )
      return [{
        id: event.id,
        engineerId: engineer.id,
        engineerName: engineer.displayName,
        taskId: event.taskId,
        taskName: task?.name ?? null,
        assignmentId: assignment?.id ?? null,
        parallelAssignmentId: null,
        presentationGroupId: event.presentationGroupId ?? null,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        note: event.note,
      }]
    })
  const events = role === "evaluator"
    ? collapseEvaluatorPresentationGroups(baseEvents)
    : baseEvents
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

  function createEvent(input: EvaluationCalendarCreateInput): boolean {
    return createScheduleEvents(input)
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
        taskIds: [...new Set(snapshot.assignments
          .filter((assignment) =>
            assignment.cycleId === activeCycleId && assignment.engineerId === engineer.id)
          .map((assignment) => assignment.taskId))],
      }))}
      events={events}
      tasks={tasks.map((task) => ({ id: task.id, name: task.name }))}
      month={month}
      mode={role === "operator" ? "manage" : role === "evaluator" ? "evaluate" : "read"}
      onCreate={createEvent}
      onDelete={deleteScheduleEvent}
      onMonthChange={changeMonth}
      onUpdate={updateEvent}
      onOpenEvaluation={(assignmentId, parallelAssignmentId) => {
        const params = new URLSearchParams({ assignmentId })
        if (parallelAssignmentId !== null) params.set("parallelAssignmentId", parallelAssignmentId)
        router.push(`/evaluations/detail?${params.toString()}`)
      }}
    />
  )
}
