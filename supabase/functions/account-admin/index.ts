import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import { ZodError } from "zod"

import { corsHeaders, jsonResponse } from "../_shared/cors.ts"
import { profileSchema, requestSchema, validateRoleLink, type AccountRequest, type Profile } from "./schema.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL")
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
if (supabaseUrl === undefined || serviceRoleKey === undefined) throw new Error("Missing Supabase environment")
const service = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const accountDomain = new URL(supabaseUrl).hostname

function accountEmailForUsername(username: string): string {
  if (/^[a-z0-9._-]+$/.test(username)) return `${username}@${accountDomain}`

  const encoded = Array.from(
    new TextEncoder().encode(username),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("-")
  return `u-${encoded}@${accountDomain}`
}

class HttpError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message)
  }
}

function token(request: Request): string {
  const value = request.headers.get("authorization")
  if (value === null || !value.startsWith("Bearer ")) throw new HttpError(401, "UNAUTHENTICATED", "로그인이 필요합니다.")
  return value.slice(7)
}

async function authenticate(request: Request): Promise<Profile> {
  const auth = await service.auth.getUser(token(request))
  if (auth.error !== null || auth.data.user === null) throw new HttpError(401, "UNAUTHENTICATED", "로그인이 만료되었습니다.")
  const result = await service.from("profiles").select("*").eq("auth_user_id", auth.data.user.id).single()
  if (result.error !== null) throw new HttpError(403, "FORBIDDEN", "계정 권한을 확인할 수 없습니다.")
  const profile = profileSchema.parse(result.data)
  if (!profile.active) throw new HttpError(403, "FORBIDDEN", "비활성화된 계정입니다.")
  return profile
}

function requireOperator(profile: Profile): void {
  if (!profile.roles.includes("operator")) {
    throw new HttpError(403, "FORBIDDEN", "운영자 권한이 필요합니다.")
  }
}

