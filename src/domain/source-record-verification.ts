import type {
  AuditEvent,
  CertificationRecord,
  EvaluationSnapshot,
  LanguageScoreRecord,
} from "./types"

type SourceRecord = LanguageScoreRecord | CertificationRecord

function isReviewEvent(event: AuditEvent, recordId: string): boolean {
  if (event.targetId !== recordId) return false
  return event.type === "language_record_saved" ||
    event.type === "certification_record_saved" ||
    event.type === "source_record_verified"
}

export function isVerifiedSourceRecord(
  snapshot: EvaluationSnapshot,
  record: SourceRecord,
): boolean {
  const latest = snapshot.auditEvents.findLast((event) => isReviewEvent(event, record.id))
  if (latest === undefined) return true
  if (latest.type === "source_record_verified") return true
  return latest.actorRole !== "engineer"
}
