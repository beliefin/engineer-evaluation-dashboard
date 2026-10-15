"use client"

import { Plus } from "lucide-react"

import "./operation-rules-signal.css"
import { useState, type FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import type { DirectScoreRuleDraft, DirectScoreRuleImpactViewModel } from "./types"

type Props = Readonly<{
  operatorTasks: readonly Readonly<{ taskId: string; taskName: string }>[]
  disabled: boolean
  initialRule?: DirectScoreRuleDraft | undefined
  onReset: () => void
  onSave?: ((rule: DirectScoreRuleDraft) => boolean) | undefined
  onPreview?: ((rule: DirectScoreRuleDraft) => DirectScoreRuleImpactViewModel) | undefined
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
  language: [["examName", "시험명"], ["result", "시험 결과"]],
  certification: [["certificateName", "자격증명"], ["grade", "등급/종목"]],
} as const

const SELECT_CLASS = "h-8 w-full min-w-0 rounded-[4px] border border-input bg-card px-2 text-sm"
const FIELD_CLASS = "min-w-0 space-y-1 text-xs"

function toFormState(rule: DirectScoreRuleDraft | undefined): FormState {
  if (rule === undefined) return EMPTY_FORM
  return {
    ...rule,
    score: String(rule.rawScore ?? rule.score),
    bonus: String(rule.bonus),
    category: rule.category ?? "",
    difficulty: rule.difficulty ?? "",
    workRelevance: rule.workRelevance ?? "",
    languageGroup: rule.languageGroup ?? "english",
    examName: rule.examName ?? "",
    bonusCondition: rule.bonusCondition ?? "grade_upgrade",
  }
}

export function DirectScoreRuleForm({ operatorTasks, disabled, initialRule, onReset, onSave, onPreview }: Props) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialRule))
  const [error, setError] = useState<string | null>(null)
  const [impact, setImpact] = useState<DirectScoreRuleImpactViewModel | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function reset() {
    setForm(EMPTY_FORM)
    setError(null)
    setImpact(null)
    onReset()
  }

  function draftFromForm(): DirectScoreRuleDraft | null {
    if (form.taskId === "" || form.label.trim() === "" || (form.kind !== "language" || form.ruleType === "base") && form.value.trim() === "") {
      setError("과제, 규칙명, 기준값을 입력해 주세요.")
      return null
    }
    if (form.kind === "language" && form.ruleType === "base" && form.examName.trim() === "") {
      setError("어학 기본 점수에는 언어 구분과 시험명을 입력해 주세요.")
      return null
    }
    const score = Number(form.score)
    const bonus = Number(form.bonus)
    if (!Number.isFinite(score) || !Number.isFinite(bonus) || score < 0 || score > 110 || bonus < 0 || bonus > 100) {
      setError("기본 점수는 0~110, 가산점은 0~100 사이로 입력해 주세요.")
      return null
    }
    setError(null)
    return {
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
      ...(form.kind === "language" && form.ruleType === "base" ? { languageGroup: form.languageGroup, examName: form.examName.trim() } : {}),
      ...(form.kind === "language" && form.ruleType === "bonus" ? { bonusCondition: form.bonusCondition } : {}),
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const draft = draftFromForm()
    if (draft !== null && (onSave?.(draft) ?? false)) reset()
  }

  return (
    <form aria-label="환산 규칙 편집" className="signal-rule-form grid self-start gap-2 rounded-md border bg-muted/20 p-3" data-rule-kind={form.kind} data-rule-type={form.ruleType} onSubmit={submit}>
      <div className="signal-rule-form-heading flex items-center justify-between gap-2">
        <p className="font-medium">{form.ruleId === null ? "규칙 추가" : "규칙 수정"}</p>
        {form.ruleId !== null ? <Button onClick={reset} size="sm" type="button" variant="ghost">새 규칙</Button> : null}
      </div>

      <div className="signal-rule-fields grid gap-x-2 gap-y-2 sm:grid-cols-2 lg:grid-cols-6">
        <label className={`${FIELD_CLASS} sm:col-span-2 lg:col-span-3`}><span className="font-medium">연결 과제</span><select className={SELECT_CLASS} disabled={disabled} onChange={(event) => update("taskId", event.currentTarget.value)} value={form.taskId}><option value="">과제를 선택하세요</option>{operatorTasks.map((task) => <option key={task.taskId} value={task.taskId}>{task.taskName}</option>)}</select></label>
        <label className={`${FIELD_CLASS} lg:col-span-2`}><span className="font-medium">원천 종류</span><select className={SELECT_CLASS} disabled={disabled} onChange={(event) => { const kind = event.currentTarget.value === "certification" ? "certification" : "language"; setForm((current) => ({ ...current, kind, field: kind === "language" ? "result" : "certificateName", operator: kind === "language" ? "gte" : "equals", ruleType: "base" })) }} value={form.kind}><option value="language">어학</option><option value="certification">자격증</option></select></label>
        <label className={`${FIELD_CLASS} lg:col-span-1`}><span className="font-medium">상태</span><span className="flex h-8 items-center gap-2 rounded-[4px] border border-border-subtle bg-card px-2"><input checked={form.enabled} className="size-4 accent-primary" disabled={disabled} onChange={(event) => update("enabled", event.currentTarget.checked)} type="checkbox" />규칙 사용</span></label>

        {form.kind === "certification" ? (
          <>
            <label className={`${FIELD_CLASS} lg:col-span-2`} htmlFor="direct-rule-category"><span className="font-medium">분야</span><Input disabled={disabled} id="direct-rule-category" onChange={(event) => update("category", event.currentTarget.value)} placeholder="예: 공정·설비" value={form.category} /></label>
            <label className={FIELD_CLASS} htmlFor="direct-rule-difficulty"><span className="font-medium">난이도</span><Input disabled={disabled} id="direct-rule-difficulty" onChange={(event) => update("difficulty", event.currentTarget.value)} placeholder="예: 상" value={form.difficulty} /></label>
            <label className={FIELD_CLASS} htmlFor="direct-rule-relevance"><span className="font-medium">업무연관성</span><Input disabled={disabled} id="direct-rule-relevance" onChange={(event) => update("workRelevance", event.currentTarget.value)} placeholder="예: 매우높음" value={form.workRelevance} /></label>
            <RuleNameField className="lg:col-span-2" disabled={disabled} form={form} update={update} />
            <label className={`${FIELD_CLASS} sm:col-span-2 lg:col-span-3`} htmlFor="direct-rule-value"><span className="font-medium">기준값</span><Input disabled={disabled} id="direct-rule-value" onChange={(event) => update("value", event.currentTarget.value)} placeholder="예: 산업안전기사" value={form.value} /></label>
            <ScoreFields disabled={disabled} form={form} update={update} />
          </>
        ) : form.ruleType === "base" ? (
          <>
            <label className={FIELD_CLASS}><span className="font-medium">언어 구분</span><select className={SELECT_CLASS} disabled={disabled} onChange={(event) => update("languageGroup", event.currentTarget.value === "second_language" ? "second_language" : "english")} value={form.languageGroup}><option value="english">영어</option><option value="second_language">제2외국어</option></select></label>
            <label className={`${FIELD_CLASS} lg:col-span-2`} htmlFor="direct-rule-exam"><span className="font-medium">시험명</span><Input disabled={disabled} id="direct-rule-exam" onChange={(event) => update("examName", event.currentTarget.value)} placeholder="예: OPIc" value={form.examName} /></label>
            <RuleNameField className="lg:col-span-2" disabled={disabled} form={form} update={update} />
            <RuleTypeField disabled={disabled} form={form} update={update} />
            <label className={FIELD_CLASS}><span className="font-medium">판정 필드</span><select className={SELECT_CLASS} disabled={disabled} onChange={(event) => update("field", event.currentTarget.value as FormState["field"])} value={form.field}>{FIELD_OPTIONS.language.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className={FIELD_CLASS}><span className="font-medium">조건</span><select className={SELECT_CLASS} disabled={disabled} onChange={(event) => update("operator", event.currentTarget.value as FormState["operator"])} value={form.operator}><option value="gte">이상 (숫자)</option><option value="contains">포함</option><option value="equals">일치</option></select></label>
            <label className={`${FIELD_CLASS} sm:col-span-2 lg:col-span-2`} htmlFor="direct-rule-value"><span className="font-medium">기준값</span><Input disabled={disabled} id="direct-rule-value" onChange={(event) => update("value", event.currentTarget.value)} placeholder="예: IH 또는 160" value={form.value} /></label>
            <ScoreFields disabled={disabled} form={form} update={update} />
          </>
        ) : (
          <>
            <RuleTypeField className="lg:col-span-1" disabled={disabled} form={form} update={update} />
            <label className={`${FIELD_CLASS} sm:col-span-2 lg:col-span-3`}><span className="font-medium">가산 조건</span><select className={SELECT_CLASS} disabled={disabled} onChange={(event) => update("bonusCondition", event.currentTarget.value === "second_language_new" ? "second_language_new" : "grade_upgrade")} value={form.bonusCondition}><option value="grade_upgrade">전년 동일 언어 등급 상향</option><option value="second_language_new">제2외국어 IM1 이상 신규 취득</option></select></label>
            <RuleNameField className="sm:col-span-2 lg:col-span-2" disabled={disabled} form={form} update={update} />
            <label className={`${FIELD_CLASS} lg:col-span-2`} htmlFor="direct-rule-bonus"><span className="font-medium">가산점</span><Input disabled={disabled} id="direct-rule-bonus" min="0" max="100" onChange={(event) => update("bonus", event.currentTarget.value)} step="0.1" type="number" value={form.bonus} /></label>
          </>
        )}
      </div>

      {error !== null ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="signal-rule-form-actions flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-2">
        <Button disabled={disabled || operatorTasks.length === 0 || onPreview === undefined} onClick={() => { const draft = draftFromForm(); if (draft !== null) setImpact(onPreview?.(draft) ?? null) }} type="button" variant="outline">변경 영향 미리보기</Button>
        <Button disabled={disabled || operatorTasks.length === 0} type="submit"><Plus aria-hidden="true" />{form.ruleId === null ? "환산 규칙 저장" : "수정 저장"}</Button>
      </div>
      {impact === null ? null : <ImpactPreview impact={impact} />}
    </form>
  )
}

type FieldProps = Readonly<{ className?: string; disabled: boolean; form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void }>

function RuleNameField({ className = "", disabled, form, update }: FieldProps) {
  return <label className={`${FIELD_CLASS} ${className}`} htmlFor="direct-rule-name"><span className="font-medium">규칙 이름</span><Input disabled={disabled} id="direct-rule-name" onChange={(event) => update("label", event.currentTarget.value)} placeholder="규칙을 구분할 이름" value={form.label} /></label>
}

function RuleTypeField({ className = "", disabled, form, update }: FieldProps) {
  return <label className={`${FIELD_CLASS} ${className}`}><span className="font-medium">규칙 유형</span><select className={SELECT_CLASS} disabled={disabled} onChange={(event) => update("ruleType", event.currentTarget.value as FormState["ruleType"])} value={form.ruleType}><option value="base">기본 점수</option><option value="bonus">가산점</option></select></label>
}

function ScoreFields({ disabled, form, update }: Omit<FieldProps, "className">) {
  return <><label className={FIELD_CLASS} htmlFor="direct-rule-score"><span className="font-medium">기본 점수</span><Input disabled={disabled || form.kind === "language" && form.ruleType === "bonus"} id="direct-rule-score" min="0" max="110" onChange={(event) => update("score", event.currentTarget.value)} step="0.1" type="number" value={form.score} /></label><label className={FIELD_CLASS} htmlFor="direct-rule-bonus"><span className="font-medium">{form.kind === "certification" ? "신규취득 가산점" : "가산점"}</span><Input disabled={disabled || form.kind === "language" && form.ruleType === "base"} id="direct-rule-bonus" min="0" max="100" onChange={(event) => update("bonus", event.currentTarget.value)} step="0.1" type="number" value={form.bonus} /></label></>
}

function ImpactPreview({ impact }: Readonly<{ impact: DirectScoreRuleImpactViewModel }>) {
  return <section aria-live="polite" className="signal-rule-impact space-y-2 rounded-md border bg-background p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">변경 예상 영향</p><Badge variant={impact.affectedCount === 0 ? "outline" : "secondary"}>{impact.affectedCount}명</Badge></div>{impact.rows.length === 0 ? <p className="text-xs text-muted-foreground">현재 등록된 원천 실적에는 점수 변화가 없습니다.</p> : <div className="max-h-52 overflow-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b"><th className="py-2">엔지니어</th><th className="py-2 text-right">과제 전 → 후</th><th className="py-2 text-right">최종 전 → 후</th></tr></thead><tbody>{impact.rows.map((row) => <tr className="border-b last:border-0" key={row.engineerId}><td className="py-2 font-medium">{row.engineerName}</td><td className="numeric py-2 text-right">{row.currentTaskScore?.toFixed(1) ?? "미확정"} → {row.proposedTaskScore?.toFixed(1) ?? "미확정"}</td><td className="numeric py-2 text-right">{row.currentFinalScore?.toFixed(2) ?? "미확정"} → {row.proposedFinalScore?.toFixed(2) ?? "미확정"}</td></tr>)}</tbody></table></div>}</section>
}