function publicAccount(profile: Profile) {
  return {
    id: profile.auth_user_id,
    username: profile.username,
    displayName: profile.display_name,
    role: profile.role,
    roles: profile.roles,
    evaluatorId: profile.evaluator_id,
    engineerId: profile.engineer_id,
    canViewInsights: profile.can_view_insights,
    active: profile.active,
    mustChangePassword: profile.must_change_password,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

async function listAccounts() {
  const result = await service.from("profiles").select("*").order("username")
  if (result.error !== null) throw new HttpError(500, "ACCOUNT_READ_FAILED", "계정 목록을 불러오지 못했습니다.")
  return result.data.map((entry) => publicAccount(profileSchema.parse(entry)))
}

async function recordAudit(actor: Profile, operation: string, targetId: string | null): Promise<void> {
  const state = await service.from("evaluation_state").select("revision").eq("id", "primary").single()
  if (state.error !== null) return console.error("account audit revision read failed", state.error)
  const audit = await service.from("audit_log").insert({
    actor_user_id: actor.auth_user_id,
    actor_role: actor.role,
    operation,
    target_id: targetId,
    revision: Number(state.data.revision),
    metadata: { source: "account-admin" },
  })
  if (audit.error !== null) console.error("account audit insert failed", audit.error)
}

async function findProfile(accountId: string): Promise<Profile> {
  const result = await service.from("profiles").select("*").eq("auth_user_id", accountId).single()
  if (result.error !== null) throw new HttpError(404, "NOT_FOUND", "계정을 찾을 수 없습니다.")
  return profileSchema.parse(result.data)
}

async function requireRemainingOperator(target: Profile, nextRoles: ReadonlyArray<Profile["role"]>, nextActive: boolean): Promise<void> {
  if (!(target.roles.includes("operator") && target.active && (!nextRoles.includes("operator") || !nextActive))) return
  const result = await service.from("profiles").select("auth_user_id", { count: "exact", head: true })
    .contains("roles", ["operator"]).eq("active", true)
  if (result.error !== null) throw new HttpError(500, "ACCOUNT_READ_FAILED", "운영자 계정을 확인하지 못했습니다.")
  if ((result.count ?? 0) <= 1) throw new HttpError(409, "LAST_OPERATOR", "마지막 활성 운영자 계정은 제거할 수 없습니다.")
}

async function createAccount(request: Extract<AccountRequest, { operation: "create" }>): Promise<void> {
  try { validateRoleLink(request) } catch { throw new HttpError(400, "INVALID_INPUT", "역할과 연결 대상이 일치하지 않습니다.") }
  const roles = request.roles ?? [request.role]
  const created = await service.auth.admin.createUser({
    email: accountEmailForUsername(request.username),
    password: request.password,
    email_confirm: true,
    app_metadata: { role: request.role, roles },
  })
  if (created.error !== null || created.data.user === null) {
    const duplicate = created.error?.message.toLowerCase().includes("already") ?? false
    throw new HttpError(duplicate ? 409 : 500, duplicate ? "DUPLICATE_USERNAME" : "ACCOUNT_CREATE_FAILED",
      duplicate ? "이미 사용 중인 아이디입니다." : "계정을 만들지 못했습니다.")
  }
  const inserted = await service.from("profiles").insert({
    auth_user_id: created.data.user.id,
    username: request.username,
    display_name: request.displayName,
    role: request.role,
    roles,
    evaluator_id: request.evaluatorId,
    engineer_id: request.engineerId,
    can_view_insights: request.canViewInsights,
    active: request.active,
    must_change_password: true,
  })
  if (inserted.error !== null) {
    await service.auth.admin.deleteUser(created.data.user.id)
    const duplicate = inserted.error.code === "23505"
    throw new HttpError(duplicate ? 409 : 400, duplicate ? "DUPLICATE_USERNAME" : "INVALID_INPUT",
      duplicate ? "이미 연결된 계정 또는 대상입니다." : "계정 정보를 저장하지 못했습니다.")
  }
}

async function updateAccount(actor: Profile, request: Extract<AccountRequest, { operation: "update" }>): Promise<void> {
  try { validateRoleLink(request) } catch { throw new HttpError(400, "INVALID_INPUT", "역할과 연결 대상이 일치하지 않습니다.") }
  const roles = request.roles ?? [request.role]
  const target = await findProfile(request.accountId)
  if (target.auth_user_id === actor.auth_user_id && (!request.active || !roles.includes("operator"))) {
    throw new HttpError(409, "SELF_LOCKOUT", "현재 로그인한 운영자 계정은 잠글 수 없습니다.")
  }
  await requireRemainingOperator(target, roles, request.active)
  const updated = await service.from("profiles").update({
    display_name: request.displayName,
    role: request.role,
    roles,
    evaluator_id: request.evaluatorId,
    engineer_id: request.engineerId,
    can_view_insights: request.canViewInsights,
    active: request.active,
  }).eq("auth_user_id", request.accountId)
  if (updated.error !== null) throw new HttpError(400, "INVALID_INPUT", "계정 정보를 수정하지 못했습니다.")
  await service.auth.admin.updateUserById(request.accountId, { app_metadata: { role: request.role, roles } })
}

async function applyOperation(actor: Profile, request: AccountRequest): Promise<void> {
  if (request.operation === "list") return
  if (request.operation === "reset_roster_passwords") return
  if (request.operation === "create") return createAccount(request)
  if (request.operation === "change_own_password") return
  const target = await findProfile(request.accountId)
  if (request.operation === "update") return updateAccount(actor, request)
  if (request.operation === "reset_password") {
    const result = await service.auth.admin.updateUserById(request.accountId, { password: request.password })
    if (result.error !== null) throw new HttpError(500, "PASSWORD_RESET_FAILED", "비밀번호를 변경하지 못했습니다.")
    const marked = await service.from("profiles").update({ must_change_password: true })
      .eq("auth_user_id", request.accountId)
    if (marked.error !== null) throw new HttpError(500, "PASSWORD_RESET_FAILED", "비밀번호 상태를 저장하지 못했습니다.")
    return
  }
  if (target.auth_user_id === actor.auth_user_id) throw new HttpError(409, "SELF_LOCKOUT", "현재 계정은 삭제할 수 없습니다.")
  await requireRemainingOperator(target, ["approver"], false)
  const deleted = await service.auth.admin.deleteUser(request.accountId)
  if (deleted.error !== null) throw new HttpError(500, "ACCOUNT_DELETE_FAILED", "계정을 삭제하지 못했습니다.")
}

async function resetRosterPasswords(): Promise<number> {
  const [state, profiles] = await Promise.all([
    service.from("evaluation_state").select("snapshot").eq("id", "primary").single(),
    service.from("profiles").select("auth_user_id, evaluator_id, engineer_id"),
  ])
  if (state.error !== null || profiles.error !== null) {
    throw new HttpError(500, "ACCOUNT_READ_FAILED", "명단 연결 정보를 불러오지 못했습니다.")
  }
  const snapshot = state.data.snapshot as {
    engineers?: Array<{ id: string; employeeCode: string }>
    evaluators?: Array<{ id: string; employeeCode: string }>
  }
  const engineerCodes = new Map((snapshot.engineers ?? []).map((entry) => [entry.id, entry.employeeCode]))
  const evaluatorCodes = new Map((snapshot.evaluators ?? []).map((entry) => [entry.id, entry.employeeCode]))
  let count = 0
  for (const profile of profiles.data) {
    const engineerCode = profile.engineer_id === null ? undefined : engineerCodes.get(profile.engineer_id)
    const evaluatorCode = profile.evaluator_id === null ? undefined : evaluatorCodes.get(profile.evaluator_id)
    if (engineerCode !== undefined && evaluatorCode !== undefined && engineerCode !== evaluatorCode) {
      throw new HttpError(409, "ROSTER_LINK_MISMATCH", "복합 역할 계정의 엔지니어·평가자 사번이 일치하지 않습니다.")
    }
    const code = engineerCode ?? evaluatorCode
    if (code === undefined || !/^\d{4}$/.test(code)) continue
    const updated = await service.auth.admin.updateUserById(profile.auth_user_id, { password: code })
    if (updated.error !== null) throw new HttpError(500, "PASSWORD_RESET_FAILED", "일부 초기 비밀번호를 변경하지 못했습니다.")
    const marked = await service.from("profiles").update({ must_change_password: true })
      .eq("auth_user_id", profile.auth_user_id)
    if (marked.error !== null) throw new HttpError(500, "PASSWORD_RESET_FAILED", "비밀번호 상태를 저장하지 못했습니다.")
    count += 1
  }
  return count
}

async function changeOwnPassword(actor: Profile, password: string): Promise<Profile> {
  const result = await service.auth.admin.updateUserById(actor.auth_user_id, { password })
  if (result.error !== null) throw new HttpError(500, "PASSWORD_RESET_FAILED", "비밀번호를 변경하지 못했습니다.")
  const updated = await service.from("profiles")
    .update({ must_change_password: false })
    .eq("auth_user_id", actor.auth_user_id)
    .select("*")
    .single()
  if (updated.error !== null) throw new HttpError(500, "PASSWORD_RESET_FAILED", "비밀번호 상태를 저장하지 못했습니다.")
  return profileSchema.parse(updated.data)
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== "POST") return jsonResponse(request, { error: { code: "METHOD_NOT_ALLOWED", message: "POST 요청만 허용됩니다." } }, 405)
  try {
    const actor = await authenticate(request)
    const payload: unknown = await request.json()
    const parsed = requestSchema.parse(payload)
    if (parsed.operation === "change_own_password") {
      const account = await changeOwnPassword(actor, parsed.password)
      await recordAudit(actor, "password_changed", actor.auth_user_id)
      return jsonResponse(request, { account: publicAccount(account) })
    }
    requireOperator(actor)
    if (parsed.operation === "reset_roster_passwords") {
      const resetCount = await resetRosterPasswords()
      await recordAudit(actor, "roster_passwords_reset", null)
      return jsonResponse(request, { accounts: await listAccounts(), resetCount })
    }
    await applyOperation(actor, parsed)
    const operation = parsed.operation === "create" ? "account_created"
      : parsed.operation === "update" ? "account_updated"
        : parsed.operation === "reset_password" ? "password_reset"
          : parsed.operation === "delete" ? "account_deleted" : null
    if (operation !== null) {
      await recordAudit(actor, operation, "accountId" in parsed ? parsed.accountId : null)
    }
    return jsonResponse(request, { accounts: await listAccounts() })
  } catch (error) {
    if (error instanceof HttpError) return jsonResponse(request, { error: { code: error.code, message: error.message } }, error.status)
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return jsonResponse(request, { error: { code: "INVALID_INPUT", message: "입력값을 확인해 주세요." } }, 400)
    }
    console.error("account-admin failure", error)
    return jsonResponse(request, { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." } }, 500)
  }
})
