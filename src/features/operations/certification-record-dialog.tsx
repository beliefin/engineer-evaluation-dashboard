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

import type {
  CertificationRecordDraft,
  CertificationRecordViewModel,
} from "./types"

interface CertificationRecordDialogProps {
  readonly engineerId: string
  readonly engineerName: string
  readonly initial: CertificationRecordViewModel | null
  readonly disabled: boolean
  readonly onSave: (record: CertificationRecordDraft) => boolean
}

export function CertificationRecordDialog({
  engineerId,
  engineerName,
  initial,
  disabled,
  onSave,
}: CertificationRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [certificateName, setCertificateName] = useState(initial?.certificateName ?? "")
  const [grade, setGrade] = useState(initial?.grade ?? "")
  const [acquiredOn, setAcquiredOn] = useState(initial?.acquiredOn ?? "")
  const [issuer, setIssuer] = useState(initial?.issuer ?? "")
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setCertificateName(initial?.certificateName ?? "")
    setGrade(initial?.grade ?? "")
    setAcquiredOn(initial?.acquiredOn ?? "")
    setIssuer(initial?.issuer ?? "")
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) resetForm()
    setOpen(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (certificateName.trim() === "") {
      setError("자격증명을 입력해 주세요.")
      return
    }
    const saved = onSave({
      recordId: initial?.id ?? null,
      engineerId,
      certificateName: certificateName.trim(),
      grade: grade.trim() === "" ? null : grade.trim(),
      acquiredOn: acquiredOn === "" ? null : acquiredOn,
      issuer: issuer.trim() === "" ? null : issuer.trim(),
    })
    if (saved) setOpen(false)
  }

  const editing = initial !== null
  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button
          aria-label={editing ? `${engineerName} ${initial.certificateName} 자격증 수정` : undefined}
          disabled={disabled}
          size={editing ? "icon-xs" : "sm"}
          variant="outline"
        >
          {editing ? <Pencil aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {editing ? <span className="sr-only">수정</span> : "자격증 추가"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editing ? "자격증 수정" : "자격증 추가"}</DialogTitle>
            <DialogDescription>
              {engineerName}의 자격 정보를 저장합니다. 환산식은 추후 별도로 적용합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="certificate-name">자격증명</Label>
              <Input
                autoFocus
                id="certificate-name"
                maxLength={100}
                onChange={(event) => setCertificateName(event.currentTarget.value)}
                placeholder="예: 산업안전기사"
                required
                value={certificateName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate-grade">등급 또는 구분</Label>
              <Input
                id="certificate-grade"
                maxLength={100}
                onChange={(event) => setGrade(event.currentTarget.value)}
                placeholder="예: 기사, 1급"
                value={grade}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate-acquired-on">취득일</Label>
              <Input
                id="certificate-acquired-on"
                onChange={(event) => setAcquiredOn(event.currentTarget.value)}
                type="date"
                value={acquiredOn}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="certificate-issuer">발급기관</Label>
              <Input
                id="certificate-issuer"
                maxLength={100}
                onChange={(event) => setIssuer(event.currentTarget.value)}
                placeholder="선택 입력"
                value={issuer}
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
