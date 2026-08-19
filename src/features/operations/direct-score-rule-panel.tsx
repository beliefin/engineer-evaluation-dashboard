"use client"

import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { DirectScoreRuleForm } from "./direct-score-rule-form"
import { OperationPanel } from "./operation-panel"
import type {
  DirectScoreRuleDraft,
  DirectScoreRuleImpactViewModel,
  DirectScoreRuleViewModel,
} from "./types"

type Props = Readonly<{
  rules: readonly DirectScoreRuleViewModel[]
  operatorTasks: readonly Readonly<{ taskId: string; taskName: string }>[]
  disabled: boolean
  onSave?: ((rule: DirectScoreRuleDraft) => boolean) | undefined
  onDelete?: ((ruleId: string) => boolean) | undefined
  onPreview?: ((rule: DirectScoreRuleDraft) => DirectScoreRuleImpactViewModel) | undefined
}>

function formatRule(rule: DirectScoreRuleViewModel): string {
  const operator = rule.operator === "gte" ? "이상" : rule.operator === "contains" ? "포함" : "일치"
  const outcome = rule.ruleType === "base"
    ? `기본 ${rule.rawScore ?? rule.score}점${rule.rawScore !== undefined && rule.rawScore !== null && rule.rawScore !== rule.score ? ` · 시스템 반영 ${rule.score}점` : ""}`
    : `가산 +${rule.bonus}점`
  return `${rule.label} · ${rule.value} ${operator} · ${outcome}`
}

export function DirectScoreRulePanel({ rules, operatorTasks, disabled, onSave, onDelete, onPreview }: Props) {
  const [editingRule, setEditingRule] = useState<DirectScoreRuleDraft | undefined>(undefined)
  const [editRevision, setEditRevision] = useState(0)

  function edit(rule: DirectScoreRuleViewModel) {
    setEditingRule({
      ruleId: rule.id,
      taskId: rule.taskId,
      kind: rule.kind,
      label: rule.label,
      field: rule.field,
      operator: rule.operator,
      value: rule.value,
      ruleType: rule.ruleType,
      score: rule.score,
      ...(rule.rawScore === undefined || rule.rawScore === null ? {} : { rawScore: rule.rawScore }),
      bonus: rule.bonus,
      enabled: rule.enabled,
      ...(rule.category === undefined ? {} : { category: rule.category }),
      ...(rule.difficulty === undefined ? {} : { difficulty: rule.difficulty }),
      ...(rule.workRelevance === undefined ? {} : { workRelevance: rule.workRelevance }),
      ...(rule.languageGroup === undefined ? {} : { languageGroup: rule.languageGroup }),
      ...(rule.examName === undefined ? {} : { examName: rule.examName }),
      ...(rule.bonusCondition === undefined ? {} : { bonusCondition: rule.bonusCondition }),
    })
    setEditRevision((current) => current + 1)
  }

  return (
    <OperationPanel
      description="시즌별 자격증 기본점수·신규 취득 가산점·어학 환산 기준 추가·수정·삭제"
      title="자격·어학 평가표"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <DirectScoreRuleForm
          disabled={disabled}
          initialRule={editingRule}
          key={`${editingRule?.ruleId ?? "new-rule"}-${editRevision}`}
          onPreview={onPreview}
          onReset={() => setEditingRule(undefined)}
          onSave={onSave}
          operatorTasks={operatorTasks}
        />

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
