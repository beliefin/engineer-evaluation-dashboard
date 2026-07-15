import type {
  AuthAccount,
  AuthErrorCode,
  CreateAccountInput,
  ResetPasswordInput,
  UpdateAccountInput,
} from "@/auth"

export type AccountActionResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; message: string; code?: AuthErrorCode }>

export type AuthEvaluatorOption = Readonly<{ id: string; label: string }>
export type AuthEngineerOption = Readonly<{ id: string; label: string }>

export type AccountManagementProps = Readonly<{
  accounts: ReadonlyArray<AuthAccount>
  currentAccountId: string
  evaluatorOptions: ReadonlyArray<AuthEvaluatorOption>
  engineerOptions: ReadonlyArray<AuthEngineerOption>
  pending?: boolean
  onCreate: (input: CreateAccountInput) => Promise<AccountActionResult>
  onUpdate: (input: UpdateAccountInput) => Promise<AccountActionResult>
  onResetPassword: (input: ResetPasswordInput) => Promise<AccountActionResult>
  onDelete: (accountId: string) => Promise<AccountActionResult>
}>
