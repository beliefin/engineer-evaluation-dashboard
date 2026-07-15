import { ZodError } from "zod"

import {
  authSessionSchema,
  authSnapshotSchema,
  createAccountInputSchema,
  loginInputSchema,
  resetPasswordInputSchema,
  updateAccountInputSchema,
} from "./schema"
import { createSeedAuthSnapshot } from "./seed"
import type {
  AuthAccount,
  AuthAccountRecord,
  AuthRepository,
  AuthRepositoryConfig,
  AuthSessionRecord,
  AuthSnapshot,
} from "./types"
export { AuthError, type AuthStorage, type PasswordHasher } from "./types"
import { AuthError } from "./types"

export const AUTH_STORAGE_KEY = "engineer-evaluation-dashboard:auth:v1"
export const AUTH_SESSION_KEY = "engineer-evaluation-dashboard:auth-session:v1"
const SESSION_DURATION_MS = 12 * 60 * 60 * 1_000

type ResolvedAuthRepositoryConfig = Required<AuthRepositoryConfig>

function publicAccount(account: AuthAccountRecord): AuthAccount {
  return {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    role: account.role,
    evaluatorId: account.evaluatorId,
    engineerId: account.engineerId,
    active: account.active,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }
}

class LocalStorageAuthRepository implements AuthRepository {
  constructor(private readonly config: ResolvedAuthRepositoryConfig) {}

  async restoreSession(): Promise<AuthAccount | null> {
    const session = this.readSession()
    if (session === null) return null
    const snapshot = await this.loadSnapshot()
    const account = snapshot.accounts.find((entry) => entry.id === session.accountId)
    const expired = session.expiresAt <= Date.parse(this.config.now())
    if (account === undefined || !account.active || expired) {
      this.logout()
      return null
    }
    return publicAccount(account)
  }

  async login(rawInput: Parameters<AuthRepository["login"]>[0]): Promise<AuthAccount> {
    const input = this.parse(() => loginInputSchema.parse(rawInput))
    const snapshot = await this.loadSnapshot()
    const account = snapshot.accounts.find((entry) => entry.username === input.username)
    if (account === undefined) {
      throw new AuthError("INVALID_CREDENTIALS", "아이디 또는 비밀번호가 일치하지 않습니다.")
    }
    const passwordHash = await this.config.hashPassword(input.password, account.passwordSalt)
    if (passwordHash !== account.passwordHash) {
      throw new AuthError("INVALID_CREDENTIALS", "아이디 또는 비밀번호가 일치하지 않습니다.")
    }
    if (!account.active) throw new AuthError("INACTIVE_ACCOUNT", "비활성화된 계정입니다.")
    this.writeSession({
      schemaVersion: 1,
      accountId: account.id,
      expiresAt: Date.parse(this.config.now()) + SESSION_DURATION_MS,
    })
    return publicAccount(account)
  }

  logout(): void {
    this.config.storage.removeItem(AUTH_SESSION_KEY)
  }

  async listAccounts(): Promise<ReadonlyArray<AuthAccount>> {
    const snapshot = await this.loadSnapshot()
    this.requireOperator(snapshot)
    return this.toPublicAccounts(snapshot)
  }

  async createAccount(rawInput: Parameters<AuthRepository["createAccount"]>[0]) {
    const input = this.parse(() => createAccountInputSchema.parse(rawInput))
    const snapshot = await this.loadSnapshot()
    this.requireOperator(snapshot)
    if (snapshot.accounts.some((entry) => entry.username === input.username)) {
      throw new AuthError("DUPLICATE_USERNAME", "이미 사용 중인 아이디입니다.")
    }
    const now = this.config.now()
    const salt = this.config.saltFactory()
    const account: AuthAccountRecord = {
      ...input,
      id: this.config.idFactory(),
      createdAt: now,
      updatedAt: now,
      passwordSalt: salt,
      passwordHash: await this.config.hashPassword(input.password, salt),
    }
    return this.persist({ ...snapshot, accounts: [...snapshot.accounts, account] })
  }

  async updateAccount(rawInput: Parameters<AuthRepository["updateAccount"]>[0]) {
    const input = this.parse(() => updateAccountInputSchema.parse(rawInput))
    const snapshot = await this.loadSnapshot()
    const actor = this.requireOperator(snapshot)
    const target = this.findAccount(snapshot, input.accountId)
    if (target.id === actor.id && (!input.active || input.role !== "operator")) {
      throw new AuthError("SELF_LOCKOUT", "현재 로그인한 운영자 계정은 잠글 수 없습니다.")
    }
    this.requireRemainingOperator(snapshot, target, input.role, input.active)
    const accounts = snapshot.accounts.map((entry) => entry.id === target.id
      ? { ...entry, ...input, updatedAt: this.config.now() }
      : entry)
    return this.persist({ ...snapshot, accounts })
  }

