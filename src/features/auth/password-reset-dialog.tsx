"use client"

import { useState, type FormEvent } from "react"

import { passwordSchema, type AuthAccount } from "@/auth"
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

import type { AccountManagementProps } from "./types"

type PasswordResetDialogProps = Readonly<{
  account: AuthAccount
  pending: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onReset: AccountManagementProps["onResetPassword"]
}>

export function PasswordResetDialog({
  account,
  pending,
  open,
  onOpenChange,
  onReset,
}: PasswordResetDialogProps) {
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmationError, setConfirmationError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setPasswordError(null)
    setConfirmationError(null)
    const passwordResult = passwordSchema.safeParse(password)
    if (!passwordResult.success) {
      const message = passwordResult.error.issues[0]?.message ?? "비밀번호를 확인해 주세요."
      setPasswordError(message)
      setErrorMessage("입력한 내용을 확인해 주세요.")
      return
    }
    if (password !== confirmation) {
      const message = "비밀번호 확인이 일치하지 않습니다."
      setConfirmationError(message)
      setErrorMessage(message)
      return
    }
    const result = await onReset({ accountId: account.id, password })
    if (result.ok) onOpenChange(false)
    else {
      setErrorMessage(result.message)
      if (result.code === "INVALID_INPUT") setPasswordError(result.message)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <form noValidate onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>비밀번호 재설정</DialogTitle>
            <DialogDescription>{account.displayName} 계정의 새 비밀번호를 입력합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-5">
            <div className="space-y-2">
              <Label htmlFor="reset-password">새 비밀번호</Label>
              <Input
                aria-describedby={passwordError ? "reset-password-error" : "reset-password-help"}
                aria-invalid={Boolean(passwordError)}
                autoComplete="new-password"
                id="reset-password"
                onChange={(event) => {
                  setPassword(event.currentTarget.value)
                  setPasswordError(null)
                }}
                required
                type="password"
                value={password}
              />
              {passwordError ? (
                <p className="text-xs text-destructive" id="reset-password-error">{passwordError}</p>
              ) : (
                <p className="text-xs text-muted-foreground" id="reset-password-help">8자 이상으로 입력합니다.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password-confirmation">새 비밀번호 확인</Label>
              <Input
                aria-describedby={confirmationError ? "reset-password-confirmation-error" : undefined}
                aria-invalid={Boolean(confirmationError)}
                autoComplete="new-password"
                id="reset-password-confirmation"
                onChange={(event) => {
                  setConfirmation(event.currentTarget.value)
                  setConfirmationError(null)
                }}
                required
                type="password"
                value={confirmation}
              />
              {confirmationError ? (
                <p className="text-xs text-destructive" data-testid="reset-password-confirmation-error" id="reset-password-confirmation-error">
                  {confirmationError}
                </p>
              ) : null}
            </div>
            {errorMessage ? <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}
          </div>
          <DialogFooter>
            <Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">취소</Button>
            <Button disabled={pending} type="submit">비밀번호 저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
