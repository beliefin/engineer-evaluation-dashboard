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

async function operator(request: Request): Promise<Profile> {
  const auth = await service.auth.getUser(token(request))
  if (auth.error !== null || auth.data.user === null) throw new HttpError(401, "UNAUTHENTICATED", "로그인이 만료되었습니다.")
  const result = await service.from("profiles").select("*").eq("auth_user_id", auth.data.user.id).single()
  if (result.error !== null) throw new HttpError(403, "FORBIDDEN", "운영자 권한이 필요합니다.")
  const profile = profileSchema.parse(result.data)
  if (!profile.active || profile.role !== "operator") throw new HttpError(403, "FORBIDDEN", "운영자 권한이 필요합니다.")
  return profile
}

function publicAccount(profile: Profile) {
  return {
    id: profile.auth_user_id,
    username: profile.username,
    displayName: profile.display_name,
    role: profile.role,
    evaluatorId: profile.evaluator_id,
    engineerId: profile.engineer_id,
    active: profile.active,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

async function listAccounts() {
  const result = await service.from("profiles").select("*").order("username")
  if (result.error !== null) throw new HttpError(500, "ACCOUNT_READ_FAILED", "계정 목록을 불러오지 못했습니다.")
  return result.data.map((entry) => publicAccount(profileSchema.parse(entry)))
}

async function findProfile(accountId: string): Promise<Profile> {
  const result = await service.from("profiles").select("*").eq("auth_user_id", accountId).single()
  if (result.error !== null) throw new HttpError(404, "NOT_FOUND", "계정을 찾을 수 없습니다.")
  return profileSchema.parse(result.data)
}

async function requireRemainingOperator(target: Profile, nextRole: Profile["role"], nextActive: boolean): Promise<void> {
  if (!(target.role === "operator" && target.active && (nextRole !== "operator" || !nextActive))) return
  const result = await service.from("profiles").select("auth_user_id", { count: "exact", head: true })
    .eq("role", "operator").eq("active", true)
  if (result.error !== null) throw new HttpError(500, "ACCOUNT_READ_FAILED", "운영자 계정을 확인하지 못했습니다.")
  if ((result.count ?? 0) <= 1) throw new HttpError(409, "LAST_OPERATOR", "마지막 활성 운영자 계정은 제거할 수 없습니다.")
}

async function createAccount(request: Extract<AccountRequest, { operation: "create" }>): Promise<void> {
  try { validateRoleLink(request) } catch { throw new HttpError(400, "INVALID_INPUT", "역할과 연결 대상이 일치하지 않습니다.") }
  const created = await service.auth.admin.createUser({
    email: accountEmailForUsername(request.username),
    password: request.password,
    email_confirm: true,
    app_metadata: { role: request.role },
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
    evaluator_id: request.evaluatorId,
    engineer_id: request.engineerId,
    active: request.active,
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
  const target = await findProfile(request.accountId)
  if (target.auth_user_id === actor.auth_user_id && (!request.active || request.role !== "operator")) {
    throw new HttpError(409, "SELF_LOCKOUT", "현재 로그인한 운영자 계정은 잠글 수 없습니다.")
  }
  await requireRemainingOperator(target, request.role, request.active)
  const updated = await service.from("profiles").update({
    display_name: request.displayName,
    role: request.role,
    evaluator_id: request.evaluatorId,
    engineer_id: request.engineerId,
    active: request.active,
  }).eq("auth_user_id", request.accountId)
  if (updated.error !== null) throw new HttpError(400, "INVALID_INPUT", "계정 정보를 수정하지 못했습니다.")
  await service.auth.admin.updateUserById(request.accountId, { app_metadata: { role: request.role } })
}

async function applyOperation(actor: Profile, request: AccountRequest): Promise<void> {
  if (request.operation === "list") return
  if (request.operation === "create") return createAccount(request)
  const target = await findProfile(request.accountId)
  if (request.operation === "update") return updateAccount(actor, request)
  if (request.operation === "reset_password") {
    const result = await service.auth.admin.updateUserById(request.accountId, { password: request.password })
    if (result.error !== null) throw new HttpError(500, "PASSWORD_RESET_FAILED", "비밀번호를 변경하지 못했습니다.")
    return
  }
  if (target.auth_user_id === actor.auth_user_id) throw new HttpError(409, "SELF_LOCKOUT", "현재 계정은 삭제할 수 없습니다.")
  await requireRemainingOperator(target, "approver", false)
  const deleted = await service.auth.admin.deleteUser(request.accountId)
  if (deleted.error !== null) throw new HttpError(500, "ACCOUNT_DELETE_FAILED", "계정을 삭제하지 못했습니다.")
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== "POST") return jsonResponse(request, { error: { code: "METHOD_NOT_ALLOWED", message: "POST 요청만 허용됩니다." } }, 405)
  try {
    const actor = await operator(request)
    const payload: unknown = await request.json()
    const parsed = requestSchema.parse(payload)
    await applyOperation(actor, parsed)
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
