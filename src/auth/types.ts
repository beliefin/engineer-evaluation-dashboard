import type { Role } from "@/domain"

export const AUTH_ERROR_CODES = [
  "INVALID_INPUT",
  "INVALID_CREDENTIALS",
  "INACTIVE_ACCOUNT",
  "FORBIDDEN",
  "NOT_FOUND",
  "DUPLICATE_USERNAME",
  "SELF_LOCKOUT",
  "LAST_OPERATOR",
  "STORAGE_UNAVAILABLE",
] as const

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number]

export class AuthError extends Error {
  readonly name = "AuthError"

  constructor(
    readonly code: AuthErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
  }
}

export type AuthAccount = Readonly<{
  id: string
  username: string
  displayName: string
  role: Role
  roles: ReadonlyArray<Role>
  evaluatorId: string | null
  engineerId: string | null
  active: boolean
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}>

export type AuthAccountRecord = AuthAccount & Readonly<{
  passwordSalt: string
  passwordHash: string
}>

export type AuthSnapshot = Readonly<{
  schemaVersion: 1
  accounts: ReadonlyArray<AuthAccountRecord>
}>

export type AuthSessionRecord = Readonly<{
  schemaVersion: 1
  accountId: string
  expiresAt: number
}>

export type LoginInput = Readonly<{ username: string; password: string }>

export type CreateAccountInput = Readonly<{
  username: string
  displayName: string
  role: Role
  roles: ReadonlyArray<Role>
  evaluatorId: string | null
  engineerId: string | null
  password: string
  active: boolean
}>

export type UpdateAccountInput = Readonly<{
  accountId: string
  displayName: string
  role: Role
  roles: ReadonlyArray<Role>
  evaluatorId: string | null
  engineerId: string | null
  active: boolean
}>

export type ResetPasswordInput = Readonly<{
  accountId: string
  password: string
}>

export type ChangeOwnPasswordInput = Readonly<{ password: string }>

export interface AuthStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type PasswordHasher = (password: string, salt: string) => Promise<string>

export type AuthRepositoryConfig = Readonly<{
  storage: AuthStorage
  hashPassword: PasswordHasher
  now?: () => string
  idFactory?: () => string
  saltFactory?: () => string
}>

export interface AuthRepository {
  restoreSession(): Promise<AuthAccount | null>
  login(input: LoginInput): Promise<AuthAccount>
  logout(): void
  listAccounts(): Promise<ReadonlyArray<AuthAccount>>
  createAccount(input: CreateAccountInput): Promise<ReadonlyArray<AuthAccount>>
  updateAccount(input: UpdateAccountInput): Promise<ReadonlyArray<AuthAccount>>
  resetPassword(input: ResetPasswordInput): Promise<ReadonlyArray<AuthAccount>>
  changeOwnPassword(input: ChangeOwnPasswordInput): Promise<AuthAccount>
  deleteAccount(accountId: string): Promise<ReadonlyArray<AuthAccount>>
}
