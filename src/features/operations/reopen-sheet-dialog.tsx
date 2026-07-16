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
      setReason(`평가자 요청 승인: ${sheet.requestReason}`)
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
          잠금 해제
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>잠금 해제 요청 승인</DialogTitle>
            <DialogDescription>
              <span className="block">
                {sheet.engineerName} · {sheet.taskLabel ?? sheet.categoryLabel} · {sheet.evaluatorName}
              </span>
              <span className="mt-1 block">제출 시각 {sheet.submittedAtLabel}</span>
              <span className="mt-1 block">요청 사유: {sheet.requestReason}</span>
              <span className="mt-1 block">이 평가의 잠금을 해제하며, 사유는 감사 기록에 남습니다.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="my-5">
            <label className="text-sm font-medium" htmlFor={reasonId}>
              잠금 해제 사유
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
