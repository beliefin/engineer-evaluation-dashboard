import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"

import { ApiError } from "./api-error.ts"
import { storedSnapshotSchema, type Profile, type Snapshot } from "./model.ts"

const stateRowSchema = z.object({
  snapshot: storedSnapshotSchema,
  revision: z.coerce.number().int().nonnegative(),
})

export type EvaluationState = Readonly<{ snapshot: Snapshot; revision: number }>

export async function loadState(client: SupabaseClient): Promise<EvaluationState> {
  const { data, error } = await client
    .from("evaluation_state")
    .select("snapshot, revision")
    .eq("id", "primary")
    .single()
  if (error !== null) throw new ApiError(500, "STATE_READ_FAILED", "평가 데이터를 불러오지 못했습니다.")
  return stateRowSchema.parse(data)
}

export async function commitState(
  client: SupabaseClient,
  expectedRevision: number,
  snapshot: Snapshot,
  profile: Profile,
  operation: string,
  targetId: string | null,
): Promise<number> {
  const { data, error } = await client.rpc("commit_evaluation_state", {
    p_expected_revision: expectedRevision,
    p_snapshot: snapshot,
    p_actor_user_id: profile.auth_user_id,
    p_actor_role: profile.role,
    p_operation: operation,
    p_target_id: targetId,
    p_metadata: { source: "evaluation-api" },
  })
  if (error !== null) {
    if (error.code === "40001" || error.message.includes("state_revision_conflict")) {
      throw new ApiError(409, "REVISION_CONFLICT", "다른 사용자가 먼저 저장했습니다. 최신 데이터를 다시 불러와 주세요.")
    }
    throw new ApiError(500, "STATE_WRITE_FAILED", "평가 데이터를 저장하지 못했습니다.")
  }
  return z.coerce.number().int().positive().parse(data)
}
