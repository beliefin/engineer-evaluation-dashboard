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
  CertificationOptionViewModel,
  CertificationRecordDraft,
  CertificationRecordViewModel,
} from "./types"
import { acquisitionMonthInputValue, acquisitionMonthToStoredDate } from "./acquisition-month"

interface CertificationRecordDialogProps {
  readonly engineerId: string
  readonly engineerName: string
  readonly initial: CertificationRecordViewModel | null
  readonly disabled: boolean
  readonly options?: readonly CertificationOptionViewModel[] | undefined
  readonly cycleStartsAt?: string | undefined
  readonly onSave: (record: CertificationRecordDraft) => boolean
}

export function CertificationRecordDialog({
  engineerId,
  engineerName,
  initial,
  disabled,
  options = [],
  cycleStartsAt,
  onSave,
}: CertificationRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [certificateName, setCertificateName] = useState(initial?.certificateName ?? "")
  const [grade, setGrade] = useState(initial?.grade ?? "")
  const [acquiredOn, setAcquiredOn] = useState(acquisitionMonthInputValue(initial?.acquiredOn ?? null))
  const [issuer, setIssuer] = useState(initial?.issuer ?? "")
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setCertificateName(initial?.certificateName ?? "")
    setGrade(initial?.grade ?? "")
    setAcquiredOn(acquisitionMonthInputValue(initial?.acquiredOn ?? null))
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
      acquiredOn: acquisitionMonthToStoredDate(acquiredOn),
      issuer: issuer.trim() === "" ? null : issuer.trim(),
    })
    if (saved) setOpen(false)
  }

  const editing = initial !== null
  const availableOptions = options.filter(
    (option) => option.enabled || option.name === initial?.certificateName,
  )
  const selectedOption = options.find((option) => option.name === certificateName)
  const evaluationYear = cycleStartsAt?.slice(0, 4)
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
              {engineerName}의 자격 정보를 저장하면 현재 시즌 평가표로 자동 환산됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="certificate-name">자격증명</Label>
              <select
                autoFocus
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                id="certificate-name"
                onChange={(event) => setCertificateName(event.currentTarget.value)}
                required
                value={certificateName}
              >
                <option value="">평가표에서 자격증 선택</option>
                {availableOptions.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name} · 기본 {option.baseScore}점
                  </option>
                ))}
              </select>
              {availableOptions.length === 0 ? (
                <p className="text-xs text-destructive">운영자가 자격증 평가표를 먼저 설정해야 합니다.</p>
              ) : null}
              {selectedOption === undefined ? null : (
                <p className="text-xs leading-5 text-muted-foreground">
                  {selectedOption.category ?? "분야 미설정"} · 난이도 {selectedOption.difficulty ?? "미설정"} ·
                  업무연관성 {selectedOption.workRelevance ?? "미설정"} · 기본 {selectedOption.baseScore}점 ·
                  신규취득 +{selectedOption.newAcquisitionBonus}점
                </p>
              )}
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
              <Label htmlFor="certificate-acquired-on">취득 년월</Label>
              <Input
                id="certificate-acquired-on"
                onChange={(event) => setAcquiredOn(event.currentTarget.value)}
                type="month"
                value={acquiredOn}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {evaluationYear === undefined
                  ? "평가 시즌 연도와 같으면 신규취득 가산점이 적용됩니다."
                  : `${evaluationYear}년 취득 자격 중 가장 높은 가산점 1건만 적용됩니다.`}
              </p>
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
