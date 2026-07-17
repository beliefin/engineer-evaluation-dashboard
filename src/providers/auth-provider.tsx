"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import {
  AuthError,
  createLocalStorageAuthRepository,
  createSupabaseAuthRepository,
  hashPasswordWithWebCrypto,
  type AuthAccount,
  type AuthErrorCode,
  type AuthRepository,
  type ChangeOwnPasswordInput,
  type CreateAccountInput,
  type LoginInput,
  type ResetPasswordInput,
  type UpdateAccountInput,
} from "@/auth"
import { getSupabaseBrowserClient, getSupabasePublicConfig } from "@/backend/supabase-client"
import type { Role } from "@/domain"

export type AuthActionResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; message: string; code?: AuthErrorCode }>

export type AuthLoginResult =
  | Readonly<{ ok: true; role: Role }>
  | Readonly<{ ok: false; message: string }>

export type AuthLoadState = "loading" | "ready" | "error"

type AuthContextValue = Readonly<{
  session: AuthAccount | null
  accounts: ReadonlyArray<AuthAccount>
  loadState: AuthLoadState
  pending: boolean
  errorMessage: string | null
  login: (input: LoginInput) => Promise<AuthLoginResult>
  logout: () => void
  switchRole: (role: Role) => void
  createAccount: (input: CreateAccountInput) => Promise<AuthActionResult>
  updateAccount: (input: UpdateAccountInput) => Promise<AuthActionResult>
  resetPassword: (input: ResetPasswordInput) => Promise<AuthActionResult>
  changeOwnPassword: (input: ChangeOwnPasswordInput) => Promise<AuthActionResult>
  deleteAccount: (accountId: string) => Promise<AuthActionResult>
}>

const AuthContext = createContext<AuthContextValue | null>(null)
type AccountMutation = (repository: AuthRepository) => Promise<ReadonlyArray<AuthAccount>>
const ACTIVE_ROLE_KEY = "engineer-evaluation-dashboard:active-role"

function accountWithStoredRole(account: AuthAccount): AuthAccount {
  try {
    const stored = window.sessionStorage.getItem(ACTIVE_ROLE_KEY)
    if (stored !== null && account.roles.some((role) => role === stored)) {
      return { ...account, role: stored as Role }
    }
  } catch {
    return account
  }
  return account
}

function storeActiveRole(role: Role): void {
  try {
    window.sessionStorage.setItem(ACTIVE_ROLE_KEY, role)
  } catch {
    return
  }
}

function clearActiveRole(): void {
  try {
    window.sessionStorage.removeItem(ACTIVE_ROLE_KEY)
  } catch {
    return
  }
}

