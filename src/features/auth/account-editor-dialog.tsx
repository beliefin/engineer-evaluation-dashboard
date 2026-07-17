"use client"

import { useMemo, useState, type FormEvent } from "react"

import { passwordSchema, usernameSchema, type AuthAccount } from "@/auth"
import type { Role } from "@/domain"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { AccountRoleFields } from "./account-role-fields"
import type {
  AccountManagementProps,
  AuthEngineerOption,
  AuthEvaluatorOption,
} from "./types"

type AccountEditorDialogProps = Readonly<{
  account: AuthAccount | null
  currentAccountId: string
  evaluatorOptions: ReadonlyArray<AuthEvaluatorOption>
  engineerOptions: ReadonlyArray<AuthEngineerOption>
  open: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onCreate: AccountManagementProps["onCreate"]
  onUpdate: AccountManagementProps["onUpdate"]
}>

type EditorField = "username" | "displayName" | "evaluator" | "engineer" | "password"
type EditorFieldErrors = Partial<Record<EditorField, string>>

export function AccountEditorDialog({
  account,
  currentAccountId,
  evaluatorOptions,
  engineerOptions,
  open,
  pending,
  onOpenChange,
  onCreate,
  onUpdate,
}: AccountEditorDialogProps) {
  const [username, setUsername] = useState(account?.username ?? "")
  const [displayName, setDisplayName] = useState(account?.displayName ?? "")
  const [roles, setRoles] = useState<ReadonlyArray<Role>>(account?.roles ?? ["approver"])
  const [evaluatorId, setEvaluatorId] = useState(account?.evaluatorId ?? "")
  const [engineerId, setEngineerId] = useState(account?.engineerId ?? "")
  const [password, setPassword] = useState("")
  const [active, setActive] = useState(account?.active ?? true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<EditorFieldErrors>({})
  const self = account?.id === currentAccountId
  const linkedInitialPassword = useMemo(() => {
    if (account !== null) return null
    const engineerCode = engineerOptions.find((option) => option.id === engineerId)?.employeeCode
    const evaluatorCode = evaluatorOptions.find((option) => option.id === evaluatorId)?.employeeCode
    return engineerCode ?? evaluatorCode ?? null
  }, [account, engineerId, engineerOptions, evaluatorId, evaluatorOptions])

  const effectivePassword = linkedInitialPassword ?? password

  function clearFieldError(field: EditorField) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validateFields(): EditorFieldErrors {
    const nextErrors: EditorFieldErrors = {}
    if (displayName.trim().length < 2) {
      nextErrors.displayName = "표시 이름은 2자 이상 입력해 주세요."
    }
    if (roles.includes("evaluator") && evaluatorId.length === 0) {
      nextErrors.evaluator = "평가자 역할은 등록된 평가자와 연결해야 합니다."
    }
    if (roles.includes("engineer") && engineerId.length === 0) {
      nextErrors.engineer = "엔지니어 역할은 등록된 엔지니어와 연결해야 합니다."
    }
    if (account === null) {
      const usernameResult = usernameSchema.safeParse(username)
      const passwordResult = passwordSchema.safeParse(effectivePassword)
      if (!usernameResult.success) {
        nextErrors.username = usernameResult.error.issues[0]?.message ?? "아이디를 확인해 주세요."
      }
      if (!passwordResult.success) {
        nextErrors.password = passwordResult.error.issues[0]?.message ?? "비밀번호를 확인해 주세요."
      }
    }
    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    const nextFieldErrors = validateFields()
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage("입력한 내용을 확인해 주세요.")
      return
    }
    const role = roles[0] ?? "approver"
    const linkedEvaluatorId = roles.includes("evaluator") && evaluatorId.length > 0 ? evaluatorId : null
    const linkedEngineerId = roles.includes("engineer") && engineerId.length > 0 ? engineerId : null
    const result = account === null
      ? await onCreate({
          username,
          displayName,
          role,
          roles,
          evaluatorId: linkedEvaluatorId,
          engineerId: linkedEngineerId,
          password: effectivePassword,
          active,
        })
      : await onUpdate({
          accountId: account.id,
          displayName,
          role,
          roles,
          evaluatorId: linkedEvaluatorId,
          engineerId: linkedEngineerId,
          active,
        })
    if (result.ok) {
      onOpenChange(false)
      return
    }
    setErrorMessage(result.message)
    if (result.code === "DUPLICATE_USERNAME") {
      setFieldErrors({ username: result.message })
    } else if (result.code === "INVALID_INPUT" && account === null) {
      setFieldErrors({ password: result.message })
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <form noValidate onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{account === null ? "계정 추가" : "계정 편집"}</DialogTitle>
            <DialogDescription>
              로그인 정보와 역할을 설정합니다.
              <span className="block">평가자·엔지니어 역할은 등록 명단에 연결해야 합니다.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-5">
            <div className="space-y-2">
              <Label htmlFor="account-username">아이디</Label>
              <Input
                aria-describedby={fieldErrors.username ? "account-username-error" : undefined}
                aria-invalid={Boolean(fieldErrors.username)}
                autoComplete="off"
                disabled={account !== null || pending}
                id="account-username"
                onChange={(event) => {
                  setUsername(event.currentTarget.value.toLowerCase())
                  clearFieldError("username")
                }}
                required
                value={username}
              />
              {fieldErrors.username ? (
                <p className="text-xs text-destructive" data-testid="account-username-error" id="account-username-error">
                  {fieldErrors.username}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-display-name">표시 이름</Label>
              <Input
                aria-describedby={fieldErrors.displayName ? "account-display-name-error" : undefined}
                aria-invalid={Boolean(fieldErrors.displayName)}
                disabled={pending}
                id="account-display-name"
                onChange={(event) => {
                  setDisplayName(event.currentTarget.value)
                  clearFieldError("displayName")
                }}
                required
                value={displayName}
              />
              {fieldErrors.displayName ? (
                <p className="text-xs text-destructive" id="account-display-name-error">{fieldErrors.displayName}</p>
              ) : null}
            </div>
            <AccountRoleFields
              disabled={pending}
              engineerError={fieldErrors.engineer}
              engineerId={engineerId}
              engineerOptions={engineerOptions}
              evaluatorError={fieldErrors.evaluator}
              evaluatorId={evaluatorId}
              evaluatorOptions={evaluatorOptions}
              onEngineerChange={(value) => {
                setEngineerId(value)
                clearFieldError("engineer")
              }}
              onEvaluatorChange={(value) => {
                setEvaluatorId(value)
                clearFieldError("evaluator")
              }}
              onRolesChange={(value) => {
                setRoles(value)
                if (!value.includes("evaluator")) setEvaluatorId("")
                if (!value.includes("engineer")) setEngineerId("")
                clearFieldError("evaluator")
                clearFieldError("engineer")
              }}
              roles={roles}
              roleDisabled={self || pending}
            />
            {account === null ? (
              <div className="space-y-2">
                <Label htmlFor="account-password">초기 비밀번호</Label>
                <Input
                  aria-describedby={fieldErrors.password ? "account-password-error" : "account-password-help"}
                  aria-invalid={Boolean(fieldErrors.password)}
                  autoComplete="new-password"
                  disabled={pending || linkedInitialPassword !== null}
                  id="account-password"
                  onChange={(event) => {
                    setPassword(event.currentTarget.value)
                    clearFieldError("password")
                  }}
                  required
                  type="password"
                  value={effectivePassword}
                />
                {fieldErrors.password ? (
                  <p className="text-xs text-destructive" id="account-password-error">{fieldErrors.password}</p>
                ) : (
                  <p className="text-xs text-muted-foreground" id="account-password-help">
                    {linkedInitialPassword !== null
                      ? "연결한 명단의 사번 4자리로 자동 설정됩니다."
                      : "숫자 또는 문자를 포함해 4자 이상 입력합니다."}
                  </p>
                )}
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={active}
                disabled={self || pending}
                onChange={(event) => setActive(event.currentTarget.checked)}
                type="checkbox"
              />
              활성 계정
            </label>
            {self ? <p className="text-xs text-muted-foreground">현재 계정은 역할과 활성 상태를 변경할 수 없습니다.</p> : null}
            {errorMessage ? <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}
          </div>
          <DialogFooter>
            <Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">취소</Button>
            <Button disabled={pending} type="submit">계정 저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
