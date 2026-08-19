"use client"

import { useMemo, useState } from "react"
import { UsersRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { EvaluatorAssignmentEditor } from "./evaluator-assignment-editor"
import { EvaluatorPresetDialog } from "./evaluator-preset-dialog"
import { OperationPanel } from "./operation-panel"
import type {
  EvaluatorAssignmentGroupViewModel,
  EvaluatorOptionViewModel,
  EvaluatorPresetEntryViewModel,
} from "./types"

type AssignmentDraft = Readonly<{ evaluatorId: string; weight: number }>

type Props = Readonly<{
  groups: readonly EvaluatorAssignmentGroupViewModel[]
  evaluators: readonly EvaluatorOptionViewModel[]
  preset: readonly EvaluatorPresetEntryViewModel[]
  disabled: boolean
  onSave: (
    engineerId: string,
    taskId: string,
    evaluatorWeights: ReadonlyArray<AssignmentDraft>,
  ) => boolean
  onSavePreset: (evaluatorWeights: ReadonlyArray<AssignmentDraft>) => boolean
}>

export function EvaluatorAssignmentPanel({ groups, evaluators, preset, disabled, onSave, onSavePreset }: Props) {
  const engineerOptions = useMemo(() => {
    const values = new Map<string, { id: string; label: string }>()
    groups.forEach((group) => {
      values.set(group.engineerId, {
        id: group.engineerId,
        label: `${group.engineerName} · ${group.employeeLabel}`,
      })
    })
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
      description="엔지니어·과제별 지정 평가자에게만 평가 의무 생성. 과제 설정·명단 등록만으로는 미평가 항목 미생성"
      title="엔지니어별 평가자 배정"
    >
      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed py-12 text-center">
          <p className="font-medium">배정 가능한 평가자 과제가 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">과제와 개인별 가중치가 0%보다 큰지 확인해 주세요.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 border-y border-border-subtle bg-muted/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">고정 멤버 프리셋</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {preset.length === 0
                  ? "저장된 고정 멤버가 없습니다."
                  : preset.map((entry) => `${entry.evaluatorName} ${entry.weight}`).join(" · ")}
              </p>
            </div>
            <EvaluatorPresetDialog
              disabled={disabled}
              evaluators={evaluators}
              key={preset.map((entry) => `${entry.evaluatorId}:${entry.weight}`).join("|")}
              onSave={onSavePreset}
              preset={preset}
            />
          </div>
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
            <EvaluatorAssignmentEditor
              disabled={disabled}
              evaluators={evaluators}
              group={selectedGroup}
              key={`${selectedGroup.engineerId}:${selectedGroup.taskId}:${selectedGroup.assignments.map((entry) => `${entry.evaluatorId}:${entry.weight}:${entry.status}`).join("|")}`}
              onSave={onSave}
              preset={preset}
            />
          )}
        </div>
      )}
    </OperationPanel>
  )
}
