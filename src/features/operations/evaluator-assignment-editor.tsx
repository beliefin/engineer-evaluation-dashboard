"use client"

import { useId, useState } from "react"

import "./assignment-operations-signal.css"

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
  const inputId = useId()
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
    <div className="signal-assignment-editor">
      <div className="signal-assignment-toolbar">
        <div className="signal-assignment-group">
          <p className="font-semibold">{group.engineerName} · {group.taskName}</p>
          <p className="mt-1 text-xs text-muted-foreground">{group.employeeLabel} · {group.teamName}</p>
        </div>
        <Badge variant="outline">{draft.length}명 배정</Badge>
        <div className="signal-assignment-actions">
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
      <div className="signal-assignment-list">
        {evaluators.map((evaluator) => {
          const selected = draft.find((entry) => entry.evaluatorId === evaluator.id)
          const current = group.assignments.find((entry) => entry.evaluatorId === evaluator.id)
          const protectedAssignment = protectedIds.has(evaluator.id)
          const ratio = selected === undefined || totalWeight <= 0 ? 0 : selected.weight / totalWeight
          return (
            <div className="signal-assignment-row" data-selected={selected !== undefined} key={evaluator.id}>
              <label className="signal-assignment-checkbox" htmlFor={`${inputId}-${evaluator.id}-selected`}>
                <span className="sr-only">{evaluator.name} 평가 배정</span>
                <input
                  aria-label={`${evaluator.name} 평가 배정`}
                  checked={selected !== undefined}
                  disabled={disabled || protectedAssignment}
                  id={`${inputId}-${evaluator.id}-selected`}
                  onChange={(event) => toggle(evaluator.id, event.currentTarget.checked)}
                  type="checkbox"
                />
              </label>
              <div className="signal-assignment-evaluator">
                <p>{evaluator.name}</p>
                <p>{evaluator.employeeCode}</p>
                {selected === undefined ? null : (
                  <p className="signal-assignment-contribution">
                    실제 반영 {(ratio * 100).toFixed(1)}%
                    <span data-status={current?.status}>{current?.status === "in_progress" ? " · 입력 중" : current?.status === "submitted" ? " · 제출 완료" : ""}</span>
                  </p>
                )}
              </div>
              <div className="signal-assignment-weight">
                <label htmlFor={`${inputId}-${evaluator.id}-weight`}>원시 가중치</label>
                <Input
                  aria-label={`${evaluator.name} 원시 가중치`}
                  disabled={disabled || selected === undefined}
                  id={`${inputId}-${evaluator.id}-weight`}
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
            </div>
          )
        })}
      </div>
      <p className="signal-assignment-protection-note">
        입력 중이거나 제출된 평가는 이 화면에서 배정을 제거할 수 없습니다.
      </p>
    </div>
  )
}
