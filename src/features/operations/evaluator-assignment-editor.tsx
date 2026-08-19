"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import type {
  EvaluatorAssignmentGroupViewModel,
  EvaluatorOptionViewModel,
  EvaluatorPresetEntryViewModel,
} from "./types"

type AssignmentDraft = Readonly<{ evaluatorId: string; weight: number }>

type Props = Readonly<{
  group: EvaluatorAssignmentGroupViewModel
  evaluators: readonly EvaluatorOptionViewModel[]
  preset: readonly EvaluatorPresetEntryViewModel[]
  disabled: boolean
  onSave: (
    engineerId: string,
    taskId: string,
    evaluatorWeights: ReadonlyArray<AssignmentDraft>,
  ) => boolean
}>

export function EvaluatorAssignmentEditor({ group, evaluators, preset, disabled, onSave }: Props) {
  const [draft, setDraft] = useState<ReadonlyArray<AssignmentDraft>>(
    group.assignments.map((entry) => ({ evaluatorId: entry.evaluatorId, weight: entry.weight })),
  )
  const totalWeight = draft.reduce((total, entry) => total + entry.weight, 0)
  const protectedIds = new Set(
    group.assignments
      .filter((entry) => entry.status !== "pending")
      .map((entry) => entry.evaluatorId),
  )
  const fullySelected = evaluators.every((evaluator) =>
    draft.some((entry) => entry.evaluatorId === evaluator.id))
  const hasRemovableSelection = draft.some((entry) => !protectedIds.has(entry.evaluatorId))

  function toggle(evaluatorId: string, checked: boolean) {
    setDraft((current) => checked
      ? [...current, { evaluatorId, weight: 1 }]
      : current.filter((entry) => entry.evaluatorId !== evaluatorId))
  }

  function applyPreset() {
    const presetIds = new Set(preset.map((entry) => entry.evaluatorId))
    const protectedAssignments = draft.filter((entry) =>
      protectedIds.has(entry.evaluatorId) && !presetIds.has(entry.evaluatorId))
    setDraft([
      ...preset.map((entry) => ({ evaluatorId: entry.evaluatorId, weight: entry.weight })),
      ...protectedAssignments,
    ])
  }

  function selectAll() {
    setDraft((current) => {
      const selectedIds = new Set(current.map((entry) => entry.evaluatorId))
      return [
        ...current,
        ...evaluators
          .filter((evaluator) => !selectedIds.has(evaluator.id))
          .map((evaluator) => ({ evaluatorId: evaluator.id, weight: 1 })),
      ]
    })
  }

  function clearAvailableSelections() {
    setDraft((current) => current.filter((entry) => protectedIds.has(entry.evaluatorId)))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/25 px-4 py-3">
        <div>
          <p className="font-semibold">{group.engineerName} · {group.taskName}</p>
          <p className="mt-1 text-xs text-muted-foreground">{group.employeeLabel} · {group.teamName}</p>
        </div>
        <Badge variant="outline">{draft.length}명 배정</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {evaluators.map((evaluator) => {
          const selected = draft.find((entry) => entry.evaluatorId === evaluator.id)
          const current = group.assignments.find((entry) => entry.evaluatorId === evaluator.id)
          const protectedAssignment = protectedIds.has(evaluator.id)
          const ratio = selected === undefined || totalWeight <= 0 ? 0 : selected.weight / totalWeight
          return (
            <div className="grid grid-cols-[auto_minmax(0,1fr)_5.5rem] items-center gap-3 rounded-md border p-3" key={evaluator.id}>
              <input
                aria-label={`${evaluator.name} 평가 배정`}
                checked={selected !== undefined}
                className="size-4 accent-primary"
                disabled={disabled || protectedAssignment}
                onChange={(event) => toggle(evaluator.id, event.currentTarget.checked)}
                type="checkbox"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{evaluator.name}</p>
                <p className="text-xs text-muted-foreground">{evaluator.employeeCode}</p>
                {selected === undefined ? null : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    실제 반영 {(ratio * 100).toFixed(1)}%
                    {current?.status === "in_progress" ? " · 입력 중" : current?.status === "submitted" ? " · 제출 완료" : ""}
                  </p>
                )}
              </div>
              <Input
                aria-label={`${evaluator.name} 원시 가중치`}
                disabled={disabled || selected === undefined}
                min="0.1"
                onChange={(event) => {
                  const weight = Number(event.currentTarget.value)
                  setDraft((currentDraft) => currentDraft.map((entry) =>
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
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          입력 중이거나 제출된 평가는 이 화면에서 배정을 제거할 수 없습니다.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button disabled={disabled || preset.length === 0} onClick={applyPreset} type="button" variant="outline">
            고정 멤버 적용
          </Button>
          <Button disabled={disabled || fullySelected} onClick={selectAll} type="button" variant="outline">
            전체 선택
          </Button>
          <Button disabled={disabled || !hasRemovableSelection} onClick={clearAvailableSelections} type="button" variant="outline">
            선택 해제
          </Button>
          <Button
            disabled={disabled || draft.some((entry) => !Number.isFinite(entry.weight) || entry.weight <= 0)}
            onClick={() => onSave(group.engineerId, group.taskId, draft)}
            type="button"
          >
            평가자 배정 저장
          </Button>
        </div>
      </div>
    </div>
  )
}
