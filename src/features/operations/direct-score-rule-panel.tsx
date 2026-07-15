"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { OperationPanel } from "./operation-panel"
import type { DirectScoreRuleDraft, DirectScoreRuleViewModel } from "./types"

type Props = Readonly<{
  rules: readonly DirectScoreRuleViewModel[]
  operatorTasks: readonly Readonly<{ taskId: string; taskName: string }>[]
  disabled: boolean
  onSave?: ((rule: DirectScoreRuleDraft) => boolean) | undefined
  onDelete?: ((ruleId: string) => boolean) | undefined
}>

type FormState = Readonly<{
  ruleId: string | null
  taskId: string
  kind: "language" | "certification"
  label: string
  field: "examName" | "result" | "certificateName" | "grade"
  operator: "equals" | "contains" | "gte"
  value: string
  ruleType: "base" | "bonus"
  score: string
  bonus: string
  enabled: boolean
}>

const EMPTY_FORM: FormState = {
  ruleId: null,
  taskId: "",
  kind: "language",
  label: "",
  field: "result",
  operator: "gte",
  value: "",
  ruleType: "base",
  score: "0",
  bonus: "0",
  enabled: true,
}

const FIELD_OPTIONS = {
  language: [
    ["examName", "시험명"],
    ["result", "시험 결과"],
  ],
  certification: [
    ["certificateName", "자격증명"],
    ["grade", "등급/종목"],
  ],
} as const

function formatRule(rule: DirectScoreRuleViewModel): string {
  const operator = rule.operator === "gte" ? "이상" : rule.operator === "contains" ? "포함" : "일치"
  const outcome = rule.ruleType === "base" ? `기본 ${rule.score}점` : `가산 +${rule.bonus}점`
  return `${rule.label} · ${rule.value} ${operator} · ${outcome}`
}

