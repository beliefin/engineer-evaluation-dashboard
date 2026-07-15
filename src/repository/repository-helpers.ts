import type {
  AuditEvent,
  Engineer,
  EvaluationCycle,
  EvaluationScheduleEvent,
  EvaluationSnapshot,
  EvaluationTask,
  EvaluatorAssignment,
  Role,
  ScoreEntry,
  ScoreSheet,
} from "@/domain"

import { RepositoryError, type RepositoryActor } from "./types"

export function requireOperator(actor: RepositoryActor): void {
  switch (actor.role) {
    case "operator":
      return
    case "evaluator":
    case "approver":
    case "engineer":
      throw new RepositoryError("FORBIDDEN", "this action requires the operator role")
    default:
      return assertNeverRole(actor.role)
  }
}

function assertNeverRole(role: never): never {
  throw new RepositoryError("INVALID_INPUT", `unsupported role: ${String(role)}`)
}

export function requireSheet(snapshot: EvaluationSnapshot, sheetId: string): ScoreSheet {
  const sheet = snapshot.scoreSheets.find((candidate) => candidate.id === sheetId)
  if (sheet === undefined) {
    throw new RepositoryError("NOT_FOUND", `score sheet ${sheetId} was not found`)
  }
  return sheet
}

export function requireAssignment(
  snapshot: EvaluationSnapshot,
  assignmentId: string,
): EvaluatorAssignment {
  const assignment = snapshot.assignments.find((candidate) => candidate.id === assignmentId)
  if (assignment === undefined) {
    throw new RepositoryError("NOT_FOUND", `assignment ${assignmentId} was not found`)
  }
  return assignment
}

export function requireSheetActor(
  actor: RepositoryActor,
  assignment: EvaluatorAssignment,
): void {
  switch (actor.role) {
    case "operator":
      return
    case "evaluator":
      if (actor.id === assignment.evaluatorId) return
      throw new RepositoryError("FORBIDDEN", "evaluators may edit only their own score sheets")
    case "approver":
      throw new RepositoryError("FORBIDDEN", "approvers cannot edit score sheets")
    case "engineer":
      throw new RepositoryError("FORBIDDEN", "engineers cannot edit score sheets")
    default:
      return assertNeverRole(actor.role)
  }
}

export function requireSourceRecordActor(
  actor: RepositoryActor,
  engineerId: string,
): void {
  switch (actor.role) {
    case "operator":
      return
    case "engineer":
      if (actor.id === engineerId) return
      throw new RepositoryError("FORBIDDEN", "engineers may edit only their own source records")
    case "evaluator":
    case "approver":
      throw new RepositoryError("FORBIDDEN", "source records require operator or owner access")
    default:
      return assertNeverRole(actor.role)
  }
}

export function requireCycle(snapshot: EvaluationSnapshot, cycleId: string): EvaluationCycle {
  const cycle = snapshot.cycles.find((candidate) => candidate.id === cycleId)
  if (cycle === undefined) {
    throw new RepositoryError("NOT_FOUND", `평가 시즌 ${cycleId}을 찾을 수 없습니다.`)
  }
  return cycle
}

export function requireCycleUnlocked(snapshot: EvaluationSnapshot, cycleId: string): EvaluationCycle {
  const cycle = requireCycle(snapshot, cycleId)
  if (cycle.locked) {
    throw new RepositoryError("TASK_LOCKED", "잠긴 평가 시즌에서는 평가 데이터와 설정을 변경할 수 없습니다.")
  }
  return cycle
}

export function requireTask(snapshot: EvaluationSnapshot, taskId: string): EvaluationTask {
  const task = snapshot.tasks.find((candidate) => candidate.id === taskId)
  if (task === undefined) {
    throw new RepositoryError("NOT_FOUND", `과제 ${taskId}를 찾을 수 없습니다.`)
  }
  return task
}

export function requireEngineer(snapshot: EvaluationSnapshot, engineerId: string): Engineer {
  const engineer = snapshot.engineers.find((candidate) => candidate.id === engineerId)
  if (engineer === undefined) {
    throw new RepositoryError("NOT_FOUND", `engineer ${engineerId} was not found`)
  }
  return engineer
}

export function requireScheduleEvent(
  snapshot: EvaluationSnapshot,
  eventId: string,
): EvaluationScheduleEvent {
  const event = snapshot.scheduleEvents.find((candidate) => candidate.id === eventId)
  if (event === undefined) {
    throw new RepositoryError("NOT_FOUND", `schedule event ${eventId} was not found`)
  }
  return event
}

export function validateSheetResponse(
  snapshot: EvaluationSnapshot,
  assignment: EvaluatorAssignment,
  scores: ReadonlyArray<ScoreEntry>,
  passResult: boolean | null,
): void {
  const task = requireTask(snapshot, assignment.taskId)
  if (task.method === "evaluator_score") {
    const expectedIds = new Set(task.items.map((item) => item.id))
    const receivedIds = new Set(scores.map((score) => score.itemId))
    const matches = receivedIds.size === expectedIds.size &&
      [...receivedIds].every((itemId) => expectedIds.has(itemId))
    if (!matches || passResult !== null) {
      throw new RepositoryError("INVALID_INPUT", "입력 점수가 현재 과제 평가 항목과 일치하지 않습니다.")
    }
    return
  }
  if (task.method === "evaluator_pass_fail") {
    if (scores.length > 0) {
      throw new RepositoryError("INVALID_INPUT", "P/F 과제에는 항목 점수를 입력할 수 없습니다.")
    }
    return
  }
  throw new RepositoryError("INVALID_INPUT", "평가자 입력 과제가 아닙니다.")
}

type AuditInput = Readonly<{
  id: string
  cycleId: string
  type: AuditEvent["type"]
  actor: Readonly<{ id: string; role: Role }>
  targetId: string
  reason: string | null
  createdAt: string
}>

export function createAuditEvent(input: AuditInput): AuditEvent {
  return {
    id: input.id,
    cycleId: input.cycleId,
    type: input.type,
    actorId: input.actor.id,
    actorRole: input.actor.role,
    targetId: input.targetId,
    reason: input.reason,
    createdAt: input.createdAt,
  }
}
