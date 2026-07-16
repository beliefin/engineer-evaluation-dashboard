"use client"

import { useMemo, useState } from "react"
import { UsersRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type {
  EvaluatorAssignmentGroupViewModel,
  EvaluatorOptionViewModel,
} from "./types"

type AssignmentDraft = Readonly<{ evaluatorId: string; weight: number }>

type Props = Readonly<{
  groups: readonly EvaluatorAssignmentGroupViewModel[]
  evaluators: readonly EvaluatorOptionViewModel[]
  disabled: boolean
  onSave: (
    engineerId: string,
    taskId: string,
    evaluatorWeights: ReadonlyArray<AssignmentDraft>,
  ) => boolean
}>

function AssignmentEditor({
  group,
  evaluators,
  disabled,
  onSave,
}: Readonly<{
  group: EvaluatorAssignmentGroupViewModel
  evaluators: readonly EvaluatorOptionViewModel[]
  disabled: boolean
  onSave: Props["onSave"]
}>) {
  const [draft, setDraft] = useState<ReadonlyArray<AssignmentDraft>>(
    group.assignments.map((entry) => ({ evaluatorId: entry.evaluatorId, weight: entry.weight })),
  )
  const totalWeight = draft.reduce((total, entry) => total + entry.weight, 0)
  const protectedIds = new Set(
    group.assignments
      .filter((entry) => entry.status !== "pending")
      .map((entry) => entry.evaluatorId),
  )

  function toggle(evaluatorId: string, checked: boolean) {
    setDraft((current) => checked
      ? [...current, { evaluatorId, weight: 1 }]
      : current.filter((entry) => entry.evaluatorId !== evaluatorId))
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
        <Button
          disabled={disabled || draft.some((entry) => !Number.isFinite(entry.weight) || entry.weight <= 0)}
          onClick={() => onSave(group.engineerId, group.taskId, draft)}
          type="button"
        >
          평가자 배정 저장
        </Button>
      </div>
    </div>
  )
}

export function EvaluatorAssignmentPanel({ groups, evaluators, disabled, onSave }: Props) {
  const engineerOptions = useMemo(() => {
    const values = new Map<string, { id: string; label: string }>()
    groups.forEach((group) => values.set(group.engineerId, {
      id: group.engineerId,
      label: `${group.engineerName} · ${group.employeeLabel}`,
    }))
    return Array.from(values.values())
  }, [groups])
  const [engineerId, setEngineerId] = useState(engineerOptions[0]?.id ?? "")
  const engineerGroups = groups.filter((group) => group.engineerId === engineerId)
  const [taskId, setTaskId] = useState(engineerGroups[0]?.taskId ?? "")
  const selectedGroup = engineerGroups.find((group) => group.taskId === taskId) ?? engineerGroups[0]

  function selectEngineer(nextEngineerId: string) {
    setEngineerId(nextEngineerId)
    setTaskId(groups.find((group) => group.engineerId === nextEngineerId)?.taskId ?? "")
  }

  return (
    <OperationPanel
      aside={<Badge variant="outline"><UsersRound aria-hidden="true" /> 개인별 배정</Badge>}
      description="평가 의무는 여기서 엔지니어와 과제별로 명시한 평가자에게만 생성됩니다. 과제 설정이나 명단 등록만으로 미평가 항목을 만들지 않습니다."
      title="엔지니어별 평가자 배정"
    >
      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed py-12 text-center">
          <p className="font-medium">배정 가능한 평가자 과제가 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">과제와 개인별 가중치가 0%보다 큰지 확인해 주세요.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignment-engineer">엔지니어</Label>
              <Select onValueChange={selectEngineer} value={engineerId}>
                <SelectTrigger className="w-full" id="assignment-engineer"><SelectValue /></SelectTrigger>
                <SelectContent>{engineerOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment-task">과제</Label>
              <Select onValueChange={setTaskId} value={selectedGroup?.taskId ?? ""}>
                <SelectTrigger className="w-full" id="assignment-task"><SelectValue /></SelectTrigger>
                <SelectContent>{engineerGroups.map((group) => <SelectItem key={group.taskId} value={group.taskId}>{group.taskName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {selectedGroup === undefined ? null : (
            <AssignmentEditor
              disabled={disabled}
              evaluators={evaluators}
              group={selectedGroup}
              key={`${selectedGroup.engineerId}:${selectedGroup.taskId}:${selectedGroup.assignments.map((entry) => `${entry.evaluatorId}:${entry.weight}:${entry.status}`).join("|")}`}
              onSave={onSave}
            />
          )}
        </div>
      )}
    </OperationPanel>
  )
}
