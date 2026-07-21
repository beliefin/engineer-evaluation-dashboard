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
  const otherLanguageRecords = context.snapshot.languageScoreRecords.filter((candidate) =>
    candidate.id !== existing?.id &&
    candidate.cycleId === parsed.cycleId &&
    candidate.engineerId === parsed.engineerId
  )
  if (parsed.noScore && otherLanguageRecords.some((candidate) => candidate.noScore !== true)) {
    throw new RepositoryError("INVALID_INPUT", "등록된 어학 성적을 먼저 삭제해 주세요.")
  }

  const record: LanguageScoreRecord = {
    id: existing?.id ?? createEntityId(context, "language-record"),
    cycleId: parsed.cycleId,
    engineerId: parsed.engineerId,
    examName: parsed.examName.trim(),
    languageName: nullableText(parsed.languageName),
    result: parsed.result.trim(),
    noScore: parsed.noScore,
    languageGroup: parsed.languageGroup,
    previousResult: nullableText(parsed.previousResult),
    newlyAcquired: parsed.newlyAcquired,
    acquiredOn: parsed.acquiredOn,
    note: nullableText(parsed.note),
    updatedAt: context.now,
  }
  const retainedLanguageRecords = context.snapshot.languageScoreRecords.filter((candidate) =>
    candidate.id !== record.id && !(
      parsed.noScore !== true &&
      candidate.cycleId === parsed.cycleId &&
      candidate.engineerId === parsed.engineerId &&
      candidate.noScore === true
    )
  )
  const languageScoreRecords = [...retainedLanguageRecords, record]
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

  const certificateName = parsed.certificateName.trim()
  const configuredNames = new Set(
    context.snapshot.directScoreRules
      .filter((rule) =>
        rule.cycleId === parsed.cycleId &&
        rule.kind === "certification" &&
        rule.field === "certificateName" &&
        rule.operator === "equals" &&
        rule.ruleType === "base" &&
        rule.enabled
      )
      .map((rule) => rule.value),
  )
  if (!parsed.noScore && !configuredNames.has(certificateName)) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "현재 평가 시즌의 자격증 평가표에 등록된 자격증만 입력할 수 있습니다.",
    )
  }
  const otherCertificationRecords = context.snapshot.certificationRecords.filter((candidate) =>
    candidate.id !== existing?.id &&
    candidate.cycleId === parsed.cycleId &&
    candidate.engineerId === parsed.engineerId
  )
  if (parsed.noScore && otherCertificationRecords.some((candidate) => candidate.noScore !== true)) {
    throw new RepositoryError("INVALID_INPUT", "등록된 자격증을 먼저 삭제해 주세요.")
  }
  const duplicate = context.snapshot.certificationRecords.some((record) =>
    record.id !== existing?.id &&
    record.cycleId === parsed.cycleId &&
    record.engineerId === parsed.engineerId &&
    record.certificateName === certificateName
  )
  if (duplicate) {
    throw new RepositoryError("INVALID_INPUT", "같은 자격증은 한 번만 등록할 수 있습니다.")
  }

  const record: CertificationRecord = {
    id: existing?.id ?? createEntityId(context, "certification-record"),
    cycleId: parsed.cycleId,
    engineerId: parsed.engineerId,
    certificateName,
    noScore: parsed.noScore,
    grade: nullableText(parsed.grade),
    acquiredOn: parsed.acquiredOn,
    issuer: nullableText(parsed.issuer),
    updatedAt: context.now,
  }
  const retainedCertificationRecords = context.snapshot.certificationRecords.filter((candidate) =>
    candidate.id !== record.id && !(
      parsed.noScore !== true &&
      candidate.cycleId === parsed.cycleId &&
      candidate.engineerId === parsed.engineerId &&
      candidate.noScore === true
    )
  )
  const certificationRecords = [...retainedCertificationRecords, record]
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
