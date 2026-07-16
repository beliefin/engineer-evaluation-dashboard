import { ApiError } from "./api-error.ts"
import type { EvaluationRequest } from "./request-schema.ts"
import type { Profile, ScoreSheet, Snapshot, Task } from "./model.ts"

type SheetRequest = Extract<EvaluationRequest, { operation: "save_draft" | "submit_sheet" }>
type UnlockRequest = Extract<EvaluationRequest, { operation: "request_sheet_unlock" }>
type SourceRequest = Extract<EvaluationRequest, {
  operation: "save_language_record" | "delete_language_record" |
    "save_certification_record" | "delete_certification_record"
}>
type ScoreAdjustmentRequest = Extract<EvaluationRequest, {
  operation: "save_score_adjustment" | "delete_score_adjustment"
}>
type ScheduleRequest = Extract<EvaluationRequest, {
  operation: "create_schedule_events" | "update_schedule_event" | "delete_schedule_event"
}>

function audit(snapshot: Snapshot, profile: Profile, type: string, cycleId: string, targetId: string): Snapshot["auditEvents"][number] {
  return {
    id: crypto.randomUUID(), cycleId, type, actorId: profile.auth_user_id,
    actorRole: profile.role, targetId, reason: null, createdAt: new Date().toISOString(),
  }
}

function requireUnlockedCycle(snapshot: Snapshot, cycleId: string): void {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) {
    throw new ApiError(404, "NOT_FOUND", "evaluation cycle not found")
  }
  if (cycle.locked) {
    throw new ApiError(409, "TASK_LOCKED", "locked evaluation cycles cannot accept score changes")
  }
}

export function mergeOperatorSnapshot(current: Snapshot, requested: Snapshot): Snapshot {
  return { ...requested, scoreAdjustments: current.scoreAdjustments }
}

