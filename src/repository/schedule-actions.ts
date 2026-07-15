import type { EvaluationScheduleEvent, EvaluationSnapshot } from "@/domain"

import {
  createScheduleEventInputSchema,
  deleteScheduleEventInputSchema,
  parseRepositoryInput,
  updateScheduleEventInputSchema,
} from "./input-schemas"
import {
  appendAuditEvent,
  createEntityId,
  type MutationContext,
} from "./mutation-context"
import {
  requireCycleUnlocked,
  requireEngineer,
  requireOperator,
  requireScheduleEvent,
} from "./repository-helpers"
import type {
  CreateScheduleEventInput,
  DeleteScheduleEventInput,
  UpdateScheduleEventInput,
} from "./types"

export function createScheduleEventAction(
  context: MutationContext,
  input: CreateScheduleEventInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(createScheduleEventInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireEngineer(context.snapshot, parsed.engineerId)
  const event: EvaluationScheduleEvent = {
    id: createEntityId(context, "schedule"),
    cycleId: parsed.cycleId,
    engineerId: parsed.engineerId,
    title: parsed.title,
    date: parsed.date,
    startTime: parsed.startTime,
    note: parsed.note,
    createdAt: context.now,
    updatedAt: context.now,
  }
  return appendAuditEvent(
    context,
    { ...context.snapshot, scheduleEvents: [...context.snapshot.scheduleEvents, event] },
    {
      cycleId: parsed.cycleId,
      type: "schedule_event_created",
      actor: parsed.actor,
      targetId: event.id,
    },
  )
}

export function updateScheduleEventAction(
  context: MutationContext,
  input: UpdateScheduleEventInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(updateScheduleEventInputSchema, input)
  requireOperator(parsed.actor)
  const event = requireScheduleEvent(context.snapshot, parsed.eventId)
  requireCycleUnlocked(context.snapshot, event.cycleId)
  requireEngineer(context.snapshot, parsed.engineerId)
  const nextEvent: EvaluationScheduleEvent = {
    ...event,
    engineerId: parsed.engineerId,
    title: parsed.title,
    date: parsed.date,
    startTime: parsed.startTime,
    note: parsed.note,
    updatedAt: context.now,
  }
  return appendAuditEvent(
    context,
    {
      ...context.snapshot,
      scheduleEvents: context.snapshot.scheduleEvents.map((candidate) =>
        candidate.id === event.id ? nextEvent : candidate,
      ),
    },
    {
      cycleId: event.cycleId,
      type: "schedule_event_updated",
      actor: parsed.actor,
      targetId: event.id,
    },
  )
}

export function deleteScheduleEventAction(
  context: MutationContext,
  input: DeleteScheduleEventInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(deleteScheduleEventInputSchema, input)
  requireOperator(parsed.actor)
  const event = requireScheduleEvent(context.snapshot, parsed.eventId)
  requireCycleUnlocked(context.snapshot, event.cycleId)
  return appendAuditEvent(
    context,
    {
      ...context.snapshot,
      scheduleEvents: context.snapshot.scheduleEvents.filter(
        (candidate) => candidate.id !== event.id,
      ),
    },
    {
      cycleId: event.cycleId,
      type: "schedule_event_deleted",
      actor: parsed.actor,
      targetId: event.id,
    },
  )
}
