"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { OperationPanel } from "./operation-panel"
import type { DerivedScoreRuleDraft, DerivedScoreRuleViewModel } from "./types"

type Option = Readonly<{ taskId: string; taskName: string }>
type EngineerOption = Readonly<{
  engineerId: string
  engineerName: string
  teamName: string
}>

type Props = Readonly<{
  rules: ReadonlyArray<DerivedScoreRuleViewModel>
  derivedTasks: ReadonlyArray<Option>
  sourceTasks: ReadonlyArray<Option>
  engineers: ReadonlyArray<EngineerOption>
  disabled: boolean
  onSave?: ((rule: DerivedScoreRuleDraft) => boolean) | undefined
  onDelete?: ((ruleId: string) => boolean) | undefined
}>

const EMPTY: DerivedScoreRuleDraft = {
  ruleId: null,
  taskId: "",
  targetEngineerId: "",
  sourceTaskId: "",
  sourceEngineerIds: [],
}

export function DerivedScoreRulePanel({
  rules,
  derivedTasks,
  sourceTasks,
  engineers,
  disabled,
  onSave,
  onDelete,
}: Props) {
  const [form, setForm] = useState<DerivedScoreRuleDraft>(EMPTY)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const visibleEngineers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR")
    return engineers.filter((engineer) =>
      engineer.engineerId !== form.targetEngineerId &&
      (normalized === "" || `${engineer.engineerName} ${engineer.teamName}`
        .toLocaleLowerCase("ko-KR").includes(normalized)))
  }, [engineers, form.targetEngineerId, query])

  function reset() {
    setForm(EMPTY)
    setQuery("")
    setError(null)
  }

  function edit(rule: DerivedScoreRuleViewModel) {
    setForm(rule)
    setQuery("")
    setError(null)
  }

  function toggleSource(engineerId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      sourceEngineerIds: checked
        ? [...current.sourceEngineerIds, engineerId]
        : current.sourceEngineerIds.filter((id) => id !== engineerId),
    }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form.taskId === "" || form.targetEngineerId === "" || form.sourceTaskId === "") {
      setError("대상 엔지니어, 파생 과제와 원천 과제를 선택해 주세요.")
      return
    }
    if (form.sourceEngineerIds.length === 0) {
      setError("평균에 반영할 원천 엔지니어를 한 명 이상 선택해 주세요.")
      return
    }
    if (onSave?.(form) ?? false) reset()
  }

  const nameOf = (engineerId: string) =>
    engineers.find((engineer) => engineer.engineerId === engineerId)?.engineerName ?? "삭제된 엔지니어"
  const taskNameOf = (taskId: string) =>
    [...derivedTasks, ...sourceTasks].find((task) => task.taskId === taskId)?.taskName ?? "삭제된 과제"

  return (
    <OperationPanel
      description="선택한 인원들의 확정된 평가 점수를 평균해 다른 엔지니어의 과제 점수로 연결합니다. 한 명이라도 미확정이면 파생 점수도 미확정입니다."
      title="연계·파생 점수"
    >
      {derivedTasks.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          과제 구성에서 평가방식을 ‘연계 점수 평균’으로 한 과제를 먼저 추가해 주세요.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <form className="space-y-4 rounded-md border bg-muted/20 p-4" onSubmit={submit}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{form.ruleId === null ? "연계 규칙 추가" : "연계 규칙 수정"}</h3>
              {form.ruleId !== null ? <Button onClick={reset} size="sm" type="button" variant="ghost">새 규칙</Button> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm"><span className="font-medium">점수를 받을 엔지니어</span><select className="h-9 w-full rounded-md border border-input bg-background px-2" disabled={disabled} onChange={(event) => setForm((current) => ({ ...current, targetEngineerId: event.currentTarget.value, sourceEngineerIds: current.sourceEngineerIds.filter((id) => id !== event.currentTarget.value) }))} value={form.targetEngineerId}><option value="">선택</option>{engineers.map((engineer) => <option key={engineer.engineerId} value={engineer.engineerId}>{engineer.engineerName} · {engineer.teamName}</option>)}</select></label>
              <label className="space-y-1.5 text-sm"><span className="font-medium">파생 점수 과제</span><select className="h-9 w-full rounded-md border border-input bg-background px-2" disabled={disabled} onChange={(event) => setForm((current) => ({ ...current, taskId: event.currentTarget.value }))} value={form.taskId}><option value="">선택</option>{derivedTasks.map((task) => <option key={task.taskId} value={task.taskId}>{task.taskName}</option>)}</select></label>
              <label className="space-y-1.5 text-sm sm:col-span-2"><span className="font-medium">평균 원천 과제</span><select className="h-9 w-full rounded-md border border-input bg-background px-2" disabled={disabled} onChange={(event) => setForm((current) => ({ ...current, sourceTaskId: event.currentTarget.value }))} value={form.sourceTaskId}><option value="">평가자 과제 선택</option>{sourceTasks.map((task) => <option key={task.taskId} value={task.taskId}>{task.taskName}</option>)}</select></label>
            </div>
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-medium">원천 엔지니어</p><p className="text-xs text-muted-foreground">선택 {form.sourceEngineerIds.length}명</p></div><Input aria-label="원천 엔지니어 검색" className="max-w-56" onChange={(event) => setQuery(event.currentTarget.value)} placeholder="이름 또는 팀 검색" value={query} /></div>
              <div className="grid max-h-64 gap-1 overflow-y-auto rounded-md border bg-background p-2 sm:grid-cols-2">
                {visibleEngineers.map((engineer) => (
                  <label className="flex min-h-10 items-center gap-2 rounded px-2 text-sm hover:bg-muted" key={engineer.engineerId}>
                    <input checked={form.sourceEngineerIds.includes(engineer.engineerId)} className="size-4 accent-primary" disabled={disabled} onChange={(event) => toggleSource(engineer.engineerId, event.currentTarget.checked)} type="checkbox" />
                    <span>{engineer.engineerName} <span className="text-xs text-muted-foreground">· {engineer.teamName}</span></span>
                  </label>
                ))}
              </div>
            </div>
            {error !== null ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
            <Button disabled={disabled} type="submit"><Plus aria-hidden="true" />연계 규칙 저장</Button>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-semibold">현재 시즌 연결</h3><Badge variant="secondary">{rules.length}개</Badge></div>
            {rules.length === 0 ? <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">저장된 연계 규칙이 없습니다.</p> : rules.map((rule) => (
              <article className="rounded-md border p-3" key={rule.ruleId}>
                <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{nameOf(rule.targetEngineerId)} · {taskNameOf(rule.taskId)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{taskNameOf(rule.sourceTaskId)} · {rule.sourceEngineerIds.map(nameOf).join(", ")} 평균</p></div><div className="flex shrink-0 gap-1"><Button aria-label={`${nameOf(rule.targetEngineerId)} 연계 규칙 수정`} disabled={disabled} onClick={() => edit(rule)} size="icon" type="button" variant="ghost"><Pencil aria-hidden="true" /></Button><Button aria-label={`${nameOf(rule.targetEngineerId)} 연계 규칙 삭제`} disabled={disabled} onClick={() => { if (window.confirm("이 연계 규칙을 삭제할까요?")) onDelete?.(rule.ruleId) }} size="icon" type="button" variant="ghost"><Trash2 aria-hidden="true" /></Button></div></div>
              </article>
            ))}
          </div>
        </div>
      )}
    </OperationPanel>
  )
}
