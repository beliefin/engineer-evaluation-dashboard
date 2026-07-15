import { ApiError } from "./api-error.ts"
import type { EvaluationRequest } from "./request-schema.ts"
import type { Profile, ScoreSheet, Snapshot, Task } from "./model.ts"

type SheetRequest = Extract<EvaluationRequest, { operation: "save_draft" | "submit_sheet" }>
type SourceRequest = Exclude<EvaluationRequest, { operation: "load" | "operator_commit" | "save_draft" | "submit_sheet" }>

function audit(snapshot: Snapshot, profile: Profile, type: string, cycleId: string, targetId: string): Snapshot["auditEvents"][number] {
  return {
    id: crypto.randomUUID(), cycleId, type, actorId: profile.auth_user_id,
    actorRole: profile.role, targetId, reason: null, createdAt: new Date().toISOString(),
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
  if (profile.role !== "evaluator" || profile.evaluator_id === null) {
    throw new ApiError(403, "FORBIDDEN", "평가자 권한이 필요합니다.")
  }
  const sheet = snapshot.scoreSheets.find((entry) => entry.id === request.sheetId)
  if (sheet === undefined) throw new ApiError(404, "NOT_FOUND", "평가지를 찾을 수 없습니다.")
  if (sheet.status === "submitted") throw new ApiError(409, "SHEET_LOCKED", "제출한 평가지는 수정할 수 없습니다.")
  const assignment = snapshot.assignments.find((entry) => entry.id === sheet.assignmentId)
  if (assignment === undefined || assignment.evaluatorId !== profile.evaluator_id) {
    throw new ApiError(403, "FORBIDDEN", "배정된 평가지만 수정할 수 있습니다.")
  }
  const task = snapshot.tasks.find((entry) => entry.id === assignment.taskId)
  if (task === undefined) throw new ApiError(404, "NOT_FOUND", "평가 과제를 찾을 수 없습니다.")
  validateSheet(task, request)
  const now = new Date().toISOString()
  const submitted = request.operation === "submit_sheet"
  const nextSheet: ScoreSheet = {
    ...sheet, scores: request.scores, passResult: request.passResult,
    status: submitted ? "submitted" : "draft", updatedAt: now, submittedAt: submitted ? now : null,
  }
  return {
    ...snapshot,
    scoreSheets: snapshot.scoreSheets.map((entry) => entry.id === sheet.id ? nextSheet : entry),
    auditEvents: submitted
      ? [...snapshot.auditEvents, audit(snapshot, profile, "sheet_submitted", assignment.cycleId, sheet.id)]
      : snapshot.auditEvents,
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
      result: request.record.result,
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
