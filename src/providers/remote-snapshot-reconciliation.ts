import type { EvaluationSnapshot } from "@/domain"

export function withCanonicalAuditPrefix(
  optimistic: EvaluationSnapshot,
  canonical: EvaluationSnapshot,
): EvaluationSnapshot {
  const canonicalCount = canonical.auditEvents.length
  if (canonicalCount > optimistic.auditEvents.length) return optimistic
  return {
    ...optimistic,
    auditEvents: [
      ...canonical.auditEvents,
      ...optimistic.auditEvents.slice(canonicalCount),
    ],
  }
}

export function preserveOptimisticInput(
  optimistic: EvaluationSnapshot,
  canonical: EvaluationSnapshot,
): EvaluationSnapshot {
  return {
    ...optimistic,
    auditEvents: canonical.auditEvents,
    scoreAdjustments: canonical.scoreAdjustments,
  }
}
