import "./evaluator-signal.css"
import type { EvaluatorDetailViewModel } from "@/view-models/evaluator-detail"

import { formatCount, formatScore } from "./format"

function signedScore(value: number | null): string {
  if (value === null) return "비교 표본 없음"
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}점`
}

export function EvaluatorProfileSummary({
  model,
}: Readonly<{ model: EvaluatorDetailViewModel }>) {
  const { evaluator, summary } = model
  const completionRate = summary.assignedCount === 0
    ? 0
    : Math.round((summary.submittedCount / summary.assignedCount) * 100)
  const metrics = [
    {
      label: "제출 평가",
      value: formatCount(summary.submittedCount, "건"),
      detail: `배정 ${summary.assignedCount}건 중 ${completionRate}%`,
    },
    {
      label: "평가 대상",
      value: formatCount(summary.uniqueEngineerCount, "명"),
      detail: `점수형 표본 ${summary.scoredCount}건`,
    },
    {
      label: "평균 원점수",
      value: summary.averageScore === null ? "점수 없음" : formatScore(summary.averageScore),
      detail: summary.minimumScore === null || summary.maximumScore === null
        ? "점수 범위 없음"
        : `${summary.minimumScore.toFixed(1)}-${summary.maximumScore.toFixed(1)}점`,
    },
    {
      label: "동료 대비 평균",
      value: signedScore(summary.meanSignedResidual),
      detail: `비교 가능한 평가 ${summary.comparisonCount}건`,
    },
    {
      label: "편차 안정성",
      value: summary.consistency.label,
      detail: summary.residualStandardDeviation === null
        ? "비교 표본 3건부터 판단"
        : `잔차 표준편차 ${summary.residualStandardDeviation.toFixed(1)}점`,
    },
  ]

  return (
    <div className="signal-evaluator-summary">
      <section className="signal-evaluator-identity" aria-labelledby="evaluator-identity-title">
        <p className="signal-evaluator-band">평가자 프로필</p>
        <div className="signal-evaluator-metric-layout">
          <div className="signal-evaluator-person">
            <div className="min-w-0">

              <h2 id="evaluator-identity-title" className="signal-evaluator-person-name">
                {evaluator.displayName}
              </h2>
              <p className="signal-evaluator-person-meta">
                사번 {evaluator.employeeCode} · {evaluator.team} / {evaluator.department}
              </p>
            </div>
            <div className="signal-evaluator-cycle">
              <p className="sr-only">평가 시즌</p>
              <p className="signal-evaluator-cycle-name">{model.cycleName}</p>
            </div>
          </div>
          <dl className="signal-evaluator-metrics">
            {metrics.map((metric) => (
              <div
                className="signal-evaluator-metric"
                key={metric.label}
              >
                <dt>{metric.label}</dt>
                <dd className={`numeric ${metric.value.length > 7 ? "signal-evaluator-value-text" : ""}`}>{metric.value}</dd>
                <p>{metric.detail}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="signal-evaluator-characteristics" aria-labelledby="evaluator-characteristics-title">
        <header className="signal-evaluator-band">
          <h2 id="evaluator-characteristics-title" className="signal-evaluator-characteristics-title">
            평가 성향 요약
          </h2>
          <p className="signal-evaluator-characteristics-note">
            제출 기록에서 확인되는 반복 경향만 정리하며 평가자 등급을 자동으로 매기지 않습니다.
          </p>
        </header>
        <ol className="signal-evaluator-characteristic-list">
          {model.characteristics.map((characteristic, index) => (
            <li className="signal-evaluator-characteristic" key={characteristic}>
              <span aria-hidden className="signal-evaluator-characteristic-number numeric">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{characteristic}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
