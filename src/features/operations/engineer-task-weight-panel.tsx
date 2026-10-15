"use client"

import { useState } from "react"

import "./operation-rules-signal.css"

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
  useSeasonDefaults: boolean
}>

type Props = Readonly<{
  rows: ReadonlyArray<EngineerTaskWeightViewModel>
  disabled: boolean
  onSave: (
    engineerId: string,
    weights: ReadonlyArray<Readonly<{ taskId: string; weight: number }>>,
    useSeasonDefaults?: boolean,
  ) => boolean
}>

const roundToOne = (value: number): number => Math.round(value * 10) / 10

export function EngineerTaskWeightPanel({ rows, disabled, onSave }: Props) {
  const [selectedId, setSelectedId] = useState(rows[0]?.engineerId ?? "")
  const [draft, setDraft] = useState<WeightDraft | null>(null)
  const selected = rows.find((row) => row.engineerId === selectedId) ?? rows[0]
  const seasonDefaultsEnabled = selected === undefined
    ? true
    : draft?.engineerId === selected.engineerId
      ? draft.useSeasonDefaults
      : (selected.seasonDefaultsEnabled ?? !selected.customized)
  const values = selected?.tasks.map((task) => {
    const value = seasonDefaultsEnabled
      ? String(task.defaultWeight)
      : draft?.engineerId === selected.engineerId
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
  ) || (selected !== undefined && seasonDefaultsEnabled !== (selected.seasonDefaultsEnabled ?? !selected.customized))

  function updateWeight(taskId: string, value: string) {
    if (selected === undefined) return
    const base = Object.fromEntries(selected.tasks.map((task) => [task.taskId, String(task.weight)]))
    setDraft({
      engineerId: selected.engineerId,
      values: { ...(draft?.engineerId === selected.engineerId ? draft.values : base), [taskId]: value },
      useSeasonDefaults: false,
    })
  }

  function resetToDefaults() {
    if (selected === undefined) return
    setDraft({
      engineerId: selected.engineerId,
      values: Object.fromEntries(
        selected.tasks.map((task) => [task.taskId, String(task.defaultWeight)]),
      ),
      useSeasonDefaults: true,
    })
  }

  function save() {
    if (selected === undefined || !validTotal) return
    const nextWeights = values.map(({ task, parsed }) => ({ taskId: task.taskId, weight: parsed }))
    const saved = seasonDefaultsEnabled
      ? onSave(selected.engineerId, nextWeights, true)
      : onSave(selected.engineerId, nextWeights)
    if (saved) setDraft(null)
  }

  return (
    <div className="signal-weight-panel">
    <OperationPanel
      aside={<Badge variant={validTotal ? "secondary" : "destructive"}>합계 {total}%</Badge>}
      description="엔지니어별 적용 과제와 최종 반영 비율 설정. 0% 과제는 평가·순위 계산에서 제외"
      title="개인별 과제 가중치"
    >
      {selected === undefined ? (
        <p className="signal-weight-empty">먼저 엔지니어 명단을 등록해 주세요.</p>
      ) : (
        <div className="signal-weight-body">
          <div className="signal-weight-toolbar">
            <div className="signal-weight-engineer">
              <label htmlFor="engineer-task-weight-select">엔지니어</label>
              <Select onValueChange={(value) => { setSelectedId(value); setDraft(null) }} value={selected.engineerId}>
                <SelectTrigger id="engineer-task-weight-select"><SelectValue /></SelectTrigger>
                <SelectContent className="signal-rules-select-popup">
                  {rows.map((row) => <SelectItem key={row.engineerId} value={row.engineerId}>{row.engineerName} · {row.employeeLabel}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="signal-weight-team"><span>소속팀</span><Badge variant="outline">{selected.teamName}</Badge></div>
            <label className="signal-weight-defaults">
              <input checked={seasonDefaultsEnabled} className="size-4 accent-primary" disabled={disabled}
                onChange={(event) => {
                  const enabled = event.currentTarget.checked
                  setDraft({ engineerId: selected.engineerId, values: Object.fromEntries(selected.tasks.map((task) => [task.taskId, String(enabled ? task.defaultWeight : task.weight)])), useSeasonDefaults: enabled, })
                }} type="checkbox" />
              시즌 기본값 적용
            </label>
            <div className="signal-weight-actions">
              <Button disabled={disabled} onClick={resetToDefaults} type="button" variant="outline">시즌 기본값으로 맞추기</Button>
              <Button disabled={disabled || !validTotal || !dirty} onClick={save} type="button">개인별 가중치 저장</Button>
            </div>
          </div>
          <div className="signal-weight-table-wrap">
            <table className="signal-weight-table">
              <caption className="sr-only">엔지니어별 과제 가중치 편집</caption>
              <thead><tr><th scope="col">과제명</th><th scope="col">평가 방식</th><th scope="col">시즌 기본 가중치</th><th scope="col">개인별 가중치 (%)</th></tr></thead>
              <tbody>
                {values.map(({ task, value, parsed }) => (
                  <tr key={task.taskId}>
                    <th scope="row">{task.taskName}</th>
                    <td>{METHOD_LABELS[task.method]}</td>
                    <td>시즌 기본 {task.defaultWeight}%</td>
                    <td>
                      <label className="sr-only" htmlFor={`engineer-task-weight-${task.taskId}`}>{task.taskName} 가중치</label>
                      <div className="signal-weight-input">
                        <Input aria-invalid={value.trim() === "" || !Number.isFinite(parsed) || parsed < 0 || parsed > 100}
                          className="numeric" disabled={disabled || seasonDefaultsEnabled} id={`engineer-task-weight-${task.taskId}`}
                          inputMode="decimal" max="100" min="0" onChange={(event) => updateWeight(task.taskId, event.currentTarget.value)}
                          step="0.1" type="number" value={value} />
                        <span>%</span>{parsed === 0 ? <Badge variant="secondary">평가 제외</Badge> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!validTotal ? (
            <p aria-live="polite" className="signal-weight-warning">
              {seasonDefaultsEnabled
                ? `시즌 기본값 합계가 ${total}%입니다. 개인별 선택을 위해 시즌 기본값 적용을 해제하고 합계를 100%로 맞춰 주세요.`
                : `가중치 합계를 100%로 맞춰야 저장할 수 있습니다. 현재 ${total}%입니다.`}
            </p>
          ) : null}
        </div>
      )}
    </OperationPanel>
    </div>
  )
}
