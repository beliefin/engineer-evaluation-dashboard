"use client"

import type { FormEvent } from "react"
import { CheckIcon, InfoIcon, LockKeyholeIcon, UserRoundCogIcon, XIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { EvaluationStatusBadge } from "./evaluation-status-badge"
import { ScoreFormActions } from "./score-form-actions"
import { ScoreInputRow } from "./score-input-row"
import { ScoreSummary } from "./score-summary"
import type { EvaluationScoreFormProps } from "./types"

function isValidScore(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 0 && value <= 10
}

export function EvaluationScoreForm({
  viewModel,
  onScoreChange,
  onPassResultChange,
  onSave,
  onSubmit,
}: EvaluationScoreFormProps) {
  const validScores = viewModel.items.filter((item) => isValidScore(item.value))
  const answeredCount = validScores.length
  const remainingCount = Math.max(0, viewModel.items.length - answeredCount)
  const total = validScores.reduce((sum, item) => sum + (item.value ?? 0), 0)
  const canSubmit =
    !viewModel.locked && (viewModel.method === "evaluator_score"
      ? viewModel.items.length > 0 && answeredCount === viewModel.items.length
      : viewModel.passResult !== null)
  const titleId = `evaluation-score-form-title-${viewModel.assignmentId}`
  const requirementsId = `score-submit-requirements-${viewModel.assignmentId}`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSubmit) onSubmit()
  }

  return (
    <form
      aria-labelledby={titleId}
      noValidate
      onSubmit={handleSubmit}
      className="pb-28 md:pb-0"
    >
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <header className="grid gap-5 border-b border-border-subtle px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-primary">{viewModel.cycleLabel}</p>
              <EvaluationStatusBadge
                status={viewModel.locked ? "submitted" : answeredCount === 0 ? "pending" : "in_progress"}
              />
            </div>
            <h1
              id={titleId}
              className="mt-2 text-2xl font-bold tracking-tight md:text-[26px]"
            >
              {viewModel.engineerName} · {viewModel.categoryLabel}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{viewModel.teamName}</p>
            {viewModel.description.length > 0 ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{viewModel.description}</p> : null}
          </div>

          <ScoreFormActions
            autosaveStatus={viewModel.autosaveStatus}
            lastSavedAtLabel={viewModel.lastSavedAtLabel}
            locked={viewModel.locked}
            canSubmit={canSubmit}
            requirementsId={requirementsId}
            onSave={onSave}
          />
        </header>

        {viewModel.proxyEntry ? (
          <div className="border-b border-border-subtle px-4 py-4 md:px-5">
            <Alert className="border-primary/20 bg-primary/5 text-primary">
              <UserRoundCogIcon aria-hidden="true" />
              <AlertTitle>운영자 대리 입력 · {viewModel.evaluatorName}</AlertTitle>
              <AlertDescription className="text-primary/90">
                이 평가자의 평가지에 대신 점수를 입력합니다. 평가자 가중치와 다른 평가자 점수는 표시하지 않습니다.
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        {viewModel.locked ? (
          <div className="border-b border-border-subtle px-4 py-4 md:px-5">
            <Alert className="border-success/25 bg-success-soft text-success">
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>제출 완료되어 잠겼습니다</AlertTitle>
              <AlertDescription className="text-success/90">
                {viewModel.submittedAtLabel === null
                  ? "현재 버전에서는 제출 후 수정할 수 없습니다."
                  : `${viewModel.submittedAtLabel} 제출 · 현재 버전에서는 제출 후 수정할 수 없습니다.`}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="border-b border-border-subtle px-4 py-3 md:px-5">
            <p className="flex items-start gap-2 text-pretty text-xs leading-relaxed text-muted-foreground">
              <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              점수 변경은 자동 임시저장됩니다. 다른 평가자의 점수·가중치는 표시하지 않습니다.
            </p>
          </div>
        )}

        {viewModel.method === "evaluator_score" ? (
          <>
            <ScoreSummary total={total} answeredCount={answeredCount} remainingCount={remainingCount} requirementsId={requirementsId} totalItems={viewModel.items.length} />
            <div aria-label="평가 점수 입력 항목">{viewModel.items.map((item) => <ScoreInputRow key={item.id} assignmentId={viewModel.assignmentId} item={item} locked={viewModel.locked} onChange={(value) => onScoreChange(item.id, value)} />)}</div>
          </>
        ) : (
          <section className="border-b border-border-subtle bg-muted/25 px-4 py-8 md:px-5" aria-labelledby="pass-fail-title">
            <div className="mx-auto max-w-xl text-center"><h2 className="text-lg font-semibold" id="pass-fail-title">평가 결과 선택</h2><p className="mt-1 text-sm text-muted-foreground" id={requirementsId}>Pass 또는 Fail 중 하나를 선택해야 제출할 수 있습니다.</p><div className="mt-6 grid grid-cols-2 gap-3"><Button aria-pressed={viewModel.passResult === true} className="h-16 text-base" disabled={viewModel.locked} onClick={() => onPassResultChange(true)} type="button" variant={viewModel.passResult === true ? "default" : "outline"}><CheckIcon aria-hidden="true" />Pass</Button><Button aria-pressed={viewModel.passResult === false} className="h-16 text-base" disabled={viewModel.locked} onClick={() => onPassResultChange(false)} type="button" variant={viewModel.passResult === false ? "destructive" : "outline"}><XIcon aria-hidden="true" />Fail</Button></div></div>
          </section>
        )}
      </section>
    </form>
  )
}
