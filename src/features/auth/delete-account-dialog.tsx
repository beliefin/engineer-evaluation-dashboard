"use client"

import type { AuthAccount } from "@/auth"
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

type DeleteAccountDialogProps = Readonly<{
  account: AuthAccount
  pending: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: AccountManagementProps["onDelete"]
}>

export function DeleteAccountDialog({
  account,
  pending,
  open,
  onOpenChange,
  onDelete,
}: DeleteAccountDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>계정을 삭제할까요?</DialogTitle>
          <DialogDescription>
            <span className="whitespace-nowrap">{account.displayName} ({account.username})</span>{" "}
            계정은 삭제 후 <span className="whitespace-nowrap">복구할 수 없습니다.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">취소</Button>
          <Button
            disabled={pending}
            onClick={async () => {
              const result = await onDelete(account.id)
              if (result.ok) onOpenChange(false)
            }}
            type="button"
            variant="destructive"
          >
            계정 삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
