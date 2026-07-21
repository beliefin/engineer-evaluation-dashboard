import { z } from "zod"

import { invokeAuthenticated } from "./supabase-http"

const backupSchema = z.object({
  id: z.string().uuid(), revision: z.number().int().nonnegative(), label: z.string(),
  createdBy: z.string().nullable(), createdAt: z.string(),
})
const auditEventSchema = z.object({
  id: z.string(),
  actorName: z.string().nullable().transform((value) => value ?? "시스템"),
  actorRole: z.string(), operation: z.string(),
  targetId: z.string().nullable(), revision: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()), createdAt: z.string(),
})
export const maintenanceSchema = z.object({
  backups: z.array(backupSchema), auditEvents: z.array(auditEventSchema),
  currentRevision: z.number().int().nonnegative(),
})

export type OperatorMaintenance = z.infer<typeof maintenanceSchema>
export type EvaluationBackup = z.infer<typeof backupSchema>

export function loadOperatorMaintenance(): Promise<OperatorMaintenance> {
  return invokeAuthenticated("evaluation-api", { operation: "list_maintenance" }, maintenanceSchema)
}

export function createEvaluationBackup(label: string): Promise<OperatorMaintenance> {
  return invokeAuthenticated("evaluation-api", { operation: "create_backup", label }, maintenanceSchema)
}

export function restoreEvaluationBackup(backupId: string, baseRevision: number): Promise<OperatorMaintenance> {
  return invokeAuthenticated("evaluation-api", { operation: "restore_backup", backupId, baseRevision }, maintenanceSchema)
}
