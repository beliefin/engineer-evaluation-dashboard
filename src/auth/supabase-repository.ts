import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"

import { invokeAuthenticated, RemoteApiError } from "@/backend/supabase-http"

import type {
  AuthAccount,
  AuthErrorCode,
  AuthRepository,
  CreateAccountInput,
  LoginInput,
  ResetPasswordInput,
  UpdateAccountInput,
} from "./types"
import { AuthError } from "./types"
import { accountEmailForUsername } from "./account-email"

const profileSchema = z.object({
  auth_user_id: z.string().uuid(), username: z.string(), display_name: z.string(),
  role: z.enum(["operator", "evaluator", "approver", "engineer"]),
  evaluator_id: z.string().nullable(), engineer_id: z.string().nullable(), active: z.boolean(),
  created_at: z.string(), updated_at: z.string(),
})
const accountSchema = z.object({
  id: z.string().uuid(), username: z.string(), displayName: z.string(),
  role: z.enum(["operator", "evaluator", "approver", "engineer"]),
  evaluatorId: z.string().nullable(), engineerId: z.string().nullable(), active: z.boolean(),
  createdAt: z.string(), updatedAt: z.string(),
})
const accountsResponseSchema = z.object({ accounts: z.array(accountSchema) })

function publicAccount(profile: z.infer<typeof profileSchema>): AuthAccount {
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

const remoteAuthCodes = new Set<AuthErrorCode>([
  "INVALID_INPUT", "INACTIVE_ACCOUNT", "FORBIDDEN", "NOT_FOUND",
  "DUPLICATE_USERNAME", "SELF_LOCKOUT", "LAST_OPERATOR",
])

function authFailure(error: unknown): AuthError {
  if (error instanceof RemoteApiError) {
    const code = remoteAuthCodes.has(error.code as AuthErrorCode)
      ? error.code as AuthErrorCode
      : "STORAGE_UNAVAILABLE"
    return new AuthError(code, error.message, { cause: error })
  }
  return new AuthError("STORAGE_UNAVAILABLE", "인증 서버 요청을 처리하지 못했습니다.", { cause: error })
}

class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly accountDomain: string,
  ) {}

  private accountEmail(username: string): string {
    return accountEmailForUsername(username, this.accountDomain)
  }

  async restoreSession(): Promise<AuthAccount | null> {
    const session = await this.client.auth.getSession()
    if (session.error !== null || session.data.session === null) return null
    return this.loadOwnProfile(session.data.session.user.id)
  }

  async login(input: LoginInput): Promise<AuthAccount> {
    const username = input.username.trim().toLowerCase()
    const result = await this.client.auth.signInWithPassword({
      email: this.accountEmail(username),
      password: input.password,
    })
    if (result.error !== null || result.data.user === null) {
      throw new AuthError("INVALID_CREDENTIALS", "아이디 또는 비밀번호가 일치하지 않습니다.")
    }
    const account = await this.loadOwnProfile(result.data.user.id)
    if (!account.active) {
      await this.client.auth.signOut({ scope: "local" })
      throw new AuthError("INACTIVE_ACCOUNT", "비활성화된 계정입니다.")
    }
    return account
  }

  logout(): void {
    void this.client.auth.signOut({ scope: "local" })
  }

  async listAccounts(): Promise<ReadonlyArray<AuthAccount>> {
    return this.invoke({ operation: "list" })
  }

  async createAccount(input: CreateAccountInput): Promise<ReadonlyArray<AuthAccount>> {
    return this.invoke({ operation: "create", ...input })
  }

  async updateAccount(input: UpdateAccountInput): Promise<ReadonlyArray<AuthAccount>> {
    return this.invoke({ operation: "update", ...input })
  }

  async resetPassword(input: ResetPasswordInput): Promise<ReadonlyArray<AuthAccount>> {
    return this.invoke({ operation: "reset_password", ...input })
  }

  async deleteAccount(accountId: string): Promise<ReadonlyArray<AuthAccount>> {
    return this.invoke({ operation: "delete", accountId })
  }

  private async loadOwnProfile(userId: string): Promise<AuthAccount> {
    const result = await this.client.from("profiles").select("*").eq("auth_user_id", userId).single()
    if (result.error !== null) throw new AuthError("FORBIDDEN", "계정 권한 정보가 없습니다.")
    return publicAccount(profileSchema.parse(result.data))
  }

  private async invoke(body: unknown): Promise<ReadonlyArray<AuthAccount>> {
    try {
      return (await invokeAuthenticated("account-admin", body, accountsResponseSchema)).accounts
    } catch (error) {
      throw authFailure(error)
    }
  }
}

export function createSupabaseAuthRepository(client: SupabaseClient, projectUrl: string): AuthRepository {
  return new SupabaseAuthRepository(client, new URL(projectUrl).hostname)
}
