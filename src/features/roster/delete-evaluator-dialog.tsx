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

import type { EvaluatorRosterItem } from "./types"

type DeleteEvaluatorDialogProps = Readonly<{
  evaluator: EvaluatorRosterItem
  onClose: () => void
  onDelete: (evaluatorId: string) => boolean
}>

export function DeleteEvaluatorDialog({ evaluator, onClose, onDelete }: DeleteEvaluatorDialogProps) {
  const [error, setError] = useState("")

  function handleDelete() {
    if (onDelete(evaluator.id)) onClose()
    else setError("삭제하지 못했습니다. 연결된 시즌의 잠금 상태를 확인해 주세요.")
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md" role="alertdialog">
        <DialogHeader>
          <DialogTitle>{evaluator.displayName} 평가자를 삭제할까요?</DialogTitle>
          <DialogDescription>
            명단뿐 아니라 과제별 평가자 가중치와 평가 배정이 삭제되며,{" "}
            <span className="whitespace-nowrap">작성한 평가표도 함께 삭제됩니다.</span>{" "}
            <span className="whitespace-nowrap">이 작업은 되돌릴 수 없습니다.</span>
          </DialogDescription>
        </DialogHeader>
        {error === "" ? null : <p className="text-sm text-destructive" role="alert">{error}</p>}
        <DialogFooter>
          <Button onClick={onClose} type="button" variant="outline">취소</Button>
          <Button onClick={handleDelete} type="button" variant="destructive">평가자 삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
