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

import {
  calendarCreateInputSchema,
  calendarInputSchema,
  getCalendarInputErrorField,
} from "./calendar-input"
import type {
  CalendarEventView,
  CalendarEngineer,
  CalendarTask,
  EvaluationCalendarCreateInput,
  EvaluationCalendarInput,
} from "./types"

type EventEditorDialogProps = Readonly<{
  event: CalendarEventView | null
  month: string
  engineers: readonly CalendarEngineer[]
  tasks: readonly CalendarTask[]
  onClose: () => void
  onCreate: (input: EvaluationCalendarCreateInput) => boolean
  onUpdate: (eventId: string, input: EvaluationCalendarInput) => boolean
  onDeleteRequest: (event: CalendarEventView) => void
}>

export function EventEditorDialog({
  event,
  month,
  engineers,
  tasks,
  onClose,
  onCreate,
  onUpdate,
  onDeleteRequest,
}: EventEditorDialogProps) {
  const id = useId()
  const errorId = `${id}-error`
  const initialTaskId = event?.taskId ?? tasks[0]?.id ?? ""
  const initialEngineers = engineers.filter((engineer) => engineer.taskIds.includes(initialTaskId))
  const [taskId, setTaskId] = useState(initialTaskId)
  const [engineerId, setEngineerId] = useState(event?.engineerId ?? initialEngineers[0]?.id ?? "")
  const [engineerIds, setEngineerIds] = useState<readonly string[]>(
    event === null ? [] : [event.engineerId],
  )
  const [parallel, setParallel] = useState(false)
  const [title, setTitle] = useState(event?.title ?? tasks.find((task) => task.id === initialTaskId)?.name ?? "")
  const [date, setDate] = useState(event?.date ?? `${month}-01`)
  const [startTime, setStartTime] = useState(event?.startTime ?? "")
  const [note, setNote] = useState(event?.note ?? "")
  const [error, setError] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<string | null>(null)
  const isEditing = event !== null
  const eligibleEngineers = engineers.filter((engineer) => engineer.taskIds.includes(taskId))

  function describedBy(field: string): string | undefined {
    return errorField === field ? errorId : undefined
  }

  function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    const normalizedNote = note.trim()
    const common = {
      taskId,
      title,
      date,
      startTime: startTime === "" ? null : startTime,
      note: normalizedNote === "" ? null : normalizedNote,
    }
    let saved: boolean
    if (event === null) {
      const result = calendarCreateInputSchema.safeParse({ ...common, engineerIds, parallel })
      if (!result.success) {
        const issue = result.error.issues[0]
        setError(issue?.message ?? "입력 내용을 확인해 주세요.")
        setErrorField(issue === undefined ? null : getCalendarInputErrorField(issue.path))
        return
      }
      saved = onCreate(result.data)
    } else {
      const result = calendarInputSchema.safeParse({ ...common, engineerId })
      if (!result.success) {
        const issue = result.error.issues[0]
        setError(issue?.message ?? "입력 내용을 확인해 주세요.")
        setErrorField(issue === undefined ? null : getCalendarInputErrorField(issue.path))
        return
      }
      saved = onUpdate(event.id, result.data)
    }
    if (!saved) {
      setError("일정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      setErrorField(null)
      return
    }
    onClose()
  }

  function changeTask(nextTaskId: string) {
    const previousTaskName = tasks.find((task) => task.id === taskId)?.name ?? ""
    const nextTaskName = tasks.find((task) => task.id === nextTaskId)?.name ?? ""
    const nextEligible = engineers.filter((engineer) => engineer.taskIds.includes(nextTaskId))
    setTaskId(nextTaskId)
    setEngineerIds([])
    setParallel(false)
    setEngineerId((current) => nextEligible.some((engineer) => engineer.id === current)
      ? current : (nextEligible[0]?.id ?? ""))
    setTitle((current) => current === "" || current === previousTaskName ? nextTaskName : current)
  }

  function toggleEngineer(nextEngineerId: string, checked: boolean) {
    setEngineerIds((current) => {
      const next = checked
        ? [...current, nextEngineerId]
        : current.filter((candidate) => candidate !== nextEngineerId)
      if (next.length !== 2) setParallel(false)
      return next
    })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="signal-calendar-editor grid max-h-[min(48rem,calc(100dvh-2rem))] grid-rows-[minmax(0,1fr)] overflow-hidden sm:max-w-lg">
        <form className="flex min-h-0 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <DialogHeader className="shrink-0">
            <DialogTitle>{isEditing ? "발표 일정 수정" : "발표 일정 추가"}</DialogTitle>
            <DialogDescription>
              평가 발표일·대상 과제·준비 안내 등록
            </DialogDescription>
          </DialogHeader>

          <fieldset className="signal-calendar-editor-fields my-5 grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
            <legend className="sr-only">일정 입력 항목</legend>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${id}-task`}>평가 과제</Label>
              <select
                aria-describedby={describedBy("taskId")}
                aria-invalid={errorField === "taskId"}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id={`${id}-task`}
                onChange={(inputEvent) => changeTask(inputEvent.currentTarget.value)}
                value={taskId}
              >
                {tasks.length === 0 ? <option value="">연결 가능한 과제 없음</option> : null}
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>

            {isEditing ? (
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
                  {eligibleEngineers.length === 0 ? <option value="">배정된 엔지니어 없음</option> : null}
                  {eligibleEngineers.map((engineer) => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.displayName} · {engineer.team}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <fieldset
                aria-describedby={describedBy("engineerIds")}
                aria-invalid={errorField === "engineerIds"}
                className="signal-calendar-engineers grid gap-2 sm:col-span-2"
              >
                <div className="signal-calendar-engineer-heading flex items-center justify-between gap-3">
                  <legend className="text-sm font-medium">엔지니어 복수 선택</legend>
                  <div className="flex items-center gap-1 text-xs">
                    <Button
                      disabled={eligibleEngineers.length === 0}
                      onClick={() => setEngineerIds(eligibleEngineers.map((engineer) => engineer.id))}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      전체 선택
                    </Button>
                    <Button onClick={() => setEngineerIds([])} size="sm" type="button" variant="ghost">
                      선택 해제
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  평가자가 배정된 엔지니어만 표시 · {engineerIds.length}명 선택
                </p>
                <div className="grid max-h-48 gap-1 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
                  {eligibleEngineers.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">먼저 과제별 평가자를 배정해 주세요.</p>
                  ) : eligibleEngineers.map((engineer) => (
                    <label
                      className="signal-calendar-engineer-option flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                      htmlFor={`${id}-engineer-${engineer.id}`}
                      key={engineer.id}
                    >
                      <input
                        className="size-4 shrink-0 accent-primary"
                        checked={engineerIds.includes(engineer.id)}
                        id={`${id}-engineer-${engineer.id}`}
                        onChange={(event) => toggleEngineer(engineer.id, event.currentTarget.checked)}
                        type="checkbox"
                      />
                      <span className="min-w-0 text-sm">
                        <span className="block truncate font-medium">{engineer.displayName}</span>
                        <span className="block text-xs text-muted-foreground">{engineer.team}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <label
                  className="signal-calendar-parallel-option mt-1 flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/25 p-3"
                  htmlFor={`${id}-parallel`}
                >
                  <input
                    checked={parallel}
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                    disabled={engineerIds.length !== 2}
                    id={`${id}-parallel`}
                    onChange={(inputEvent) => setParallel(inputEvent.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span className="text-sm">
                    <span className="block font-medium">두 발표자를 한 화면에서 평가</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      엔지니어 2명을 선택하면 하나의 동시 발표로 묶여 한 화면에 함께 표시되고,
                      넓은 화면에서 두 발표자 좌우 배치
                    </span>
                  </span>
                </label>
              </fieldset>
            )}

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
          </fieldset>

          {error === null ? null : (
            <p className="mb-4 text-sm text-destructive" id={errorId} role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="signal-calendar-editor-footer shrink-0 items-center sm:justify-between">
            {event === null ? null : (
              <Button
                onClick={() => onDeleteRequest(event)}
                type="button"
                variant="destructive"
              >
                일정 삭제
              </Button>
            )}
            <div className="signal-calendar-save-actions flex flex-col-reverse gap-2 sm:flex-row">
              <Button onClick={onClose} type="button" variant="outline">취소</Button>
              <Button disabled={tasks.length === 0 || eligibleEngineers.length === 0} type="submit">
                {isEditing ? "변경사항 저장" : "일정 저장"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
