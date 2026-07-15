"use client"

import { useState } from "react"

import type { AuthAccount } from "@/auth"
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

import type { AccountManagementProps } from "./types"

type ToggleAccountDialogProps = Readonly<{
  account: AuthAccount
  pending: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: AccountManagementProps["onUpdate"]
}>

export function ToggleAccountDialog({
  account,
  pending,
  open,
  onOpenChange,
  onUpdate,
}: ToggleAccountDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const nextActive = !account.active
  const actionLabel = nextActive ? "활성화" : "비활성화"

  async function handleConfirm() {
    setErrorMessage(null)
    const result = await onUpdate({
      accountId: account.id,
      displayName: account.displayName,
      role: account.role,
      evaluatorId: account.evaluatorId,
      engineerId: account.engineerId,
      active: nextActive,
    })
    if (result.ok) onOpenChange(false)
    else setErrorMessage(result.message)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>계정을 {actionLabel}할까요?</DialogTitle>
          <DialogDescription>
            <span className="whitespace-nowrap">{account.displayName} ({account.username})</span>{" "}
            계정을 {actionLabel}합니다.
            {!nextActive ? " 비활성 계정은 로그인할 수 없습니다." : null}
          </DialogDescription>
        </DialogHeader>
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">
            취소
          </Button>
          <Button
            disabled={pending}
            onClick={handleConfirm}
            type="button"
            variant={nextActive ? "default" : "destructive"}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
