import type { AuditEvent, EvaluationSnapshot } from "@/domain"

import { createAuditEvent } from "./repository-helpers"
import type { RepositoryActor } from "./types"

export type MutationContext = Readonly<{
  snapshot: EvaluationSnapshot
  now: string
  idFactory: () => string
}>

type AuditDetails = Readonly<{
  cycleId: string
  type: AuditEvent["type"]
  actor: RepositoryActor
  targetId: string
  reason?: string | null
}>

export function appendAuditEvent(
  context: MutationContext,
  snapshot: EvaluationSnapshot,
  details: AuditDetails,
): EvaluationSnapshot {
  const event = createAuditEvent({
    id: `audit-${context.idFactory()}`,
    cycleId: details.cycleId,
    type: details.type,
    actor: details.actor,
    targetId: details.targetId,
    reason: details.reason ?? null,
    createdAt: context.now,
  })
  return { ...snapshot, auditEvents: [...snapshot.auditEvents, event] }
}

export function createEntityId(context: MutationContext, prefix: string): string {
  return `${prefix}-${context.idFactory()}`
}
