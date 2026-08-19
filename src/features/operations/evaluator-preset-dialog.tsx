"use client"

import { useState } from "react"

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

import type {
  EvaluatorOptionViewModel,
  EvaluatorPresetEntryViewModel,
} from "./types"

type AssignmentDraft = Readonly<{ evaluatorId: string; weight: number }>

type Props = Readonly<{
  evaluators: readonly EvaluatorOptionViewModel[]
  preset: readonly EvaluatorPresetEntryViewModel[]
  disabled: boolean
  onSave: (evaluatorWeights: ReadonlyArray<AssignmentDraft>) => boolean
}>

export function EvaluatorPresetDialog({ evaluators, preset, disabled, onSave }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ReadonlyArray<AssignmentDraft>>(
    preset.map((entry) => ({ evaluatorId: entry.evaluatorId, weight: entry.weight })),
  )
  const totalWeight = draft.reduce((total, entry) => total + entry.weight, 0)

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(preset.map((entry) => ({ evaluatorId: entry.evaluatorId, weight: entry.weight })))
    }
    setOpen(nextOpen)
  }

  function toggle(evaluatorId: string, checked: boolean) {
    setDraft((current) => checked
      ? [...current, { evaluatorId, weight: 1 }]
      : current.filter((entry) => entry.evaluatorId !== evaluatorId))
  }

  return (
    <Dialog onOpenChange={changeOpen} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled} size="sm" type="button" variant="outline">고정 멤버 설정</Button>
      </DialogTrigger>
      <DialogContent className="grid max-h-[min(44rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border-subtle px-5 py-4 pr-12">
          <DialogTitle>고정 평가자 멤버와 가중치</DialogTitle>
          <DialogDescription>
            자주 함께 배정하는 평가자와 원시 가중치를 시즌 기본 프리셋으로 저장합니다. 저장만으로 평가 의무가 생성되지는 않습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-5 py-3">
          <div className="divide-y divide-border-subtle border-y border-border-subtle">
            {evaluators.map((evaluator) => {
              const selected = draft.find((entry) => entry.evaluatorId === evaluator.id)
              const ratio = selected === undefined || totalWeight <= 0 ? 0 : selected.weight / totalWeight
              return (
                <div className="grid grid-cols-[auto_minmax(0,1fr)_6rem] items-center gap-3 py-3" key={evaluator.id}>
                  <input
                    aria-label={`${evaluator.name} 고정 멤버`}
                    checked={selected !== undefined}
                    className="size-4 accent-primary"
                    disabled={disabled}
                    onChange={(event) => toggle(evaluator.id, event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{evaluator.name}</p>
                    <p className="text-xs text-muted-foreground">{evaluator.employeeCode}{selected === undefined ? "" : ` · 반영 ${(ratio * 100).toFixed(1)}%`}</p>
                  </div>
                  <Input
                    aria-label={`${evaluator.name} 고정 가중치`}
                    disabled={disabled || selected === undefined}
                    min="0.1"
                    onChange={(event) => {
                      const weight = Number(event.currentTarget.value)
                      setDraft((current) => current.map((entry) =>
                        entry.evaluatorId === evaluator.id ? { ...entry, weight } : entry))
                    }}
                    step="0.1"
                    type="number"
                    value={selected?.weight ?? 1}
                  />
                </div>
              )
            })}
          </div>
        </div>
        <DialogFooter className="m-0 rounded-none px-5 py-3">
          <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
          <Button
            disabled={disabled || draft.some((entry) => !Number.isFinite(entry.weight) || entry.weight <= 0)}
            onClick={() => {
              if (onSave(draft)) setOpen(false)
            }}
            type="button"
          >
            프리셋 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
