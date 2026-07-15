"use client"

import { CalendarPlus, LockKeyhole, UnlockKeyhole } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { OperationPanel } from "./operation-panel"
import { CycleSettingsDialog } from "./cycle-settings-dialog"
import type {
  EvaluationCycleDraft,
  EvaluationCycleSettingsDraft,
} from "./types"

interface CycleCreatorPanelProps {
  readonly cycleId?: string | undefined
  readonly cycleLabel: string
  readonly cycleCount: number
  readonly cycleStatus: "setup" | "active" | "closed"
  readonly cycleLocked: boolean
  readonly startsAt: string
  readonly endsAt: string
  readonly disabled: boolean
  readonly onCreate: (cycle: EvaluationCycleDraft) => boolean
  readonly onUpdate: (cycle: EvaluationCycleSettingsDraft) => boolean
  readonly onSetLock: (locked: boolean) => boolean
  readonly onDelete?: ((cycleId: string) => boolean) | undefined
}

const STATUS_LABELS = {
  setup: "설정 중",
  active: "진행 중",
  closed: "종료",
} as const

export function CycleCreatorPanel({
  cycleLabel,
  cycleId,
  cycleCount,
  cycleStatus,
  cycleLocked,
  startsAt,
  endsAt,
  disabled,
  onCreate,
  onUpdate,
  onSetLock,
  onDelete,
}: CycleCreatorPanelProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"setup" | "active">("setup")
  const [cycleStartsAt, setCycleStartsAt] = useState("")
  const [cycleEndsAt, setCycleEndsAt] = useState("")
  const [copyConfiguration, setCopyConfiguration] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setName("")
    setStatus("setup")
    setCycleStartsAt("")
    setCycleEndsAt("")
    setCopyConfiguration(true)
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) resetForm()
    setOpen(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim() === "" || cycleStartsAt === "" || cycleEndsAt === "") {
      setError("시즌명과 평가 기간을 모두 입력해 주세요.")
      return
    }
    if (cycleStartsAt > cycleEndsAt) {
      setError("평가 종료일은 시작일보다 빠를 수 없습니다.")
      return
    }
    if (onCreate({
      name: name.trim(),
      status,
      startsAt: cycleStartsAt,
      endsAt: cycleEndsAt,
      copyConfiguration,
    })) {
      setOpen(false)
    }
  }

  return (
    <OperationPanel
      aside={<Badge variant="secondary">총 {cycleCount}개 시즌</Badge>}
      description={(
        <>
          <span className="block sm:inline">시즌마다 과제와 평가방식을 독립적으로 구성합니다.</span>{" "}
          <span className="block sm:inline">현재 구성을 복사해 빠르게 시작할 수 있습니다.</span>
        </>
      )}
      title="평가 시즌 관리"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">{cycleLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {STATUS_LABELS[cycleStatus]} · {startsAt} ~ {endsAt}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <CycleSettingsDialog
            cycleLabel={cycleLabel}
            cycleStatus={cycleStatus}
            disabled={disabled || cycleLocked}
            endsAt={endsAt}
            onUpdate={onUpdate}
            startsAt={startsAt}
          />
          <Button
            disabled={disabled}
            onClick={() => {
              const action = cycleLocked ? "잠금 해제" : "잠금"
              if (window.confirm(`${cycleLabel} 시즌을 ${action}하시겠습니까?`)) {
                onSetLock(!cycleLocked)
              }
            }}
            type="button"
            variant="outline"
          >
            {cycleLocked ? <UnlockKeyhole aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
            {cycleLocked ? "시즌 잠금 해제" : "시즌 잠금"}
          </Button>
          <Button
            disabled={disabled || cycleLocked || onDelete === undefined || cycleCount <= 1 || cycleStatus === "active"}
            onClick={() => {
              if (onDelete !== undefined && cycleId !== undefined && window.confirm(`${cycleLabel} 시즌을 삭제할까요? 제출된 평가가 있는 시즌은 삭제할 수 없습니다.`)) onDelete(cycleId)
            }}
            title={cycleLocked ? "잠긴 시즌은 잠금 해제 후 삭제할 수 있습니다." : cycleStatus === "active" ? "진행 중인 시즌은 삭제할 수 없습니다." : undefined}
            type="button"
            variant="outline"
          >
            시즌 삭제
          </Button>
          <Dialog onOpenChange={handleOpenChange} open={open}>
          <DialogTrigger asChild>
            <Button disabled={disabled} type="button">
              <CalendarPlus aria-hidden="true" />
              평가 시즌 만들기
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>새 평가 시즌 만들기</DialogTitle>
                <DialogDescription>
                  <span className="block">현재 시즌의 과제, 평가 항목과 평가자 가중치를 복사할 수 있습니다.</span>
                  <span className="block">기존 평가 점수와 일정은 복사하지 않습니다.</span>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cycle-name">평가 시즌명</Label>
                  <Input
                    autoFocus
                    id="cycle-name"
                    maxLength={100}
                    onChange={(event) => setName(event.currentTarget.value)}
                    placeholder="예: 2026 하반기"
                    required
                    value={name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cycle-starts-at">시작일</Label>
                  <Input
                    id="cycle-starts-at"
                    onChange={(event) => setCycleStartsAt(event.currentTarget.value)}
                    required
                    type="date"
                    value={cycleStartsAt}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cycle-ends-at">종료일</Label>
                  <Input
                    id="cycle-ends-at"
                    onChange={(event) => setCycleEndsAt(event.currentTarget.value)}
                    required
                    type="date"
                    value={cycleEndsAt}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cycle-status">상태</Label>
                  <Select onValueChange={(value) => {
                    if (value === "setup" || value === "active") setStatus(value)
                  }} value={status}>
                    <SelectTrigger className="w-full" id="cycle-status"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="setup">설정 중</SelectItem><SelectItem value="active">진행 중</SelectItem></SelectContent>
                  </Select>
                </div>
                <label className="flex items-start gap-3 rounded-md border bg-muted/30 p-3 sm:col-span-2">
                  <input
                    checked={copyConfiguration}
                    className="mt-1 size-4 accent-primary"
                    onChange={(event) => setCopyConfiguration(event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span><span className="block text-sm font-medium">현재 과제 구성 복사</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">과제, 문항, 평가자와 가중치만 복사하며 평가표는 미작성 상태로 생성됩니다.</span></span>
                </label>
                {error === null ? null : <p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
                <Button type="submit">시즌 만들기</Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>
    </OperationPanel>
  )
}
