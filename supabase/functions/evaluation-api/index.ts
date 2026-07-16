import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import { ZodError } from "zod"

import { corsHeaders, jsonResponse } from "../_shared/cors.ts"
import { ApiError } from "./api-error.ts"
import { profileSchema, snapshotSchema, type Profile, type Snapshot } from "./model.ts"
import { mutateSheet, mutateSource } from "./mutations.ts"
import { projectSnapshot } from "./projection.ts"
import { evaluationRequestSchema } from "./request-schema.ts"
import { findMissingLinkedRosterIds } from "./roster-integrity.ts"
import { commitState, loadState } from "./state-store.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL")
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
if (supabaseUrl === undefined || serviceRoleKey === undefined) {
  throw new Error("Supabase Edge Function environment is incomplete")
}
const service = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization")
  if (authorization === null || !authorization.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHENTICATED", "로그인이 필요합니다.")
  }
  return authorization.slice("Bearer ".length)
}

async function authenticate(request: Request): Promise<Profile> {
  const { data, error } = await service.auth.getUser(bearerToken(request))
  if (error !== null || data.user === null) {
    throw new ApiError(401, "UNAUTHENTICATED", "로그인이 만료되었습니다.")
  }
  const response = await service.from("profiles").select(
    "auth_user_id, username, display_name, role, evaluator_id, engineer_id, active",
  ).eq("auth_user_id", data.user.id).single()
  if (response.error !== null) throw new ApiError(403, "PROFILE_REQUIRED", "사용자 권한을 확인할 수 없습니다.")
  const profile = profileSchema.parse(response.data)
  if (!profile.active) throw new ApiError(403, "INACTIVE_ACCOUNT", "비활성화된 계정입니다.")
  return profile
}

function applyMutation(
  snapshot: Snapshot,
  profile: Profile,
  request: ReturnType<typeof evaluationRequestSchema.parse>,
): { snapshot: Snapshot; operation: string; targetId: string | null; revision: number } {
  if (request.operation === "operator_commit") {
    if (profile.role !== "operator") throw new ApiError(403, "FORBIDDEN", "운영자 권한이 필요합니다.")
    if (request.action === "demo_reset") throw new ApiError(403, "FORBIDDEN", "운영 데이터 초기화는 허용되지 않습니다.")
    return {
      snapshot: snapshotSchema.parse(request.snapshot),
      operation: request.action,
      targetId: request.targetId,
      revision: request.baseRevision,
    }
  }
  if (request.operation === "save_draft" || request.operation === "submit_sheet") {
    return {
      snapshot: mutateSheet(snapshot, profile, request),
      operation: request.operation,
      targetId: request.sheetId,
      revision: request.baseRevision,
    }
  }
  if (request.operation === "load") throw new ApiError(400, "INVALID_INPUT", "저장 요청이 아닙니다.")
  const targetId = "recordId" in request
    ? request.recordId
    : request.record.recordId
  return {
    snapshot: mutateSource(snapshot, profile, request),
    operation: request.operation,
    targetId,
    revision: request.baseRevision,
  }
}

async function requireLinkedRosterMembers(snapshot: Snapshot): Promise<void> {
  const response = await service.from("profiles").select("evaluator_id, engineer_id")
  if (response.error !== null) {
    throw new ApiError(500, "PROFILE_LOOKUP_FAILED", "계정 연결 정보를 확인하지 못했습니다.")
  }
  const missing = findMissingLinkedRosterIds(snapshot, response.data)
  if (missing.evaluatorIds.length > 0 || missing.engineerIds.length > 0) {
    throw new ApiError(
      409,
      "ACCOUNT_LINKED",
      "로그인 계정이 연결된 엔지니어 또는 평가자는 삭제할 수 없습니다.",
    )
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== "POST") return jsonResponse(request, { error: { code: "METHOD_NOT_ALLOWED", message: "POST 요청만 허용됩니다." } }, 405)
  try {
    const profile = await authenticate(request)
    const payload: unknown = await request.json()
    const parsed = evaluationRequestSchema.parse(payload)
    const state = await loadState(service)
    if (parsed.operation === "load") {
      return jsonResponse(request, { snapshot: projectSnapshot(state.snapshot, profile), revision: state.revision })
    }
    const mutation = applyMutation(state.snapshot, profile, parsed)
    if (parsed.operation === "operator_commit") {
      await requireLinkedRosterMembers(mutation.snapshot)
    }
    const revision = await commitState(
      service, mutation.revision, mutation.snapshot, profile, mutation.operation, mutation.targetId,
    )
    return jsonResponse(request, { snapshot: projectSnapshot(mutation.snapshot, profile), revision })
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonResponse(request, { error: { code: error.code, message: error.message } }, error.status)
    }
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return jsonResponse(request, { error: { code: "INVALID_INPUT", message: "요청 형식을 확인해 주세요." } }, 400)
    }
    console.error("evaluation-api failure", error)
    return jsonResponse(request, { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." } }, 500)
  }
})