export function DirectScoreRulePanel({ rules, operatorTasks, disabled, onSave, onDelete }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function edit(rule: DirectScoreRuleViewModel) {
    setForm({
      ruleId: rule.id,
      taskId: rule.taskId,
      kind: rule.kind,
      label: rule.label,
      field: rule.field,
      operator: rule.operator,
      value: rule.value,
      ruleType: rule.ruleType,
      score: String(rule.score),
      bonus: String(rule.bonus),
      enabled: rule.enabled,
    })
    setError(null)
  }

  function reset() {
    setForm(EMPTY_FORM)
    setError(null)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form.taskId === "" || form.label.trim() === "" || form.value.trim() === "") {
      setError("과제, 규칙명, 기준값을 입력해 주세요.")
      return
    }
    const score = Number(form.score)
    const bonus = Number(form.bonus)
    if (!Number.isFinite(score) || !Number.isFinite(bonus) || score < 0 || score > 100 || bonus < 0 || bonus > 100) {
      setError("기본 점수와 가산점은 0~100 사이로 입력해 주세요.")
      return
    }
    const saved = onSave?.({
      ruleId: form.ruleId,
      taskId: form.taskId,
      kind: form.kind,
      label: form.label.trim(),
      field: form.field,
      operator: form.operator,
      value: form.value.trim(),
      ruleType: form.ruleType,
      score,
      bonus,
      enabled: form.enabled,
    }) ?? false
    if (saved) reset()
  }

  return (
    <OperationPanel
      description="원천 실적의 기준값을 점수로 환산합니다. 기본 규칙 하나와 가산점 규칙을 조합해 시즌별 기준을 남길 수 있습니다."
      title="어학·자격증 환산 규칙"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form className="grid gap-3 rounded-md border bg-muted/20 p-4" onSubmit={submit}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{form.ruleId === null ? "규칙 추가" : "규칙 수정"}</p>
            {form.ruleId !== null ? <Button onClick={reset} size="sm" type="button" variant="ghost">새 규칙</Button> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">연결 과제</span>
              <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled} onChange={(event) => update("taskId", event.currentTarget.value)} value={form.taskId}>
                <option value="">과제를 선택하세요</option>
                {operatorTasks.map((task) => <option key={task.taskId} value={task.taskId}>{task.taskName}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">원천 종류</span>
              <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled} onChange={(event) => { const kind = event.currentTarget.value === "certification" ? "certification" : "language"; update("kind", kind); update("field", kind === "language" ? "result" : "certificateName") }} value={form.kind}>
                <option value="language">어학</option>
                <option value="certification">자격증</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm"><span className="font-medium">규칙 이름</span><Input disabled={disabled} onChange={(event) => update("label", event.currentTarget.value)} placeholder="예: TOEIC 800점 이상" value={form.label} /></label>
            <label className="space-y-1.5 text-sm"><span className="font-medium">판정 필드</span><select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled} onChange={(event) => update("field", event.currentTarget.value as FormState["field"])} value={form.field}>{FIELD_OPTIONS[form.kind].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm"><span className="font-medium">조건</span><select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled} onChange={(event) => update("operator", event.currentTarget.value as FormState["operator"])} value={form.operator}><option value="gte">이상 (숫자)</option><option value="contains">포함</option><option value="equals">일치</option></select></label>
            <label className="space-y-1.5 text-sm sm:col-span-2"><span className="font-medium">기준값</span><Input disabled={disabled} onChange={(event) => update("value", event.currentTarget.value)} placeholder="예: 800 또는 TOEIC" value={form.value} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm"><span className="font-medium">규칙 유형</span><select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled} onChange={(event) => update("ruleType", event.currentTarget.value as FormState["ruleType"])} value={form.ruleType}><option value="base">기본 점수</option><option value="bonus">가산점</option></select></label>
            <label className="space-y-1.5 text-sm"><span className="font-medium">기본 점수</span><Input disabled={disabled || form.ruleType === "bonus"} min="0" max="100" onChange={(event) => update("score", event.currentTarget.value)} step="0.1" type="number" value={form.score} /></label>
            <label className="space-y-1.5 text-sm"><span className="font-medium">가산점</span><Input disabled={disabled || form.ruleType === "base"} min="0" max="100" onChange={(event) => update("bonus", event.currentTarget.value)} step="0.1" type="number" value={form.bonus} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input checked={form.enabled} className="size-4 accent-primary" disabled={disabled} onChange={(event) => update("enabled", event.currentTarget.checked)} type="checkbox" />이 규칙 사용</label>
          {error !== null ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <Button disabled={disabled || operatorTasks.length === 0} type="submit"><Plus aria-hidden="true" />{form.ruleId === null ? "환산 규칙 저장" : "수정 저장"}</Button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between"><p className="font-medium">현재 시즌 규칙</p><Badge variant="secondary">{rules.length}개</Badge></div>
          {rules.length === 0 ? <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">등록된 규칙이 없습니다. 원천 실적은 운영자가 직접 입력한 점수를 사용합니다.</p> : rules.map((rule) => (
            <article className="rounded-md border p-3" key={rule.id}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{rule.label}</p><Badge variant="outline">{rule.kind === "language" ? "어학" : "자격증"}</Badge><Badge variant={rule.enabled ? "secondary" : "outline"}>{rule.enabled ? "사용" : "중지"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{formatRule(rule)}</p></div><div className="flex shrink-0 gap-1"><Button aria-label={`${rule.label} 수정`} disabled={disabled} onClick={() => edit(rule)} size="icon" type="button" variant="ghost"><Pencil aria-hidden="true" /></Button><Button aria-label={`${rule.label} 삭제`} disabled={disabled} onClick={() => { if (window.confirm(`${rule.label} 규칙을 삭제할까요?`)) onDelete?.(rule.id) }} size="icon" type="button" variant="ghost"><Trash2 aria-hidden="true" /></Button></div></div>
            </article>
          ))}
        </div>
      </div>
    </OperationPanel>
  )
}
