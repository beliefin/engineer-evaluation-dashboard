"use client"

import { Fragment, useState } from "react"
import type { FormEvent } from "react"
import { ChevronDownIcon, InfoIcon, LockKeyholeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScoreFormActions } from "./score-form-actions"
import { ScoreInputField } from "./score-input-field"
import { ScoreTsvInput } from "./score-tsv-input"
import { UnlockRequestDialog } from "./unlock-request-dialog"
import type { EvaluationScoreFormProps } from "./types"
import "./evaluation-entry-signal.css"
import "./operator-entry-signal.css"

export function SignalEvaluationForm({ viewModel, onScoreChange, onScoresChange, onPassResultChange, onSave, onSubmit, onRequestUnlock }: EvaluationScoreFormProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<ReadonlySet<string>>(() => new Set())
  const criteriaKey = (itemId: string) => `${viewModel.assignmentId}:${itemId}`
  function toggleCriteria(itemId: string) {
    const key = criteriaKey(itemId)
    setExpandedCriteria((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const inputLocked = viewModel.locked
  const validItems = viewModel.items.filter((item) => item.value !== null && Number.isInteger(item.value) && item.value >= 0 && item.value <= 10)
  const answeredCount = validItems.length
  const remainingCount = Math.max(0, viewModel.items.length - answeredCount)
  const total = validItems.reduce((sum, item) => sum + (item.value ?? 0), 0)
  const normalized = viewModel.items.length === 0 ? 0 : total / (viewModel.items.length * 10) * 100
  const canSubmit = !inputLocked && (viewModel.method === "evaluator_score" ? viewModel.items.length > 0 && answeredCount === viewModel.items.length : viewModel.passResult !== null)
  const requirementsId = `score-submit-requirements-${viewModel.assignmentId}`
  const titleId = `evaluation-score-form-title-${viewModel.assignmentId}`
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (canSubmit) onSubmit() }
  const actions = <ScoreFormActions autosaveStatus={viewModel.autosaveStatus} lastSavedAtLabel={viewModel.lastSavedAtLabel} locked={inputLocked} canSubmit={canSubmit} requirementsId={requirementsId} onSave={onSave} operatorMode={viewModel.proxyEntry} embedded={viewModel.proxyEntry} />
  const tsv = <ScoreTsvInput itemCount={viewModel.items.length} key={`tsv-${viewModel.assignmentId}`} locked={viewModel.locked} onApply={onScoresChange} />
  const tools = viewModel.method === "evaluator_score" ? <div className="signal-evaluation-tools"><details open={viewModel.proxyEntry ? true : undefined}><summary>직전 발표 평가 기준점</summary><p>{viewModel.benchmark == null ? "같은 과제에서 확정된 직전 발표 점수가 아직 없습니다." : `최근 ${viewModel.benchmark.sampleSize}명 공식 평균 ${viewModel.benchmark.averageScore.toFixed(1)}점 · 범위 ${viewModel.benchmark.minScore.toFixed(1)}~${viewModel.benchmark.maxScore.toFixed(1)}점`}</p><p>평가 눈높이를 맞추기 위한 익명 참고값이며, 발표자별 점수와 평가자 가중치는 표시하지 않습니다.</p></details>{viewModel.proxyEntry ? <details className="signal-proxy-tsv"><summary>TSV 점수 일괄 입력</summary>{tsv}</details> : tsv}</div> : null

  return <form className={`signal-evaluation${viewModel.proxyEntry ? " signal-proxy-entry" : ""}`} aria-labelledby={titleId} noValidate onSubmit={submit}>
    <header className="signal-evaluation-header">
      <div>{viewModel.proxyEntry ? <><h2 id={titleId}>{viewModel.engineerName} · {viewModel.categoryLabel}</h2>{viewModel.submitted ? <span className="signal-proxy-submitted">제출 완료</span> : null}<p>{viewModel.description}</p></> : <><h1 id={titleId}>평가 점수 입력</h1><h2>{viewModel.engineerName} · {viewModel.categoryLabel}</h2></>}<p>{viewModel.teamName} · {viewModel.cycleLabel}</p><p className="signal-evaluator-identity">평가자 · {viewModel.evaluatorName}</p></div>
      {viewModel.method === "evaluator_score" && <dl className="signal-score-summary" aria-label="평가 진행"><div><dt>총점</dt><dd><strong className="numeric">{normalized.toFixed(1)}</strong><span>/ 100</span></dd></div><div><dt>입력</dt><dd><strong className="numeric">{answeredCount}</strong><span>/ {viewModel.items.length}</span></dd></div><div><dt>남은 항목</dt><dd className="numeric"><strong>{remainingCount}</strong></dd></div></dl>}
      {viewModel.proxyEntry ? <div className="signal-proxy-header-actions">{actions}</div> : null}
    </header>
    {viewModel.method === "evaluator_score" && <div className="signal-entry-progress" role="progressbar" aria-label="평가 항목 입력 진행률" aria-valuemin={0} aria-valuemax={viewModel.items.length} aria-valuenow={answeredCount} aria-valuetext={`${answeredCount}/${viewModel.items.length}개 입력`}><span style={{ width: `${viewModel.items.length === 0 ? 0 : answeredCount / viewModel.items.length * 100}%` }} /></div>}
    <p id={requirementsId} className="sr-only">{viewModel.proxyEntry ? `${viewModel.items.length}개 항목을 모두 입력하면 평가를 저장할 수 있습니다. 저장 후에도 계속 수정할 수 있습니다.` : `${viewModel.items.length}개 항목을 모두 입력해야 제출할 수 있습니다. 제출 후에는 운영자 승인 없이 수정할 수 없습니다.`}</p>
    <span className="sr-only">{remainingCount}개 남음</span>
    {viewModel.proxyEntry && <aside className="signal-proxy-notice"><strong>운영자 대리 입력 · {viewModel.evaluatorName}</strong><span>선택 평가자 명의의 점수 대리 입력. 운영자 입력은 저장 후에도 수정 가능</span></aside>}
    {viewModel.locked && <aside className="signal-locked-notice" role="status"><div><strong>제출 완료되어 잠겼습니다</strong><p>{viewModel.submittedAtLabel === null ? "현재 버전에서는 제출 후 수정할 수 없습니다." : `${viewModel.submittedAtLabel} 제출 · 수정이 필요하면 운영자에게 잠금 해제를 요청하세요.`}</p></div><UnlockRequestDialog onRequest={onRequestUnlock} pending={viewModel.unlockRequestPending} /></aside>}
    {viewModel.proxyEntry ? tools : null}
    {viewModel.method === "evaluator_score" ? <>
      <div className="signal-score-table-scroll"><table className="signal-score-table"><caption className="sr-only">평가 점수 입력 항목</caption><colgroup><col className="signal-col-section" /><col className="signal-col-number" /><col /><col className="signal-col-score" /></colgroup><thead><tr><th>평가 영역</th><th>No.</th><th>평가 항목</th><th>점수 ( / 10 )</th></tr></thead><tbody>{viewModel.items.map((item, index) => {
        const sectionStart = index === 0 || viewModel.items[index - 1]?.section !== item.section
        const expanded = expandedCriteria.has(criteriaKey(item.id)) && item.criteria.length > 0
        const criteriaId = `criteria-${viewModel.assignmentId}-${item.id}`
        let rowSpan = 1
        if (sectionStart) {
          let sectionLength = 1
          while (index + sectionLength < viewModel.items.length && viewModel.items[index + sectionLength]?.section === item.section) sectionLength += 1
          rowSpan = sectionLength + viewModel.items.slice(index, index + sectionLength).filter((candidate) => candidate.criteria.length > 0 && expandedCriteria.has(criteriaKey(candidate.id))).length
        }
        return <Fragment key={`${viewModel.assignmentId}:${item.id}`}>
          <tr className={sectionStart && index > 0 ? "signal-group-start" : ""}>
            {sectionStart && <th className="signal-score-section" scope="rowgroup" rowSpan={rowSpan}>{item.section ?? "평가"}</th>}
            <td className="signal-score-number numeric">{item.index}</td>
            <th className="signal-score-label" scope="row"><div><label htmlFor={`score-${viewModel.assignmentId}-${item.id}`}>{item.label}</label>{item.criteria.length === 0 ? null : <button aria-controls={criteriaId} aria-expanded={expanded} aria-label={`${item.label} 세부 평가기준 보기`} className="signal-item-criteria-toggle" onClick={() => toggleCriteria(item.id)} type="button">세부 평가기준 보기<ChevronDownIcon aria-hidden="true" /></button>}</div></th>
            <td className="signal-score-cell"><ScoreInputField assignmentId={viewModel.assignmentId} itemId={item.id} label={`${item.label} 점수`} locked={viewModel.locked} onChange={(value) => onScoreChange(item.id, value)} value={item.value} /></td>
          </tr>
          {expanded ? <tr className="signal-item-criteria-row"><td colSpan={3}><section aria-label={`${item.label} 세부 평가기준`} className="signal-item-criteria-content" id={criteriaId}><p>기준을 참고해 0점부터 10점까지 정수로 입력합니다.</p><dl>{item.criteria.map((criterion) => <div key={criterion.score}><dt>{criterion.score}점</dt><dd>{criterion.description}</dd></div>)}</dl></section></td></tr> : null}
        </Fragment>
      })}</tbody></table></div>
      <div className="signal-rubric-guidance"><p>{viewModel.description}</p><p>각 항목은 0점부터 10점까지 정수로 입력합니다. 다른 평가자의 점수·가중치는 비공개입니다.</p></div>
    </> : <section className="signal-pass-fail"><h2>평가 결과 선택</h2><p>{viewModel.proxyEntry ? "Pass 또는 Fail 중 하나를 선택하면 평가를 저장할 수 있으며, 저장 후에도 계속 수정할 수 있습니다." : "Pass 또는 Fail 중 하나를 선택해야 제출할 수 있습니다."}</p><div><Button aria-pressed={viewModel.passResult === true} disabled={inputLocked} onClick={() => onPassResultChange(true)} type="button" variant={viewModel.passResult === true ? "default" : "outline"}>Pass</Button><Button aria-pressed={viewModel.passResult === false} disabled={inputLocked} onClick={() => onPassResultChange(false)} type="button" variant={viewModel.passResult === false ? "destructive" : "outline"}>Fail</Button></div></section>}
    <div className="signal-form-bottom"><p><InfoIcon aria-hidden="true" />점수 변경 시 자동 임시저장.</p>{viewModel.proxyEntry ? null : actions}<p><LockKeyholeIcon aria-hidden="true" />{viewModel.proxyEntry ? "저장 후 계속 수정 가능." : "제출 후 수정 잠금."}</p></div>
    {viewModel.proxyEntry ? null : tools}
  </form>
}
