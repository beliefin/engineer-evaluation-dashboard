"use client"

import type { FormEvent } from "react"
import { CheckIcon, GaugeIcon, LockKeyholeIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { EvaluationStatusBadge } from "./evaluation-status-badge"
import { ParallelScoreItemRow } from "./parallel-score-item-row"
import { ScoreFormActions } from "./score-form-actions"
import { ScoreTsvInput } from "./score-tsv-input"
import type { EvaluationScoreFormProps, EvaluationScoreFormViewModel } from "./types"
import { UnlockRequestDialog } from "./unlock-request-dialog"

interface ParallelEvaluationScoreFormProps {
  readonly left: EvaluationScoreFormProps
  readonly right: EvaluationScoreFormProps
}

interface ScoreState {
  readonly answeredCount: number
  readonly remainingCount: number
  readonly normalized: number
  readonly canSubmit: boolean
}

function isValidScore(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 0 && value <= 10
}

function getScoreState(viewModel: EvaluationScoreFormViewModel): ScoreState {
  const validScores = viewModel.items.filter((item) => isValidScore(item.value))
  const total = validScores.reduce((sum, item) => sum + (item.value ?? 0), 0)
  const normalized = viewModel.items.length === 0 ? 0 : (total / (viewModel.items.length * 10)) * 100
  const canSubmit = !viewModel.locked && (
    viewModel.method === "evaluator_score"
      ? viewModel.items.length > 0 && validScores.length === viewModel.items.length
      : viewModel.passResult !== null
  )
  return {
    answeredCount: validScores.length,
    remainingCount: Math.max(0, viewModel.items.length - validScores.length),
    normalized,
    canSubmit,
  }
}

function PresenterHeader({ form }: Readonly<{ form: EvaluationScoreFormProps }>) {
  const state = getScoreState(form.viewModel)
  const status = form.viewModel.submitted
    ? "submitted"
    : state.answeredCount === 0 ? "pending" : "in_progress"

  return (
    <div role="columnheader" className="min-w-0 border-l border-border-subtle px-1.5 py-3 text-center sm:px-3">
      <p className="line-clamp-3 break-keep text-[11px] font-semibold leading-4 sm:text-sm" title={form.viewModel.engineerName}>
        {form.viewModel.engineerName}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{form.viewModel.teamName}</p>
      <div className="mt-2 flex justify-center"><EvaluationStatusBadge status={status} /></div>
      {form.viewModel.method === "evaluator_score" ? (
        <p className="numeric mt-2 text-xs font-semibold text-primary sm:text-sm">
          {state.normalized.toFixed(1)}점
          <span className="ml-1 block font-normal text-muted-foreground sm:inline">
            {state.remainingCount === 0 ? "완료" : `${state.remainingCount}개 남음`}
          </span>
        </p>
      ) : null}
    </div>
  )
}

function PassFailCell({ form }: Readonly<{ form: EvaluationScoreFormProps }>) {
  const model = form.viewModel
  return (
    <div role="cell" className="grid gap-2 border-l border-border-subtle px-1.5 py-3 sm:px-3">
      <Button
        aria-label={`${model.engineerName} Pass`}
        aria-pressed={model.passResult === true}
        disabled={model.locked}
        onClick={() => form.onPassResultChange(true)}
        size="sm"
        type="button"
        variant={model.passResult === true ? "default" : "outline"}
      ><CheckIcon aria-hidden="true" />Pass</Button>
      <Button
        aria-label={`${model.engineerName} Fail`}
        aria-pressed={model.passResult === false}
        disabled={model.locked}
        onClick={() => form.onPassResultChange(false)}
        size="sm"
        type="button"
        variant={model.passResult === false ? "destructive" : "outline"}
      ><XIcon aria-hidden="true" />Fail</Button>
    </div>
  )
}

function PresenterActions({ form }: Readonly<{ form: EvaluationScoreFormProps }>) {
  const state = getScoreState(form.viewModel)
  const requirementsId = `parallel-requirements-${form.viewModel.assignmentId}`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.canSubmit) form.onSubmit()
  }

  return (
    <form className="min-w-0 border-l border-border-subtle" onSubmit={handleSubmit}>
      <div className="px-3 pt-3 sm:px-4">
        <p className="truncate text-sm font-semibold">{form.viewModel.engineerName}</p>
        <p id={requirementsId} className="mt-1 text-xs leading-5 text-muted-foreground">
          {form.viewModel.locked
            ? "제출 완료 · 잠금 상태"
            : state.remainingCount === 0 ? "입력 완료 · 제출 가능" : `${state.remainingCount}개 항목 입력 필요`}
        </p>
        {form.viewModel.locked ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-success">
            <LockKeyholeIcon className="size-3.5" aria-hidden="true" />
            <UnlockRequestDialog
              onRequest={form.onRequestUnlock}
              pending={form.viewModel.unlockRequestPending}
            />
          </div>
        ) : null}
      </div>
      <ScoreFormActions
        autosaveStatus={form.viewModel.autosaveStatus}
        canSubmit={state.canSubmit}
        embedded
        lastSavedAtLabel={form.viewModel.lastSavedAtLabel}
        locked={form.viewModel.locked}
        onSave={form.onSave}
        requirementsId={requirementsId}
      />
    </form>
  )
}

