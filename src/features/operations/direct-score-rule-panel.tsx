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
  category: string
  difficulty: string
  workRelevance: string
  languageGroup: "english" | "second_language"
  examName: string
  bonusCondition: "grade_upgrade" | "second_language_new"
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
  category: "",
  difficulty: "",
  workRelevance: "",
  languageGroup: "english",
  examName: "",
  bonusCondition: "grade_upgrade",
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
  const outcome = rule.ruleType === "base"
    ? `기본 ${rule.rawScore ?? rule.score}점${rule.rawScore !== undefined && rule.rawScore !== null && rule.rawScore !== rule.score ? ` · 시스템 반영 ${rule.score}점` : ""}`
    : `가산 +${rule.bonus}점`
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
      score: String(rule.rawScore ?? rule.score),
      bonus: String(rule.bonus),
      enabled: rule.enabled,
      category: rule.category ?? "",
      difficulty: rule.difficulty ?? "",
      workRelevance: rule.workRelevance ?? "",
      languageGroup: rule.languageGroup ?? "english",
      examName: rule.examName ?? "",
      bonusCondition: rule.bonusCondition ?? "grade_upgrade",
    })
    setError(null)
  }

  function reset() {
    setForm(EMPTY_FORM)
    setError(null)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form.taskId === "" || form.label.trim() === "" || (form.kind !== "language" || form.ruleType === "base") && form.value.trim() === "") {
      setError("과제, 규칙명, 기준값을 입력해 주세요.")
      return
    }
    if (form.kind === "language" && form.ruleType === "base" && form.examName.trim() === "") {
      setError("어학 기본 점수에는 언어 구분과 시험명을 입력해 주세요.")
      return
    }
    const score = Number(form.score)
    const bonus = Number(form.bonus)
    if (!Number.isFinite(score) || !Number.isFinite(bonus) || score < 0 || score > 110 || bonus < 0 || bonus > 100) {
      setError("기본 점수는 0~110, 가산점은 0~100 사이로 입력해 주세요.")
      return
    }
    const saved = onSave?.({
      ruleId: form.ruleId,
      taskId: form.taskId,
      kind: form.kind,
      label: form.label.trim(),
      field: form.kind === "certification" ? "certificateName" : form.field,
      operator: form.kind === "certification" ? "equals" : form.operator,
      value: form.kind === "language" && form.ruleType === "bonus" ? "*" : form.value.trim(),
      ruleType: form.kind === "certification" ? "base" : form.ruleType,
      score: Math.min(100, score),
      ...(score > 100 ? { rawScore: score } : {}),
      bonus,
      enabled: form.enabled,
      category: form.category.trim() === "" ? null : form.category.trim(),
      difficulty: form.difficulty.trim() === "" ? null : form.difficulty.trim(),
      workRelevance: form.workRelevance.trim() === "" ? null : form.workRelevance.trim(),
      ...(form.kind === "language" && form.ruleType === "base" ? {
        languageGroup: form.languageGroup,
        examName: form.examName.trim(),
      } : {}),
      ...(form.kind === "language" && form.ruleType === "bonus" ? {
        bonusCondition: form.bonusCondition,
      } : {}),
    }) ?? false
    if (saved) reset()
  }

  return (
    <OperationPanel
      description="시즌별 자격증 기본점수·신규취득 가산점과 어학 환산 기준을 직접 추가, 수정, 삭제합니다."
      title="자격·어학 평가표"
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
              <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled} onChange={(event) => { const kind = event.currentTarget.value === "certification" ? "certification" : "language"; setForm((current) => ({ ...current, kind, field: kind === "language" ? "result" : "certificateName", operator: kind === "language" ? "gte" : "equals", ruleType: "base" })) }} value={form.kind}>
                <option value="language">어학</option>
                <option value="certification">자격증</option>
              </select>
            </label>
          </div>
          {form.kind === "certification" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1.5 text-sm"><span className="font-medium">분야</span><Input disabled={disabled} onChange={(event) => update("category", event.currentTarget.value)} placeholder="예: 공정·설비" value={form.category} /></label>
              <label className="space-y-1.5 text-sm"><span className="font-medium">난이도</span><Input disabled={disabled} onChange={(event) => update("difficulty", event.currentTarget.value)} placeholder="예: 상" value={form.difficulty} /></label>
              <label className="space-y-1.5 text-sm"><span className="font-medium">업무연관성</span><Input disabled={disabled} onChange={(event) => update("workRelevance", event.currentTarget.value)} placeholder="예: 매우높음" value={form.workRelevance} /></label>
            </div>
          ) : form.ruleType === "base" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm"><span className="font-medium">언어 구분</span><select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled} onChange={(event) => update("languageGroup", event.currentTarget.value === "second_language" ? "second_language" : "english")} value={form.languageGroup}><option value="english">영어</option><option value="second_language">제2외국어</option></select></label>
              <label className="space-y-1.5 text-sm"><span className="font-medium">시험명</span><Input disabled={disabled} onChange={(event) => update("examName", event.currentTarget.value)} placeholder="예: OPIc, TOEIC Speaking" value={form.examName} /></label>
            </div>
          ) : (
            <label className="space-y-1.5 text-sm"><span className="font-medium">가산 조건</span><select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled} onChange={(event) => update("bonusCondition", event.currentTarget.value === "second_language_new" ? "second_language_new" : "grade_upgrade")} value={form.bonusCondition}><option value="grade_upgrade">전년 동일 언어 등급 상향</option><option value="second_language_new">제2외국어 IM1 이상 신규 취득</option></select></label>
          )}
          {form.kind === "language" && form.ruleType === "bonus" ? null : <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm"><span className="font-medium">규칙 이름</span><Input disabled={disabled} onChange={(event) => update("label", event.currentTarget.value)} placeholder="예: TOEIC 800점 이상" value={form.label} /></label>
            <label className="space-y-1.5 text-sm"><span className="font-medium">판정 필드</span><select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled || form.kind === "certification"} onChange={(event) => update("field", event.currentTarget.value as FormState["field"])} value={form.field}>{FIELD_OPTIONS[form.kind].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>}
          {form.kind === "language" && form.ruleType === "bonus" ? null : <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm"><span className="font-medium">조건</span><select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled || form.kind === "certification"} onChange={(event) => update("operator", event.currentTarget.value as FormState["operator"])} value={form.operator}><option value="gte">이상 (숫자)</option><option value="contains">포함</option><option value="equals">일치</option></select></label>
            <label className="space-y-1.5 text-sm sm:col-span-2"><span className="font-medium">기준값</span><Input disabled={disabled} onChange={(event) => update("value", event.currentTarget.value)} placeholder="예: 800 또는 TOEIC" value={form.value} /></label>
          </div>}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm"><span className="font-medium">규칙 유형</span><select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={disabled || form.kind === "certification"} onChange={(event) => update("ruleType", event.currentTarget.value as FormState["ruleType"])} value={form.ruleType}><option value="base">기본 점수</option><option value="bonus">가산점</option></select></label>
            <label className="space-y-1.5 text-sm"><span className="font-medium">기본 점수</span><Input disabled={disabled || (form.kind === "language" && form.ruleType === "bonus")} min="0" max="110" onChange={(event) => update("score", event.currentTarget.value)} step="0.1" type="number" value={form.score} /></label>
            <label className="space-y-1.5 text-sm"><span className="font-medium">{form.kind === "certification" ? "신규취득 가산점" : "가산점"}</span><Input disabled={disabled || (form.kind === "language" && form.ruleType === "base")} min="0" max="100" onChange={(event) => update("bonus", event.currentTarget.value)} step="0.1" type="number" value={form.bonus} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input checked={form.enabled} className="size-4 accent-primary" disabled={disabled} onChange={(event) => update("enabled", event.currentTarget.checked)} type="checkbox" />이 규칙 사용</label>
          {error !== null ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <Button disabled={disabled || operatorTasks.length === 0} type="submit"><Plus aria-hidden="true" />{form.ruleId === null ? "환산 규칙 저장" : "수정 저장"}</Button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between"><p className="font-medium">현재 시즌 규칙</p><Badge variant="secondary">{rules.length}개</Badge></div>
          {rules.length === 0 ? <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">등록된 규칙이 없습니다. 원천 실적은 운영자가 직접 입력한 점수를 사용합니다.</p> : rules.map((rule) => (
            <article className="rounded-md border p-3" key={rule.id}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{rule.label}</p><Badge variant="outline">{rule.kind === "language" ? "어학" : "자격증"}</Badge><Badge variant={rule.enabled ? "secondary" : "outline"}>{rule.enabled ? "사용" : "중지"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{formatRule(rule)}</p>{rule.kind === "certification" ? <p className="mt-1 text-xs text-muted-foreground">{rule.category ?? "분야 미설정"} · 난이도 {rule.difficulty ?? "미설정"} · 업무연관성 {rule.workRelevance ?? "미설정"} · 기본 {rule.score}점 · 신규 +{rule.bonus}점</p> : <p className="mt-1 text-xs text-muted-foreground">{rule.ruleType === "base" ? `${rule.languageGroup === "second_language" ? "제2외국어" : "영어"} · ${rule.examName ?? "시험 미설정"}` : rule.bonusCondition === "second_language_new" ? "제2외국어 신규취득 가점" : "등급 상향 가점"}</p>}</div><div className="flex shrink-0 gap-1"><Button aria-label={`${rule.label} 수정`} disabled={disabled} onClick={() => edit(rule)} size="icon" type="button" variant="ghost"><Pencil aria-hidden="true" /></Button><Button aria-label={`${rule.label} 삭제`} disabled={disabled} onClick={() => { if (window.confirm(`${rule.label} 규칙을 삭제할까요?`)) onDelete?.(rule.id) }} size="icon" type="button" variant="ghost"><Trash2 aria-hidden="true" /></Button></div></div>
            </article>
          ))}
        </div>
      </div>
    </OperationPanel>
  )
}
