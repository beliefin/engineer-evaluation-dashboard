"use client"

import { Pencil, Plus } from "lucide-react"
import { useState, type FormEvent } from "react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type {
  LanguageScoreRecordDraft,
  LanguageScoreRecordViewModel,
} from "./types"

interface LanguageRecordDialogProps {
  readonly engineerId: string
  readonly engineerName: string
  readonly initial: LanguageScoreRecordViewModel | null
  readonly disabled: boolean
  readonly onSave: (record: LanguageScoreRecordDraft) => boolean
}

export function LanguageRecordDialog({
  engineerId,
  engineerName,
  initial,
  disabled,
  onSave,
}: LanguageRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [examName, setExamName] = useState(initial?.examName ?? "")
  const [result, setResult] = useState(initial?.result ?? "")
  const [acquiredOn, setAcquiredOn] = useState(initial?.acquiredOn ?? "")
  const [note, setNote] = useState(initial?.note ?? "")
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setExamName(initial?.examName ?? "")
    setResult(initial?.result ?? "")
    setAcquiredOn(initial?.acquiredOn ?? "")
    setNote(initial?.note ?? "")
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) resetForm()
    setOpen(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (examName.trim() === "" || result.trim() === "") {
      setError("시험명과 점수 또는 등급을 입력해 주세요.")
      return
    }
    const saved = onSave({
      recordId: initial?.id ?? null,
      engineerId,
      examName: examName.trim(),
      result: result.trim(),
      acquiredOn: acquiredOn === "" ? null : acquiredOn,
      note: note.trim() === "" ? null : note.trim(),
    })
    if (saved) setOpen(false)
  }

  const editing = initial !== null
  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button
          aria-label={editing ? `${engineerName} ${initial.examName} 어학 성적 수정` : undefined}
          disabled={disabled}
          size={editing ? "icon-xs" : "sm"}
          variant="outline"
        >
          {editing ? <Pencil aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {editing ? <span className="sr-only">수정</span> : "어학 성적 추가"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editing ? "어학 성적 수정" : "어학 성적 추가"}</DialogTitle>
            <DialogDescription>
              {engineerName}의 시험 결과를 원문 그대로 저장합니다. 자동 환산은 하지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language-exam-name">시험명</Label>
              <Input
                autoFocus
                id="language-exam-name"
                maxLength={100}
                onChange={(event) => setExamName(event.currentTarget.value)}
                placeholder="예: TOEIC, OPIc"
                required
                value={examName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language-result">점수 또는 등급</Label>
              <Input
                id="language-result"
                maxLength={100}
                onChange={(event) => setResult(event.currentTarget.value)}
                placeholder="예: 850, IH"
                required
                value={result}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language-acquired-on">취득일</Label>
              <Input
                id="language-acquired-on"
                onChange={(event) => setAcquiredOn(event.currentTarget.value)}
                type="date"
                value={acquiredOn}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="language-note">메모</Label>
              <Textarea
                id="language-note"
                maxLength={300}
                onChange={(event) => setNote(event.currentTarget.value)}
                placeholder="선택 입력"
                value={note}
              />
            </div>
            {error === null ? null : (
              <p className="text-sm text-destructive sm:col-span-2" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">취소</Button>
            </DialogClose>
            <Button type="submit">저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
