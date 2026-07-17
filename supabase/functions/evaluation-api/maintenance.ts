import type { SupabaseClient } from "@supabase/supabase-js"

import { ApiError } from "./api-error.ts"
import type { Profile, Snapshot } from "./model.ts"

type State = Readonly<{ snapshot: Snapshot; revision: number }>

export async function listMaintenance(client: SupabaseClient) {
  const [backups, audit, profiles] = await Promise.all([
    client.from("evaluation_state_backups")
      .select("id, revision, label, created_by, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    client.from("audit_log")
      .select("id, actor_user_id, actor_role, operation, target_id, revision, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    client.from("profiles").select("auth_user_id, display_name"),
  ])
  if (backups.error !== null || audit.error !== null || profiles.error !== null) {
    throw new ApiError(500, "MAINTENANCE_READ_FAILED", "백업과 변경 이력을 불러오지 못했습니다.")
  }
  const profileNames = new Map(profiles.data.map((profile) => [profile.auth_user_id, profile.display_name]))
  return {
    backups: backups.data.map((backup) => ({
      id: backup.id,
      revision: Number(backup.revision),
      label: backup.label,
      createdBy: backup.created_by === null ? null : profileNames.get(backup.created_by) ?? backup.created_by,
      createdAt: backup.created_at,
    })),
    auditEvents: audit.data.map((event) => ({
      id: String(event.id),
      actorName: profileNames.get(event.actor_user_id) ?? event.actor_user_id,
      actorRole: event.actor_role,
      operation: event.operation,
      targetId: event.target_id,
      revision: Number(event.revision),
      metadata: event.metadata,
      createdAt: event.created_at,
    })),
  }
}

export async function createBackup(
  client: SupabaseClient,
  state: State,
  profile: Profile,
  label: string,
) {
  const inserted = await client.from("evaluation_state_backups").insert({
    revision: state.revision,
    snapshot: state.snapshot,
    label,
    created_by: profile.auth_user_id,
  }).select("id").single()
  if (inserted.error !== null) {
    throw new ApiError(500, "BACKUP_CREATE_FAILED", "백업을 만들지 못했습니다.")
  }
  const audit = await client.from("audit_log").insert({
    actor_user_id: profile.auth_user_id,
    actor_role: profile.role,
    operation: "backup_created",
    target_id: inserted.data.id,
    revision: state.revision,
    metadata: { label },
  })
  if (audit.error !== null) {
    throw new ApiError(500, "BACKUP_CREATE_FAILED", "백업 이력을 저장하지 못했습니다.")
  }
  return listMaintenance(client)
}

export async function restoreBackup(
  client: SupabaseClient,
  profile: Profile,
  backupId: string,
  expectedRevision: number,
) {
  const restored = await client.rpc("restore_evaluation_state_backup", {
    p_backup_id: backupId,
    p_expected_revision: expectedRevision,
    p_actor_user_id: profile.auth_user_id,
  })
  if (restored.error !== null) {
    if (restored.error.code === "40001" || restored.error.message.includes("state_revision_conflict")) {
      throw new ApiError(409, "REVISION_CONFLICT", "다른 사용자가 먼저 저장했습니다. 최신 상태에서 다시 시도해 주세요.")
    }
    if (restored.error.code === "P0002" || restored.error.message.includes("backup_not_found")) {
      throw new ApiError(404, "NOT_FOUND", "복구할 백업을 찾을 수 없습니다.")
    }
    throw new ApiError(500, "BACKUP_RESTORE_FAILED", "백업을 복구하지 못했습니다.")
  }
  return { ...(await listMaintenance(client)), revision: Number(restored.data) }
}