export function mutateScoreAdjustment(
  snapshot: Snapshot,
  profile: Profile,
  request: ScoreAdjustmentRequest,
): Snapshot {
  if (profile.role !== "operator") {
    throw new ApiError(403, "FORBIDDEN", "운영자 권한이 필요합니다.")
  }
  if (request.operation === "delete_score_adjustment") {
    const existing = snapshot.scoreAdjustments.find((entry) => entry.id === request.adjustmentId)
    if (existing === undefined) {
      throw new ApiError(404, "NOT_FOUND", "삭제할 가·감점 내역을 찾을 수 없습니다.")
    }
    requireUnlockedCycle(snapshot, existing.cycleId)
    return {
      ...snapshot,
      scoreAdjustments: snapshot.scoreAdjustments.filter((entry) => entry.id !== existing.id),
      auditEvents: [...snapshot.auditEvents, {
        id: crypto.randomUUID(), cycleId: existing.cycleId, type: "score_adjustment_deleted",
        actorId: profile.auth_user_id, actorRole: profile.role, targetId: existing.id,
        reason: existing.reason, createdAt: new Date().toISOString(),
      }],
    }
  }

  requireUnlockedCycle(snapshot, request.adjustment.cycleId)
  if (!snapshot.engineers.some((entry) => entry.id === request.adjustment.engineerId)) {
    throw new ApiError(404, "NOT_FOUND", "평가 대상을 찾을 수 없습니다.")
  }
  const existing = request.adjustment.adjustmentId === null
    ? undefined
    : snapshot.scoreAdjustments.find((entry) => entry.id === request.adjustment.adjustmentId)
  if (request.adjustment.adjustmentId !== null && existing === undefined) {
    throw new ApiError(404, "NOT_FOUND", "수정할 가·감점 내역을 찾을 수 없습니다.")
  }
  if (existing !== undefined && (
    existing.cycleId !== request.adjustment.cycleId ||
    existing.engineerId !== request.adjustment.engineerId
  )) {
    throw new ApiError(400, "INVALID_INPUT", "가·감점 대상과 평가 시즌이 일치하지 않습니다.")
  }
  const now = new Date().toISOString()
  const adjustment = {
    id: existing?.id ?? crypto.randomUUID(),
    cycleId: request.adjustment.cycleId,
    engineerId: request.adjustment.engineerId,
    amount: request.adjustment.amount,
    reason: request.adjustment.reason,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  return {
    ...snapshot,
    scoreAdjustments: existing === undefined
      ? [...snapshot.scoreAdjustments, adjustment]
      : snapshot.scoreAdjustments.map((entry) => entry.id === existing.id ? adjustment : entry),
    auditEvents: [...snapshot.auditEvents, {
      id: crypto.randomUUID(), cycleId: adjustment.cycleId, type: "score_adjustment_saved",
      actorId: profile.auth_user_id, actorRole: profile.role, targetId: adjustment.id,
      reason: adjustment.reason, createdAt: now,
    }],
  }
}

function validateSheet(task: Task, request: SheetRequest): void {
  if (task.method === "evaluator_pass_fail") {
    if (request.scores.length > 0) throw new ApiError(400, "INVALID_INPUT", "P/F 평가는 점수 항목을 받지 않습니다.")
    if (request.operation === "submit_sheet" && request.passResult === null) {
      throw new ApiError(400, "INCOMPLETE_SHEET", "P/F 결과를 선택해 주세요.")
    }
    return
  }
  if (task.method !== "evaluator_score") throw new ApiError(403, "FORBIDDEN", "평가자 과제가 아닙니다.")
  const expected = new Set(task.items.map((item) => item.id))
  if (request.scores.length !== expected.size || request.scores.some((entry) => !expected.has(entry.itemId))) {
    throw new ApiError(400, "INVALID_INPUT", "평가 항목 구성이 일치하지 않습니다.")
  }
  if (request.operation === "submit_sheet" && request.scores.some((entry) => entry.score === null)) {
    throw new ApiError(400, "INCOMPLETE_SHEET", "모든 평가 항목을 입력해 주세요.")
  }
}

export function mutateSheet(snapshot: Snapshot, profile: Profile, request: SheetRequest): Snapshot {
  if (profile.role !== "operator" && (profile.role !== "evaluator" || profile.evaluator_id === null)) {
    throw new ApiError(403, "FORBIDDEN", "평가자 또는 운영자 권한이 필요합니다.")
  }
  const sheet = snapshot.scoreSheets.find((entry) => entry.id === request.sheetId)
  if (sheet === undefined) throw new ApiError(404, "NOT_FOUND", "평가지를 찾을 수 없습니다.")
  if (sheet.status === "submitted" && profile.role !== "operator") {
    throw new ApiError(409, "SHEET_LOCKED", "제출한 평가지는 수정할 수 없습니다.")
  }
  const assignment = snapshot.assignments.find((entry) => entry.id === sheet.assignmentId)
  if (assignment === undefined) throw new ApiError(404, "NOT_FOUND", "평가 배정을 찾을 수 없습니다.")
  if (profile.role === "evaluator" && assignment.evaluatorId !== profile.evaluator_id) {
    throw new ApiError(403, "FORBIDDEN", "배정된 평가지만 수정할 수 있습니다.")
  }
  requireUnlockedCycle(snapshot, assignment.cycleId)
  const task = snapshot.tasks.find((entry) => entry.id === assignment.taskId)
  if (task === undefined) throw new ApiError(404, "NOT_FOUND", "평가 과제를 찾을 수 없습니다.")
  validateSheet(task, request)
  const now = new Date().toISOString()
  const submitted = request.operation === "submit_sheet" || sheet.status === "submitted"
  const nextSheet: ScoreSheet = {
    ...sheet, scores: request.scores, passResult: request.passResult,
    status: submitted ? "submitted" : "draft", updatedAt: now,
    submittedAt: request.operation === "submit_sheet" ? (sheet.submittedAt ?? now) : sheet.submittedAt,
  }
  return {
    ...snapshot,
    scoreSheets: snapshot.scoreSheets.map((entry) => entry.id === sheet.id ? nextSheet : entry),
    auditEvents: submitted
      ? [...snapshot.auditEvents, audit(snapshot, profile, "sheet_submitted", assignment.cycleId, sheet.id)]
      : snapshot.auditEvents,
  }
}

function requireScheduleLink(
  snapshot: Snapshot,
  cycleId: string,
  engineerId: string,
  taskId: string,
): void {
  const task = snapshot.tasks.find((entry) => entry.id === taskId)
  if (task === undefined || task.cycleId !== cycleId) {
    throw new ApiError(404, "NOT_FOUND", "평가 과제를 찾을 수 없습니다.")
  }
  if (task.method !== "evaluator_score" && task.method !== "evaluator_pass_fail") {
    throw new ApiError(400, "INVALID_INPUT", "평가자 입력 과제만 발표 일정에 연결할 수 있습니다.")
  }
  if (!snapshot.engineers.some((entry) => entry.id === engineerId)) {
    throw new ApiError(404, "NOT_FOUND", "평가 대상을 찾을 수 없습니다.")
  }
  if (!snapshot.assignments.some((entry) =>
    entry.cycleId === cycleId && entry.engineerId === engineerId && entry.taskId === taskId)) {
    throw new ApiError(400, "INVALID_INPUT", "평가자를 배정한 엔지니어와 과제만 일정에 등록할 수 있습니다.")
  }
}

export function mutateSchedule(snapshot: Snapshot, profile: Profile, request: ScheduleRequest): Snapshot {
  if (profile.role !== "operator") {
    throw new ApiError(403, "FORBIDDEN", "운영자 권한이 필요합니다.")
  }
  const now = new Date().toISOString()
  if (request.operation === "delete_schedule_event") {
    const existing = snapshot.scheduleEvents.find((entry) => entry.id === request.eventId)
    if (existing === undefined) throw new ApiError(404, "NOT_FOUND", "평가 일정을 찾을 수 없습니다.")
    requireUnlockedCycle(snapshot, existing.cycleId)
    return {
      ...snapshot,
      scheduleEvents: snapshot.scheduleEvents.filter((entry) => entry.id !== existing.id),
      auditEvents: [...snapshot.auditEvents, audit(snapshot, profile, "schedule_event_deleted", existing.cycleId, existing.id)],
    }
  }
  if (request.operation === "update_schedule_event") {
    const existing = snapshot.scheduleEvents.find((entry) => entry.id === request.eventId)
    if (existing === undefined) throw new ApiError(404, "NOT_FOUND", "평가 일정을 찾을 수 없습니다.")
    requireUnlockedCycle(snapshot, existing.cycleId)
    requireScheduleLink(snapshot, existing.cycleId, request.engineerId, request.taskId)
    const updated = {
      ...existing, engineerId: request.engineerId, taskId: request.taskId,
      title: request.title, date: request.date, startTime: request.startTime,
      note: request.note, updatedAt: now,
    }
    return {
      ...snapshot,
      scheduleEvents: snapshot.scheduleEvents.map((entry) => entry.id === existing.id ? updated : entry),
      auditEvents: [...snapshot.auditEvents, audit(snapshot, profile, "schedule_event_updated", existing.cycleId, existing.id)],
    }
  }
  requireUnlockedCycle(snapshot, request.cycleId)
  request.engineerIds.forEach((engineerId) => {
    requireScheduleLink(snapshot, request.cycleId, engineerId, request.taskId)
  })
  const events = request.engineerIds.map((engineerId) => ({
    id: crypto.randomUUID(), cycleId: request.cycleId, engineerId, taskId: request.taskId,
    title: request.title, date: request.date, startTime: request.startTime,
    note: request.note, createdAt: now, updatedAt: now,
  }))
  return {
    ...snapshot,
    scheduleEvents: [...snapshot.scheduleEvents, ...events],
    auditEvents: [
      ...snapshot.auditEvents,
      ...events.map((event) => audit(snapshot, profile, "schedule_event_created", request.cycleId, event.id)),
    ],
  }
}

export function mutateUnlockRequest(
  snapshot: Snapshot,
  profile: Profile,
  request: UnlockRequest,
): Snapshot {
  if (profile.role !== "evaluator" || profile.evaluator_id === null) {
    throw new ApiError(403, "FORBIDDEN", "평가자 권한이 필요합니다.")
  }
  const sheet = snapshot.scoreSheets.find((entry) => entry.id === request.sheetId)
  if (sheet === undefined) throw new ApiError(404, "NOT_FOUND", "평가지를 찾을 수 없습니다.")
  const assignment = snapshot.assignments.find((entry) => entry.id === sheet.assignmentId)
  if (assignment === undefined || assignment.evaluatorId !== profile.evaluator_id) {
    throw new ApiError(403, "FORBIDDEN", "본인의 평가지만 잠금 해제를 요청할 수 있습니다.")
  }
  requireUnlockedCycle(snapshot, assignment.cycleId)
  if (sheet.status !== "submitted") {
    throw new ApiError(400, "INVALID_INPUT", "제출된 평가지만 잠금 해제를 요청할 수 있습니다.")
  }
  const now = new Date().toISOString()
  const existing = snapshot.unlockRequests.find((entry) =>
    entry.sheetId === sheet.id && entry.status === "pending")
  const unlockRequest = {
    id: existing?.id ?? crypto.randomUUID(),
    cycleId: assignment.cycleId,
    sheetId: sheet.id,
    evaluatorId: assignment.evaluatorId,
    reason: request.reason,
    status: "pending" as const,
    createdAt: existing?.createdAt ?? now,
    resolvedAt: null,
  }
  return {
    ...snapshot,
    unlockRequests: existing === undefined
      ? [...snapshot.unlockRequests, unlockRequest]
      : snapshot.unlockRequests.map((entry) => entry.id === existing.id ? unlockRequest : entry),
    auditEvents: [...snapshot.auditEvents, {
      id: crypto.randomUUID(), cycleId: assignment.cycleId, type: "sheet_unlock_requested",
      actorId: profile.auth_user_id, actorRole: profile.role, targetId: sheet.id,
      reason: request.reason, createdAt: now,
    }],
  }
}

function requireEngineer(snapshot: Snapshot, profile: Profile, engineerId: string, cycleId: string): void {
  if (profile.role !== "engineer" || profile.engineer_id !== engineerId) {
    throw new ApiError(403, "FORBIDDEN", "본인의 증빙 자료만 수정할 수 있습니다.")
  }
  if (!snapshot.engineers.some((entry) => entry.id === engineerId) ||
      !snapshot.cycles.some((entry) => entry.id === cycleId)) {
    throw new ApiError(404, "NOT_FOUND", "평가 대상 또는 평가 시즌을 찾을 수 없습니다.")
  }
  requireUnlockedCycle(snapshot, cycleId)
}

export function mutateSource(snapshot: Snapshot, profile: Profile, request: SourceRequest): Snapshot {
  const now = new Date().toISOString()
  if (request.operation === "save_language_record") {
    requireEngineer(snapshot, profile, request.record.engineerId, request.record.cycleId)
    const existing = request.record.recordId === null ? undefined : snapshot.languageScoreRecords.find((entry) => entry.id === request.record.recordId)
    if (request.record.recordId !== null && (existing === undefined || existing.engineerId !== profile.engineer_id)) {
      throw new ApiError(404, "NOT_FOUND", "어학 기록을 찾을 수 없습니다.")
    }
    const id = existing?.id ?? crypto.randomUUID()
    const persisted = {
      id,
      cycleId: request.record.cycleId,
      engineerId: request.record.engineerId,
      examName: request.record.examName,
      languageName: request.record.languageName,
      result: request.record.result,
      languageGroup: request.record.languageGroup,
      previousResult: request.record.previousResult,
      newlyAcquired: request.record.newlyAcquired,
      acquiredOn: request.record.acquiredOn,
      note: request.record.note,
      updatedAt: now,
    }
    return {
      ...snapshot,
      languageScoreRecords: existing === undefined
        ? [...snapshot.languageScoreRecords, persisted]
        : snapshot.languageScoreRecords.map((entry) => entry.id === id ? persisted : entry),
      auditEvents: [...snapshot.auditEvents, audit(snapshot, profile, "language_record_saved", persisted.cycleId, id)],
    }
  }
  if (request.operation === "save_certification_record") {
    requireEngineer(snapshot, profile, request.record.engineerId, request.record.cycleId)
    const existing = request.record.recordId === null ? undefined : snapshot.certificationRecords.find((entry) => entry.id === request.record.recordId)
    if (request.record.recordId !== null && (existing === undefined || existing.engineerId !== profile.engineer_id)) {
      throw new ApiError(404, "NOT_FOUND", "자격증 기록을 찾을 수 없습니다.")
    }
    const configuredNames = new Set(
      snapshot.directScoreRules
        .filter((rule) =>
          rule.cycleId === request.record.cycleId &&
          rule.kind === "certification" &&
          rule.field === "certificateName" &&
          rule.operator === "equals" &&
          rule.ruleType === "base" &&
          rule.enabled
        )
        .map((rule) => rule.value),
    )
    if (!configuredNames.has(request.record.certificateName)) {
      throw new ApiError(400, "INVALID_INPUT", "현재 평가 시즌의 자격증 평가표에 등록된 자격증만 입력할 수 있습니다.")
    }
    const duplicate = snapshot.certificationRecords.some((entry) =>
      entry.id !== existing?.id &&
      entry.cycleId === request.record.cycleId &&
      entry.engineerId === request.record.engineerId &&
      entry.certificateName === request.record.certificateName
    )
    if (duplicate) {
      throw new ApiError(400, "INVALID_INPUT", "같은 자격증은 한 번만 등록할 수 있습니다.")
    }
    const id = existing?.id ?? crypto.randomUUID()
    const persisted = {
      id,
      cycleId: request.record.cycleId,
      engineerId: request.record.engineerId,
      certificateName: request.record.certificateName,
      grade: request.record.grade,
      acquiredOn: request.record.acquiredOn,
      issuer: request.record.issuer,
      updatedAt: now,
    }
    return {
      ...snapshot,
      certificationRecords: existing === undefined
        ? [...snapshot.certificationRecords, persisted]
        : snapshot.certificationRecords.map((entry) => entry.id === id ? persisted : entry),
      auditEvents: [...snapshot.auditEvents, audit(snapshot, profile, "certification_record_saved", persisted.cycleId, id)],
    }
  }
  const language = request.operation === "delete_language_record"
  const records = language ? snapshot.languageScoreRecords : snapshot.certificationRecords
  const existing = records.find((entry) => entry.id === request.recordId)
  if (existing === undefined) throw new ApiError(404, "NOT_FOUND", "증빙 기록을 찾을 수 없습니다.")
  requireEngineer(snapshot, profile, existing.engineerId, existing.cycleId)
  return {
    ...snapshot,
    languageScoreRecords: language
      ? snapshot.languageScoreRecords.filter((entry) => entry.id !== request.recordId)
      : snapshot.languageScoreRecords,
    certificationRecords: language
      ? snapshot.certificationRecords
      : snapshot.certificationRecords.filter((entry) => entry.id !== request.recordId),
    auditEvents: [...snapshot.auditEvents, audit(snapshot, profile,
      language ? "language_record_deleted" : "certification_record_deleted", existing.cycleId, existing.id)],
  }
}
