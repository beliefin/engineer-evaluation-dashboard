"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { CalendarEventView } from "./types"

type DeleteEventDialogProps = Readonly<{
  event: CalendarEventView
  onClose: () => void
  onDelete: (eventId: string) => boolean
}>

export function DeleteEventDialog({ event, onClose, onDelete }: DeleteEventDialogProps) {
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (onDelete(event.id)) {
      onClose()
    } else {
      setError("일정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.")
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent role="alertdialog">
        <DialogHeader>
          <DialogTitle>일정을 삭제할까요?</DialogTitle>
          <DialogDescription>
            {event.engineerName}의 &apos;{event.title}&apos; 일정을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        {error === null ? null : (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}
        <DialogFooter className="mt-2">
          <Button onClick={onClose} type="button" variant="outline">취소</Button>
          <Button onClick={handleDelete} type="button" variant="destructive">삭제 확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
