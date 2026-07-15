"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { METHOD_LABELS } from "./evaluation-task-dialog"
import { OperationPanel } from "./operation-panel"
import type { EngineerTaskWeightViewModel } from "./types"

type WeightDraft = Readonly<{
  engineerId: string
  values: Readonly<Record<string, string>>
}>

type Props = Readonly<{
  rows: ReadonlyArray<EngineerTaskWeightViewModel>
  disabled: boolean
  onSave: (
    engineerId: string,
    weights: ReadonlyArray<Readonly<{ taskId: string; weight: number }>>,
  ) => boolean
}>

const roundToOne = (value: number): number => Math.round(value * 10) / 10

export function EngineerTaskWeightPanel({ rows, disabled, onSave }: Props) {
  const [selectedId, setSelectedId] = useState(rows[0]?.engineerId ?? "")
  const [draft, setDraft] = useState<WeightDraft | null>(null)
  const selected = rows.find((row) => row.engineerId === selectedId) ?? rows[0]
  const values = selected?.tasks.map((task) => {
    const value = draft?.engineerId === selected.engineerId
      ? (draft.values[task.taskId] ?? String(task.weight))
      : String(task.weight)
    return { task, value, parsed: Number(value) }
  }) ?? []
  const validValues = values.every(({ value, parsed }) =>
    value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
  )
  const total = roundToOne(values.reduce(
    (sum, entry) => sum + (Number.isFinite(entry.parsed) ? entry.parsed : 0),
    0,
  ))
  const validTotal = validValues && Math.abs(total - 100) < 0.000_001
  const dirty = selected !== undefined && values.some(
    ({ task, parsed }) => parsed !== task.weight,
  )

  function updateWeight(taskId: string, value: string) {
    if (selected === undefined) return
    const base = Object.fromEntries(selected.tasks.map((task) => [task.taskId, String(task.weight)]))
    setDraft({
      engineerId: selected.engineerId,
      values: { ...(draft?.engineerId === selected.engineerId ? draft.values : base), [taskId]: value },
    })
  }

  function resetToDefaults() {
    if (selected === undefined) return
    setDraft({
      engineerId: selected.engineerId,
      values: Object.fromEntries(
        selected.tasks.map((task) => [task.taskId, String(task.defaultWeight)]),
      ),
    })
  }

  function save() {
    if (selected === undefined || !validTotal) return
    const saved = onSave(
      selected.engineerId,
      values.map(({ task, parsed }) => ({ taskId: task.taskId, weight: parsed })),
    )
    if (saved) setDraft(null)
  }

  return (
    <OperationPanel
      aside={<Badge variant={validTotal ? "secondary" : "destructive"}>합계 {total}%</Badge>}
      description="엔지니어마다 적용할 과제와 최종 반영 비율을 설정합니다. 0% 과제는 평가와 순위 계산에서 제외됩니다."
      title="개인별 과제 가중치"
    >
      {selected === undefined ? (
        <p className="rounded-md border border-dashed px-5 py-12 text-center text-sm text-muted-foreground">
          먼저 엔지니어 명단을 등록해 주세요.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <label className="mb-2 block text-sm font-medium" htmlFor="engineer-task-weight-select">
                엔지니어
              </label>
              <Select
                onValueChange={(value) => { setSelectedId(value); setDraft(null) }}
                value={selected.engineerId}
              >
                <SelectTrigger id="engineer-task-weight-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rows.map((row) => (
                    <SelectItem key={row.engineerId} value={row.engineerId}>
                      {row.engineerName} · {row.employeeLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{selected.teamName}</Badge>
              <span>{selected.customized ? "개인 설정 저장됨" : "시즌 기본값 적용 중"}</span>
            </div>
          </div>

          <div className="divide-y rounded-md border">
            {values.map(({ task, value, parsed }) => (
              <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center" key={task.taskId}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{task.taskName}</p>
                    <Badge variant="outline">{METHOD_LABELS[task.method]}</Badge>
                    {parsed === 0 ? <Badge variant="secondary">평가 제외</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">시즌 기본 {task.defaultWeight}%</p>
                </div>
                <div>
                  <label className="sr-only" htmlFor={`engineer-task-weight-${task.taskId}`}>
                    {task.taskName} 가중치
                  </label>
                  <div className="relative">
                    <Input
                      aria-invalid={value.trim() === "" || !Number.isFinite(parsed) || parsed < 0 || parsed > 100}
                      className="numeric pr-8 text-right"
                      disabled={disabled}
                      id={`engineer-task-weight-${task.taskId}`}
                      inputMode="decimal"
                      max="100"
                      min="0"
                      onChange={(event) => updateWeight(task.taskId, event.currentTarget.value)}
                      step="0.1"
                      type="number"
                      value={value}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!validTotal ? (
            <p aria-live="polite" className="text-sm font-medium text-destructive">
              가중치 합계를 100%로 맞춰야 저장할 수 있습니다. 현재 {total}%입니다.
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button disabled={disabled} onClick={resetToDefaults} type="button" variant="outline">
              시즌 기본값으로 맞추기
            </Button>
            <Button disabled={disabled || !validTotal || !dirty} onClick={save} type="button">
              개인별 가중치 저장
            </Button>
          </div>
        </div>
      )}
    </OperationPanel>
  )
}
