import type { AuditEvent, EvaluationSnapshot, Role } from "@/domain"
import type { SourceRecordReviewStatus } from "@/features/operations/types"

import { formatTimestamp } from "./labels"

export type SourceRecordReviewMeta = Readonly<{
  reviewStatus: SourceRecordReviewStatus
  sourceLabel: string
  updatedAtLabel: string
}>

function sourceLabel(role: Role): string {
  switch (role) {
    case "operator":
      return "운영자 입력"
    case "engineer":
      return "본인 입력"
    case "evaluator":
      return "평가자 입력"
    case "approver":
      return "승인자 입력"
  }
}

function isSourceReviewEvent(event: AuditEvent, recordId: string): boolean {
  if (event.targetId !== recordId) return false
  return event.type === "language_record_saved" ||
    event.type === "certification_record_saved" ||
    event.type === "source_record_verified"
}

export function selectSourceRecordReview(
  snapshot: EvaluationSnapshot,
  recordId: string,
  updatedAt: string,
): SourceRecordReviewMeta {
  const latest = snapshot.auditEvents.findLast((event) => isSourceReviewEvent(event, recordId))
  const updatedAtLabel = formatTimestamp(updatedAt) ?? updatedAt
  if (latest === undefined) {
    return { reviewStatus: "seed", sourceLabel: "샘플 초기값", updatedAtLabel }
  }
  if (latest.type === "source_record_verified") {
    return { reviewStatus: "verified", sourceLabel: "운영자 확인", updatedAtLabel }
  }
  return {
    reviewStatus: latest.actorRole === "engineer" ? "pending" : "verified",
    sourceLabel: sourceLabel(latest.actorRole),
    updatedAtLabel,
  }
}