export function ParallelEvaluationScoreForm({ left, right }: ParallelEvaluationScoreFormProps) {
  const model = left.viewModel
  const scoreMethod = model.method === "evaluator_score" && right.viewModel.method === "evaluator_score"
  const benchmark = model.benchmark

  return (
    <section className="overflow-hidden rounded-md border border-border bg-card" aria-labelledby="parallel-score-title">
      <header className="border-b border-border-subtle px-4 py-5">
        <p className="text-xs font-semibold text-primary">{model.cycleLabel}</p>
        <h2 id="parallel-score-title" className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          {model.categoryLabel} · 동시 평가
        </h2>
        {model.description.length === 0 ? null : (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{model.description}</p>
        )}
        {scoreMethod ? (
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <GaugeIcon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {benchmark == null
              ? "같은 과제의 확정된 직전 발표 기준점이 아직 없습니다."
              : `직전 ${benchmark.sampleSize}명 공식 평균 ${benchmark.averageScore.toFixed(1)}점 · ${benchmark.minScore.toFixed(1)}~${benchmark.maxScore.toFixed(1)}점`}
          </p>
        ) : null}
      </header>

      {scoreMethod ? (
        <details className="border-b border-border-subtle bg-muted/20">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            TSV 점수 일괄 입력
          </summary>
          <div className="grid grid-cols-1 border-t border-border-subtle sm:grid-cols-2">
            <ScoreTsvInput idPrefix={model.assignmentId} itemCount={model.items.length} label={`${model.engineerName} TSV 점수`} locked={model.locked} onApply={left.onScoresChange} />
            <ScoreTsvInput idPrefix={right.viewModel.assignmentId} itemCount={right.viewModel.items.length} label={`${right.viewModel.engineerName} TSV 점수`} locked={right.viewModel.locked} onApply={right.onScoresChange} />
          </div>
        </details>
      ) : null}

      <div role="table" aria-label="두 발표자 평가 점수 입력" aria-colcount={3}>
        <div role="row" className="grid grid-cols-[minmax(0,1fr)_72px_72px] bg-muted/35 sm:grid-cols-[minmax(0,1fr)_112px_112px]">
          <div role="columnheader" className="px-3 py-3 text-xs font-semibold text-muted-foreground sm:px-4">평가항목</div>
          <PresenterHeader form={left} />
          <PresenterHeader form={right} />
        </div>
        {scoreMethod ? model.items.map((item) => (
          <ParallelScoreItemRow key={item.id} item={item} left={model} right={right.viewModel} onLeftChange={left.onScoreChange} onRightChange={right.onScoreChange} />
        )) : (
          <div role="row" className="grid grid-cols-[minmax(0,1fr)_72px_72px] sm:grid-cols-[minmax(0,1fr)_112px_112px]">
            <div role="cell" className="px-3 py-6 text-sm font-semibold sm:px-4">평가 결과</div>
            <PassFailCell form={left} />
            <PassFailCell form={right} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-20 grid grid-cols-2 border-t border-border bg-card shadow-[0_-6px_16px_rgba(17,24,32,0.06)]">
        <PresenterActions form={left} />
        <PresenterActions form={right} />
      </div>
    </section>
  )
}