  async resetPassword(rawInput: Parameters<AuthRepository["resetPassword"]>[0]) {
    const input = this.parse(() => resetPasswordInputSchema.parse(rawInput))
    const snapshot = await this.loadSnapshot()
    this.requireOperator(snapshot)
    const target = this.findAccount(snapshot, input.accountId)
    const salt = this.config.saltFactory()
    const passwordHash = await this.config.hashPassword(input.password, salt)
    const accounts = snapshot.accounts.map((entry) => entry.id === target.id
      ? {
          ...entry,
          passwordSalt: salt,
          passwordHash,
          updatedAt: this.config.now(),
        }
      : entry)
    return this.persist({ ...snapshot, accounts })
  }

  async deleteAccount(accountId: string) {
    const snapshot = await this.loadSnapshot()
    const actor = this.requireOperator(snapshot)
    const target = this.findAccount(snapshot, accountId)
    if (target.id === actor.id) {
      throw new AuthError("SELF_LOCKOUT", "현재 로그인한 운영자 계정은 삭제할 수 없습니다.")
    }
    this.requireRemainingOperator(snapshot, target, "approver", false)
    return this.persist({
      ...snapshot,
      accounts: snapshot.accounts.filter((entry) => entry.id !== target.id),
    })
  }

  private async loadSnapshot(): Promise<AuthSnapshot> {
    const stored = this.config.storage.getItem(AUTH_STORAGE_KEY)
    if (stored === null) {
      const seeded = await createSeedAuthSnapshot(this.config.hashPassword, this.config.now())
      this.writeSnapshot(seeded)
      return seeded
    }
    try {
      const parsed: unknown = JSON.parse(stored)
      return authSnapshotSchema.parse(parsed)
    } catch (error) {
      if (error instanceof ZodError || error instanceof SyntaxError) {
        throw new AuthError("INVALID_INPUT", "저장된 계정 데이터를 읽을 수 없습니다.", { cause: error })
      }
      throw error
    }
  }

  private requireOperator(snapshot: AuthSnapshot): AuthAccountRecord {
    const session = this.readSession()
    const actor = snapshot.accounts.find((entry) => entry.id === session?.accountId)
    if (actor === undefined || !actor.active || actor.role !== "operator") {
      throw new AuthError("FORBIDDEN", "운영자 권한이 필요합니다.")
    }
    return actor
  }

  private findAccount(snapshot: AuthSnapshot, accountId: string): AuthAccountRecord {
    const account = snapshot.accounts.find((entry) => entry.id === accountId)
    if (account === undefined) throw new AuthError("NOT_FOUND", "계정을 찾을 수 없습니다.")
    return account
  }

  private requireRemainingOperator(
    snapshot: AuthSnapshot,
    target: AuthAccountRecord,
    nextRole: AuthAccountRecord["role"],
    nextActive: boolean,
  ): void {
    const removesOperator = target.role === "operator" && target.active &&
      (nextRole !== "operator" || !nextActive)
    const activeOperators = snapshot.accounts.filter((entry) => entry.role === "operator" && entry.active)
    if (removesOperator && activeOperators.length === 1) {
      throw new AuthError("LAST_OPERATOR", "마지막 활성 운영자 계정은 제거할 수 없습니다.")
    }
  }

  private readSession(): AuthSessionRecord | null {
    const stored = this.config.storage.getItem(AUTH_SESSION_KEY)
    if (stored === null) return null
    try {
      const parsed: unknown = JSON.parse(stored)
      return authSessionSchema.parse(parsed)
    } catch (error) {
      if (error instanceof ZodError || error instanceof SyntaxError) {
        this.logout()
        return null
      }
      throw error
    }
  }

  private writeSession(session: AuthSessionRecord): void {
    this.write(AUTH_SESSION_KEY, JSON.stringify(session))
  }

  private writeSnapshot(snapshot: AuthSnapshot): void {
    this.write(AUTH_STORAGE_KEY, JSON.stringify(snapshot))
  }

  private write(key: string, value: string): void {
    try {
      this.config.storage.setItem(key, value)
    } catch (error) {
      throw new AuthError("STORAGE_UNAVAILABLE", "브라우저 저장소를 사용할 수 없습니다.", {
        cause: error,
      })
    }
  }

  private persist(snapshot: AuthSnapshot): ReadonlyArray<AuthAccount> {
    this.writeSnapshot(snapshot)
    return this.toPublicAccounts(snapshot)
  }

  private toPublicAccounts(snapshot: AuthSnapshot): ReadonlyArray<AuthAccount> {
    return snapshot.accounts.map(publicAccount).sort((left, right) =>
      left.username.localeCompare(right.username, "en"))
  }

  private parse<T>(parser: () => T): T {
    try {
      return parser()
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AuthError("INVALID_INPUT", error.issues[0]?.message ?? "입력값을 확인해 주세요.", {
          cause: error,
        })
      }
      throw error
    }
  }
}

export function createLocalStorageAuthRepository(
  config: AuthRepositoryConfig,
): AuthRepository {
  return new LocalStorageAuthRepository({
    storage: config.storage,
    hashPassword: config.hashPassword,
    now: config.now ?? (() => new Date().toISOString()),
    idFactory: config.idFactory ?? (() => globalThis.crypto.randomUUID()),
    saltFactory: config.saltFactory ?? (() => globalThis.crypto.randomUUID()),
  })
}