function failureResult(error: unknown): Readonly<{
  ok: false
  message: string
  code?: AuthErrorCode
}> {
  if (error instanceof AuthError) {
    return { ok: false, message: error.message, code: error.code }
  }
  return { ok: false, message: "인증 저장소 처리 중 오류가 발생했습니다." }
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const repositoryRef = useRef<AuthRepository | null>(null)
  const [session, setSession] = useState<AuthAccount | null>(null)
  const [accounts, setAccounts] = useState<ReadonlyArray<AuthAccount>>([])
  const [loadState, setLoadState] = useState<AuthLoadState>("loading")
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const config = getSupabasePublicConfig()
    const repository = config !== null
      ? createSupabaseAuthRepository(getSupabaseBrowserClient(), config.url)
      : createLocalStorageAuthRepository({
          storage: window.localStorage,
          hashPassword: hashPasswordWithWebCrypto,
        })
    repositoryRef.current = repository
    let active = true
    void repository.restoreSession().then(async (restored) => {
      if (!active) return
      const activeAccount = restored === null ? null : accountWithStoredRole(restored)
      const visibleAccounts = restored?.roles.includes("operator") === true
        ? await repository.listAccounts()
        : []
      if (!active) return
      setSession(activeAccount)
      setAccounts(visibleAccounts)
      setLoadState("ready")
    }).catch((error: unknown) => {
      if (!active) return
      const failure = failureResult(error)
      setErrorMessage(failure.message)
      setLoadState("error")
    })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (input: LoginInput): Promise<AuthLoginResult> => {
    const repository = repositoryRef.current
    if (repository === null) return { ok: false, message: "인증 저장소를 준비하고 있습니다." }
    setPending(true)
    setErrorMessage(null)
    try {
      const account = await repository.login(input)
      const visibleAccounts = account.roles.includes("operator") ? await repository.listAccounts() : []
      storeActiveRole(account.role)
      setSession(account)
      setAccounts(visibleAccounts)
      return { ok: true, role: account.role }
    } catch (error) {
      const failure = failureResult(error)
      setErrorMessage(failure.message)
      return failure
    } finally {
      setPending(false)
    }
  }, [])

  const logout = useCallback(() => {
    repositoryRef.current?.logout()
    setSession(null)
    setAccounts([])
    setErrorMessage(null)
    clearActiveRole()
  }, [])

  const switchRole = useCallback((role: Role) => {
    setSession((current) => {
      if (current === null || !current.roles.includes(role) || current.role === role) return current
      storeActiveRole(role)
      return { ...current, role }
    })
  }, [])

  const runAccountMutation = useCallback(async (
    mutation: AccountMutation,
    successMessage: string,
  ): Promise<AuthActionResult> => {
    const repository = repositoryRef.current
    if (repository === null) return { ok: false, message: "인증 저장소를 준비하고 있습니다." }
    setPending(true)
    setErrorMessage(null)
    try {
      const nextAccounts = await mutation(repository)
      setAccounts(nextAccounts)
      toast.success(successMessage)
      return { ok: true }
    } catch (error) {
      const failure = failureResult(error)
      setErrorMessage(failure.message)
      toast.error(failure.message)
      return failure
    } finally {
      setPending(false)
    }
  }, [])

  const createAccount = useCallback((input: CreateAccountInput) =>
    runAccountMutation(
      (repository) => repository.createAccount(input),
      "계정을 추가했습니다.",
    ), [runAccountMutation])

  const updateAccount = useCallback((input: UpdateAccountInput) =>
    runAccountMutation(
      (repository) => repository.updateAccount(input),
      "계정 정보를 저장했습니다.",
    ), [runAccountMutation])

  const resetPassword = useCallback((input: ResetPasswordInput) =>
    runAccountMutation(
      (repository) => repository.resetPassword(input),
      "비밀번호를 재설정했습니다.",
    ), [runAccountMutation])

  const changeOwnPassword = useCallback(async (input: ChangeOwnPasswordInput): Promise<AuthActionResult> => {
    const repository = repositoryRef.current
    if (repository === null) return { ok: false, message: "인증 저장소를 준비하고 있습니다." }
    setPending(true)
    setErrorMessage(null)
    try {
      const account = await repository.changeOwnPassword(input)
      setSession((current) => current === null ? account : { ...account, role: current.role })
      toast.success("비밀번호를 변경했습니다.")
      return { ok: true }
    } catch (error) {
      const failure = failureResult(error)
      setErrorMessage(failure.message)
      toast.error(failure.message)
      return failure
    } finally {
      setPending(false)
    }
  }, [])

  const deleteAccount = useCallback((accountId: string) =>
    runAccountMutation(
      (repository) => repository.deleteAccount(accountId),
      "계정을 삭제했습니다.",
    ), [runAccountMutation])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    accounts,
    loadState,
    pending,
    errorMessage,
    login,
    logout,
    switchRole,
    createAccount,
    updateAccount,
    resetPassword,
    changeOwnPassword,
    deleteAccount,
  }), [
    accounts,
    createAccount,
    deleteAccount,
    errorMessage,
    loadState,
    login,
    logout,
    switchRole,
    pending,
    resetPassword,
    changeOwnPassword,
    session,
    updateAccount,
  ])

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) throw new Error("useAuth must be used within AuthProvider")
  return context
}
