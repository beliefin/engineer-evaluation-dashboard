"use client"

import { useId, useState, type FormEvent } from "react"

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

export function UnlockRequestDialog({
  pending,
  onRequest,
}: Readonly<{ pending: boolean; onRequest: (reason: string) => void }>) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const reasonId = useId()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = reason.trim()
    if (value.length === 0) return
    onRequest(value)
    setOpen(false)
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button disabled={pending} size="sm" type="button" variant="outline">
          {pending ? "잠금 해제 요청 중" : "잠금 해제 요청"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>평가 잠금 해제 요청</DialogTitle>
            <DialogDescription>수정이 필요한 이유를 적어 보내면 운영자가 확인 후 잠금을 해제합니다.</DialogDescription>
          </DialogHeader>
          <div className="my-5 space-y-2">
            <label className="text-sm font-medium" htmlFor={reasonId}>수정 요청 사유</label>
            <Textarea
              autoFocus
              id={reasonId}
              maxLength={500}
              onChange={(event) => setReason(event.currentTarget.value)}
              placeholder="수정할 내용과 이유를 입력해 주세요."
              rows={4}
              value={reason}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
            <Button disabled={reason.trim().length === 0} type="submit">요청 보내기</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
