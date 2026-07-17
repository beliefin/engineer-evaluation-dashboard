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
  LanguageOptionViewModel,
  LanguageScoreRecordDraft,
  LanguageScoreRecordViewModel,
} from "./types"
import { acquisitionMonthInputValue, acquisitionMonthToStoredDate } from "./acquisition-month"

interface LanguageRecordDialogProps {
  readonly engineerId: string
  readonly engineerName: string
  readonly initial: LanguageScoreRecordViewModel | null
  readonly options?: readonly LanguageOptionViewModel[]
  readonly disabled: boolean
  readonly onSave: (record: LanguageScoreRecordDraft) => boolean
}

export function LanguageRecordDialog({
  engineerId,
  engineerName,
  initial,
  options = [],
  disabled,
  onSave,
}: LanguageRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [examName, setExamName] = useState(initial?.examName ?? "")
  const [languageGroup, setLanguageGroup] = useState<"english" | "second_language">(initial?.languageGroup ?? "english")
  const [languageName, setLanguageName] = useState(initial?.languageName ?? "")
  const [result, setResult] = useState(initial?.result ?? "")
  const [previousResult, setPreviousResult] = useState(initial?.previousResult ?? "")
  const [newlyAcquired, setNewlyAcquired] = useState(initial?.newlyAcquired ?? false)
  const [acquiredOn, setAcquiredOn] = useState(acquisitionMonthInputValue(initial?.acquiredOn ?? null))
  const [note, setNote] = useState(initial?.note ?? "")
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setExamName(initial?.examName ?? "")
    setLanguageGroup(initial?.languageGroup ?? "english")
    setLanguageName(initial?.languageName ?? "")
    setResult(initial?.result ?? "")
    setPreviousResult(initial?.previousResult ?? "")
    setNewlyAcquired(initial?.newlyAcquired ?? false)
    setAcquiredOn(acquisitionMonthInputValue(initial?.acquiredOn ?? null))
    setNote(initial?.note ?? "")
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) resetForm()
    setOpen(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (examName.trim() === "" || result.trim() === "" || (languageGroup === "second_language" && languageName.trim() === "")) {
      setError("언어 구분, 시험명과 점수 또는 등급을 입력해 주세요.")
      return
    }
    const saved = onSave({
      recordId: initial?.id ?? null,
      engineerId,
      examName: examName.trim(),
      languageName: languageGroup === "second_language" ? languageName.trim() : null,
      languageGroup,
      result: result.trim(),
      previousResult: previousResult.trim() === "" ? null : previousResult.trim(),
      newlyAcquired: languageGroup === "second_language" && newlyAcquired,
      acquiredOn: acquisitionMonthToStoredDate(acquiredOn),
      note: note.trim() === "" ? null : note.trim(),
    })
    if (saved) setOpen(false)
  }

  const editing = initial !== null
  const groupOptions = options.filter((option) => option.languageGroup === languageGroup)
  const selectedOption = groupOptions.find((option) => option.examName === examName)
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
              {engineerName}의 시험 결과를 원문 그대로 저장하고, 설정된 어학 평가표와 일치하면 자동 환산합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language-group">언어 구분</Label>
              <select autoFocus className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" id="language-group" onChange={(event) => { const next = event.currentTarget.value === "second_language" ? "second_language" : "english"; setLanguageGroup(next); setExamName(""); setLanguageName(""); setResult(""); setPreviousResult(""); setNewlyAcquired(false) }} value={languageGroup}>
                <option value="english">영어</option>
                <option value="second_language">제2외국어</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language-exam-name">시험명</Label>
              {groupOptions.length > 0 ? <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" id="language-exam-name" onChange={(event) => { setExamName(event.currentTarget.value); setResult(""); setPreviousResult("") }} required value={examName}>
                <option value="">평가표에서 시험 선택</option>
                {groupOptions.map((option) => <option key={`${option.languageGroup}:${option.examName}`} value={option.examName}>{option.examName}</option>)}
              </select> : <Input id="language-exam-name" maxLength={100} onChange={(event) => setExamName(event.currentTarget.value)} placeholder="예: OPIc, TOEIC Speaking" required value={examName} />}
            </div>
            {languageGroup === "second_language" ? <div className="space-y-2 sm:col-span-2"><Label htmlFor="language-name">제2외국어명</Label><Input id="language-name" maxLength={100} onChange={(event) => setLanguageName(event.currentTarget.value)} placeholder="예: 중국어, 일본어" required value={languageName} /></div> : null}
            <div className="space-y-2">
              <Label htmlFor="language-result">점수 또는 등급</Label>
              {selectedOption !== undefined && !selectedOption.numericResult ? (
                <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" id="language-result" onChange={(event) => setResult(event.currentTarget.value)} required value={result}><option value="">등급 선택</option>{selectedOption.resultOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              ) : <Input id="language-result" inputMode="numeric" maxLength={100} onChange={(event) => setResult(event.currentTarget.value)} placeholder="예: 170" required value={result} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="language-previous-result">전년도 동일 언어 결과</Label>
              {selectedOption !== undefined && !selectedOption.numericResult ? (
                <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" id="language-previous-result" onChange={(event) => setPreviousResult(event.currentTarget.value)} value={previousResult}><option value="">전년도 실적 없음</option>{selectedOption.resultOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              ) : <Input id="language-previous-result" inputMode="numeric" maxLength={100} onChange={(event) => setPreviousResult(event.currentTarget.value)} placeholder="없으면 비워두기" value={previousResult} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="language-acquired-on">취득 년월</Label>
              <Input
                id="language-acquired-on"
                onChange={(event) => setAcquiredOn(event.currentTarget.value)}
                type="month"
                value={acquiredOn}
              />
            </div>
            {languageGroup === "second_language" ? <label className="flex items-center gap-2 text-sm sm:col-span-2"><input checked={newlyAcquired} className="size-4 accent-primary" onChange={(event) => setNewlyAcquired(event.currentTarget.checked)} type="checkbox" />이번 평가연도에 IM1 이상 신규 취득</label> : null}
            <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">전년도 결과가 있고 현재 환산 등급이 높아진 경우 등급 상향 가점이 1회 적용됩니다. 제2외국어 신규 취득은 취득 년월이 평가연도에 포함되어야 합니다.</p>
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
