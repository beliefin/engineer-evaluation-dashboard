import type {
  CertificationRecord,
  EvaluationSnapshot,
  LanguageScoreRecord,
} from "@/domain"

import {
  deleteSourceRecordInputSchema,
  parseRepositoryInput,
  saveCertificationRecordInputSchema,
  saveLanguageScoreRecordInputSchema,
  verifySourceRecordInputSchema,
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
  requireSourceRecordActor,
} from "./repository-helpers"
import {
  RepositoryError,
  type DeleteSourceRecordInput,
  type SaveCertificationRecordInput,
  type SaveLanguageScoreRecordInput,
  type VerifySourceRecordInput,
} from "./types"

function nullableText(value: string | null): string | null {
  return value === null ? null : value.trim()
}

export function saveLanguageScoreRecordAction(
  context: MutationContext,
  input: SaveLanguageScoreRecordInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(saveLanguageScoreRecordInputSchema, input)
  requireSourceRecordActor(parsed.actor, parsed.engineerId)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireEngineer(context.snapshot, parsed.engineerId)
  const existing = parsed.recordId === null
    ? undefined
    : context.snapshot.languageScoreRecords.find((record) => record.id === parsed.recordId)
  if (parsed.recordId !== null && existing === undefined) {
    throw new RepositoryError("NOT_FOUND", "어학 성적 기록을 찾을 수 없습니다.")
  }
  if (
    existing !== undefined &&
    (existing.cycleId !== parsed.cycleId || existing.engineerId !== parsed.engineerId)
  ) {
    throw new RepositoryError("INVALID_INPUT", "어학 성적 기록의 대상이 일치하지 않습니다.")
  }

  const record: LanguageScoreRecord = {
    id: existing?.id ?? createEntityId(context, "language-record"),
    cycleId: parsed.cycleId,
    engineerId: parsed.engineerId,
    examName: parsed.examName.trim(),
    result: parsed.result.trim(),
    acquiredOn: parsed.acquiredOn,
    note: nullableText(parsed.note),
    updatedAt: context.now,
  }
  const languageScoreRecords = existing === undefined
    ? [...context.snapshot.languageScoreRecords, record]
    : context.snapshot.languageScoreRecords.map((candidate) =>
        candidate.id === record.id ? record : candidate,
      )
  return appendAuditEvent(context, { ...context.snapshot, languageScoreRecords }, {
    cycleId: record.cycleId,
    type: "language_record_saved",
    actor: parsed.actor,
    targetId: record.id,
  })
}

export function deleteLanguageScoreRecordAction(
  context: MutationContext,
  input: DeleteSourceRecordInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(deleteSourceRecordInputSchema, input)
  const record = context.snapshot.languageScoreRecords.find(
    (candidate) => candidate.id === parsed.recordId,
  )
  if (record === undefined) {
    throw new RepositoryError("NOT_FOUND", "어학 성적 기록을 찾을 수 없습니다.")
  }
  requireSourceRecordActor(parsed.actor, record.engineerId)
  requireCycleUnlocked(context.snapshot, record.cycleId)
  return appendAuditEvent(context, {
    ...context.snapshot,
    languageScoreRecords: context.snapshot.languageScoreRecords.filter(
      (candidate) => candidate.id !== record.id,
    ),
  }, {
    cycleId: record.cycleId,
    type: "language_record_deleted",
    actor: parsed.actor,
    targetId: record.id,
  })
}

export function saveCertificationRecordAction(
  context: MutationContext,
  input: SaveCertificationRecordInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(saveCertificationRecordInputSchema, input)
  requireSourceRecordActor(parsed.actor, parsed.engineerId)
  requireCycleUnlocked(context.snapshot, parsed.cycleId)
  requireEngineer(context.snapshot, parsed.engineerId)
  const existing = parsed.recordId === null
    ? undefined
    : context.snapshot.certificationRecords.find((record) => record.id === parsed.recordId)
  if (parsed.recordId !== null && existing === undefined) {
    throw new RepositoryError("NOT_FOUND", "자격증 기록을 찾을 수 없습니다.")
  }
  if (
    existing !== undefined &&
    (existing.cycleId !== parsed.cycleId || existing.engineerId !== parsed.engineerId)
  ) {
    throw new RepositoryError("INVALID_INPUT", "자격증 기록의 대상이 일치하지 않습니다.")
  }

  const record: CertificationRecord = {
    id: existing?.id ?? createEntityId(context, "certification-record"),
    cycleId: parsed.cycleId,
    engineerId: parsed.engineerId,
    certificateName: parsed.certificateName.trim(),
    grade: nullableText(parsed.grade),
    acquiredOn: parsed.acquiredOn,
    issuer: nullableText(parsed.issuer),
    updatedAt: context.now,
  }
  const certificationRecords = existing === undefined
    ? [...context.snapshot.certificationRecords, record]
    : context.snapshot.certificationRecords.map((candidate) =>
        candidate.id === record.id ? record : candidate,
      )
  return appendAuditEvent(context, { ...context.snapshot, certificationRecords }, {
    cycleId: record.cycleId,
    type: "certification_record_saved",
    actor: parsed.actor,
    targetId: record.id,
  })
}

export function deleteCertificationRecordAction(
  context: MutationContext,
  input: DeleteSourceRecordInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(deleteSourceRecordInputSchema, input)
  const record = context.snapshot.certificationRecords.find(
    (candidate) => candidate.id === parsed.recordId,
  )
  if (record === undefined) {
    throw new RepositoryError("NOT_FOUND", "자격증 기록을 찾을 수 없습니다.")
  }
  requireSourceRecordActor(parsed.actor, record.engineerId)
  requireCycleUnlocked(context.snapshot, record.cycleId)
  return appendAuditEvent(context, {
    ...context.snapshot,
    certificationRecords: context.snapshot.certificationRecords.filter(
      (candidate) => candidate.id !== record.id,
    ),
  }, {
    cycleId: record.cycleId,
    type: "certification_record_deleted",
    actor: parsed.actor,
    targetId: record.id,
  })
}

export function verifySourceRecordAction(
  context: MutationContext,
  input: VerifySourceRecordInput,
): EvaluationSnapshot {
  const parsed = parseRepositoryInput(verifySourceRecordInputSchema, input)
  requireOperator(parsed.actor)
  const record = parsed.recordKind === "language"
    ? context.snapshot.languageScoreRecords.find((entry) => entry.id === parsed.recordId)
    : context.snapshot.certificationRecords.find((entry) => entry.id === parsed.recordId)
  if (record === undefined) {
    throw new RepositoryError("NOT_FOUND", "검토할 원천 실적을 찾을 수 없습니다.")
  }
  requireCycleUnlocked(context.snapshot, record.cycleId)
  return appendAuditEvent(context, context.snapshot, {
    cycleId: record.cycleId,
    type: "source_record_verified",
    actor: parsed.actor,
    targetId: record.id,
  })
}
