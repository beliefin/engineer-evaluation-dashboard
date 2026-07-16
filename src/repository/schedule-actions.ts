import type { EvaluationScheduleEvent, EvaluationSnapshot } from "@/domain"

import {
  createScheduleEventInputSchema,
  createScheduleEventsInputSchema,
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
  requireTask,
} from "./repository-helpers"
import type {
  CreateScheduleEventInput,
  CreateScheduleEventsInput,
  DeleteScheduleEventInput,
  UpdateScheduleEventInput,
} from "./types"
import { RepositoryError } from "./types"

function requireLinkedEvaluation(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  engineerId: string,
  taskId: string,
): void {
  const task = requireTask(snapshot, taskId)
  if (task.cycleId !== cycleId) {
    throw new RepositoryError("INVALID_INPUT", "평가 과제가 현재 평가 시즌에 속하지 않습니다.")
  }
  if (task.method !== "evaluator_score" && task.method !== "evaluator_pass_fail") {
    throw new RepositoryError("INVALID_INPUT", "발표 일정은 평가자가 입력하는 과제에만 연결할 수 있습니다.")
  }
  requireEngineer(snapshot, engineerId)
  const assigned = snapshot.assignments.some((assignment) =>
    assignment.cycleId === cycleId &&
    assignment.engineerId === engineerId &&
    assignment.taskId === taskId,
  )
  if (!assigned) {
    throw new RepositoryError("INVALID_INPUT", "선택한 엔지니어에게 이 과제의 평가자를 먼저 배정해 주세요.")
  }
}

export function createScheduleEventAction(
  context: MutationContext,
  input: CreateScheduleEventInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(createScheduleEventInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireLinkedEvaluation(context.snapshot, parsed.cycleId, parsed.engineerId, parsed.taskId)
  const event: EvaluationScheduleEvent = {
    id: createEntityId(context, "schedule"),
    cycleId: parsed.cycleId,
    engineerId: parsed.engineerId,
    taskId: parsed.taskId,
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

export function createScheduleEventsAction(
  context: MutationContext,
  input: CreateScheduleEventsInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(createScheduleEventsInputSchema, input)
  requireOperator(parsed.actor)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  parsed.engineerIds.forEach((engineerId) => {
    requireLinkedEvaluation(context.snapshot, parsed.cycleId, engineerId, parsed.taskId)
  })

  return parsed.engineerIds.reduce<EvaluationSnapshot>((snapshot, engineerId) =>
    createScheduleEventAction(
      { ...context, snapshot },
      {
        cycleId: parsed.cycleId,
        engineerId,
        taskId: parsed.taskId,
        title: parsed.title,
        date: parsed.date,
        startTime: parsed.startTime,
        note: parsed.note,
        actor: parsed.actor,
      },
    ), context.snapshot)
}

export function updateScheduleEventAction(
  context: MutationContext,
  input: UpdateScheduleEventInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(updateScheduleEventInputSchema, input)
  requireOperator(parsed.actor)
  const event = requireScheduleEvent(context.snapshot, parsed.eventId)
  requireCycleUnlocked(context.snapshot, event.cycleId)
  requireLinkedEvaluation(context.snapshot, event.cycleId, parsed.engineerId, parsed.taskId)
  const nextEvent: EvaluationScheduleEvent = {
    ...event,
    engineerId: parsed.engineerId,
    taskId: parsed.taskId,
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
