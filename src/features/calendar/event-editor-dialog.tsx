"use client"

import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { calendarInputSchema, getCalendarInputErrorField } from "./calendar-input"
import type { CalendarEventView, CalendarEngineer, EvaluationCalendarInput } from "./types"

type EventEditorDialogProps = Readonly<{
  event: CalendarEventView | null
  month: string
  engineers: readonly CalendarEngineer[]
  onClose: () => void
  onCreate: (input: EvaluationCalendarInput) => boolean
  onUpdate: (eventId: string, input: EvaluationCalendarInput) => boolean
  onDeleteRequest: (event: CalendarEventView) => void
}>

export function EventEditorDialog({
  event,
  month,
  engineers,
  onClose,
  onCreate,
  onUpdate,
  onDeleteRequest,
}: EventEditorDialogProps) {
  const id = useId()
  const errorId = `${id}-error`
  const [engineerId, setEngineerId] = useState(event?.engineerId ?? engineers[0]?.id ?? "")
  const [title, setTitle] = useState(event?.title ?? "")
  const [date, setDate] = useState(event?.date ?? `${month}-01`)
  const [startTime, setStartTime] = useState(event?.startTime ?? "")
  const [note, setNote] = useState(event?.note ?? "")
  const [error, setError] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<string | null>(null)
  const isEditing = event !== null

  function describedBy(field: string): string | undefined {
    return errorField === field ? errorId : undefined
  }

  function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    const normalizedNote = note.trim()
    const result = calendarInputSchema.safeParse({
      engineerId,
      title,
      date,
      startTime: startTime === "" ? null : startTime,
      note: normalizedNote === "" ? null : normalizedNote,
    })
    if (!result.success) {
      const issue = result.error.issues[0]
      setError(issue?.message ?? "입력 내용을 확인해 주세요.")
      setErrorField(issue === undefined ? null : getCalendarInputErrorField(issue.path))
      return
    }

    const saved = event === null ? onCreate(result.data) : onUpdate(event.id, result.data)
    if (!saved) {
      setError("일정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      setErrorField(null)
      return
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[calc(100dvh-var(--space-8))] overflow-hidden sm:max-w-lg">
        <form className="flex min-h-0 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <DialogHeader className="shrink-0">
            <DialogTitle>{isEditing ? "발표 일정 수정" : "발표 일정 추가"}</DialogTitle>
            <DialogDescription>
              엔지니어의 평가 발표일과 필요한 안내를 기록합니다.
            </DialogDescription>
          </DialogHeader>

          <div
            aria-label="일정 입력 항목"
            className="my-5 grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2"
            role="group"
          >
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${id}-engineer`}>엔지니어</Label>
              <select
                aria-describedby={describedBy("engineerId")}
                aria-invalid={errorField === "engineerId"}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id={`${id}-engineer`}
                onChange={(inputEvent) => setEngineerId(inputEvent.currentTarget.value)}
                value={engineerId}
              >
                {engineers.length === 0 ? <option value="">등록된 엔지니어 없음</option> : null}
                {engineers.map((engineer) => (
                  <option key={engineer.id} value={engineer.id}>
                    {engineer.displayName} · {engineer.team}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${id}-title`}>일정 제목</Label>
              <Input
                aria-describedby={describedBy("title")}
                aria-invalid={errorField === "title"}
                id={`${id}-title`}
                maxLength={100}
                onChange={(inputEvent) => setTitle(inputEvent.currentTarget.value)}
                placeholder="예: 성장탐구 발표"
                value={title}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${id}-date`}>발표일</Label>
              <Input
                aria-describedby={describedBy("date")}
                aria-invalid={errorField === "date"}
                id={`${id}-date`}
                onChange={(inputEvent) => setDate(inputEvent.currentTarget.value)}
                required
                type="date"
                value={date}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${id}-time`}>시작 시간</Label>
              <Input
                aria-describedby={describedBy("startTime")}
                aria-invalid={errorField === "startTime"}
                id={`${id}-time`}
                onChange={(inputEvent) => setStartTime(inputEvent.currentTarget.value)}
                type="time"
                value={startTime}
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${id}-note`}>메모</Label>
              <Textarea
                aria-describedby={describedBy("note")}
                aria-invalid={errorField === "note"}
                className="min-h-24 resize-y"
                id={`${id}-note`}
                maxLength={500}
                onChange={(inputEvent) => setNote(inputEvent.currentTarget.value)}
                placeholder="장소나 준비사항을 입력해 주세요."
                value={note}
              />
            </div>
          </div>

          {error === null ? null : (
            <p className="mb-4 text-sm text-destructive" id={errorId} role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="shrink-0 items-center sm:justify-between">
            {event === null ? <span /> : (
              <Button
                onClick={() => onDeleteRequest(event)}
                type="button"
                variant="destructive"
              >
                일정 삭제
              </Button>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button onClick={onClose} type="button" variant="outline">취소</Button>
              <Button disabled={engineers.length === 0} type="submit">
                {isEditing ? "변경사항 저장" : "일정 저장"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
