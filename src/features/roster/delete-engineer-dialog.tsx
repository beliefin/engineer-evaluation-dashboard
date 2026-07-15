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

import type { EngineerRosterItem } from "./types"

type DeleteEngineerDialogProps = Readonly<{
  engineer: EngineerRosterItem
  onClose: () => void
  onDelete: (engineerId: string) => boolean
}>

export function DeleteEngineerDialog({ engineer, onClose, onDelete }: DeleteEngineerDialogProps) {
  const [error, setError] = useState("")

  function handleDelete() {
    if (onDelete(engineer.id)) onClose()
    else setError("삭제하지 못했습니다. 연결된 시즌의 잠금 상태를 확인해 주세요.")
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md" role="alertdialog">
        <DialogHeader>
          <DialogTitle>{engineer.displayName} 엔지니어를 삭제할까요?</DialogTitle>
          <DialogDescription>
            명단뿐 아니라 연결된 평가표, 직접점수, 자격·어학 기록과{" "}
            <span className="whitespace-nowrap">평가 일정이 함께 삭제됩니다.</span>{" "}
            <span className="whitespace-nowrap">이 작업은 되돌릴 수 없습니다.</span>
          </DialogDescription>
        </DialogHeader>
        {error === "" ? null : <p className="text-sm text-destructive" role="alert">{error}</p>}
        <DialogFooter>
          <Button onClick={onClose} type="button" variant="outline">취소</Button>
          <Button onClick={handleDelete} type="button" variant="destructive">엔지니어 삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
