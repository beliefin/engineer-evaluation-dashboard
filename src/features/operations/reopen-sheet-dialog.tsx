"use client"

import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import type { SubmittedSheetViewModel } from "./types"

interface ReopenSheetDialogProps {
  readonly sheet: SubmittedSheetViewModel
  readonly disabled: boolean
  readonly onReopen: (sheetId: string, reason: string) => void
}

export function ReopenSheetDialog({
  sheet,
  disabled,
  onReopen,
}: ReopenSheetDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const reasonId = useId()
  const helpId = `${reasonId}-help`

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setReason("")
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedReason = reason.trim()
    if (normalizedReason === "") {
      return
    }

    onReopen(sheet.sheetId, normalizedReason)
    setOpen(false)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled} size="sm" variant="outline">
          재오픈
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>제출 평가 재오픈</DialogTitle>
            <DialogDescription>
              {sheet.engineerName}의 {sheet.categoryLabel} 평가 잠금을 해제합니다.
              이 작업과 사유는 감사 기록에 남습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="my-5">
            <label className="text-sm font-medium" htmlFor={reasonId}>
              재오픈 사유
            </label>
            <Textarea
              aria-describedby={helpId}
              autoFocus
              className="mt-2 min-h-24 resize-y"
              id={reasonId}
              onChange={(event) => setReason(event.currentTarget.value)}
              placeholder="수정이 필요한 이유를 입력해 주세요."
              value={reason}
            />
            <p className="mt-1.5 text-xs text-muted-foreground" id={helpId}>
              공백을 제외하고 1자 이상 입력해야 합니다.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
            <Button disabled={reason.trim().length === 0} type="submit">
              잠금 해제
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
