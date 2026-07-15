"use client"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type {
  EvaluationCycleSettingsDraft,
  OperationsCycleStatus,
} from "./types"

interface CycleSettingsDialogProps {
  readonly cycleLabel: string
  readonly cycleStatus: OperationsCycleStatus
  readonly startsAt: string
  readonly endsAt: string
  readonly disabled: boolean
  readonly onUpdate: (cycle: EvaluationCycleSettingsDraft) => boolean
}

export function CycleSettingsDialog({
  cycleLabel,
  cycleStatus,
  startsAt,
  endsAt,
  disabled,
  onUpdate,
}: CycleSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(cycleLabel)
  const [status, setStatus] = useState<OperationsCycleStatus>(cycleStatus)
  const [nextStartsAt, setNextStartsAt] = useState(startsAt)
  const [nextEndsAt, setNextEndsAt] = useState(endsAt)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(cycleLabel)
      setStatus(cycleStatus)
      setNextStartsAt(startsAt)
      setNextEndsAt(endsAt)
      setError(null)
    }
    setOpen(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim() === "" || nextStartsAt === "" || nextEndsAt === "") {
      setError("시즌명과 평가 기간을 모두 입력해 주세요.")
      return
    }
    if (nextStartsAt > nextEndsAt) {
      setError("종료일은 시작일보다 빠를 수 없습니다.")
      return
    }
    if (onUpdate({
      name: name.trim(),
      status,
      startsAt: nextStartsAt,
      endsAt: nextEndsAt,
    })) {
      setOpen(false)
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled} type="button" variant="outline">
          설정 수정
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>평가 시즌 설정 수정</DialogTitle>
            <DialogDescription>
              시즌명, 운영 상태, 평가 기간을 수정합니다. 제출된 평가 데이터는 유지됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cycle-settings-name">평가 시즌명</Label>
              <Input
                autoFocus
                id="cycle-settings-name"
                maxLength={100}
                onChange={(event) => setName(event.currentTarget.value)}
                required
                value={name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-settings-starts-at">시작일</Label>
              <Input
                id="cycle-settings-starts-at"
                onChange={(event) => setNextStartsAt(event.currentTarget.value)}
                required
                type="date"
                value={nextStartsAt}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-settings-ends-at">종료일</Label>
              <Input
                id="cycle-settings-ends-at"
                onChange={(event) => setNextEndsAt(event.currentTarget.value)}
                required
                type="date"
                value={nextEndsAt}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cycle-settings-status">운영 상태</Label>
              <Select
                onValueChange={(value) => {
                  if (value === "setup" || value === "active" || value === "closed") {
                    setStatus(value)
                  }
                }}
                value={status}
              >
                <SelectTrigger className="w-full" id="cycle-settings-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="setup">설정 중</SelectItem>
                  <SelectItem value="active">진행 중</SelectItem>
                  <SelectItem value="closed">종료</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="submit">설정 저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
