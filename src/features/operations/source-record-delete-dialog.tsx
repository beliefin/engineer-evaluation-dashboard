"use client"

import { Trash2 } from "lucide-react"
import { useState } from "react"

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

interface SourceRecordDeleteDialogProps {
  readonly accessibleName: string
  readonly recordLabel: string
  readonly disabled: boolean
  readonly onDelete: () => boolean
}

export function SourceRecordDeleteDialog({
  accessibleName,
  recordLabel,
  disabled,
  onDelete,
}: SourceRecordDeleteDialogProps) {
  const [open, setOpen] = useState(false)

  function handleDelete() {
    if (onDelete()) setOpen(false)
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          aria-label={accessibleName}
          disabled={disabled}
          size="icon-xs"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>원천 기록 삭제</DialogTitle>
          <DialogDescription>
            {recordLabel} 기록을 삭제합니다. 연결된 환산 점수는 남은 기록을 기준으로 다시 계산됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">취소</Button>
          </DialogClose>
          <Button onClick={handleDelete} type="button" variant="destructive">
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
