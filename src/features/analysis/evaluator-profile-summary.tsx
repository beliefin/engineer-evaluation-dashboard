import { cn } from "@/lib/utils"
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
    <div className="space-y-6">
      <section className="rounded-md border border-border bg-card" aria-labelledby="evaluator-identity-title">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">평가자 프로필</p>
            <h2 id="evaluator-identity-title" className="mt-1 text-xl font-semibold tracking-tight">
              {evaluator.displayName}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              사번 {evaluator.employeeCode} · {evaluator.team} / {evaluator.department}
            </p>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-xs font-medium text-muted-foreground">평가 시즌</p>
            <p className="mt-1 text-sm font-semibold">{model.cycleName}</p>
          </div>
        </div>
        <dl className="grid border-t border-border-subtle sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric, index) => (
            <div
              className={cn(
                "px-5 py-4",
                index > 0 && "border-t border-border-subtle sm:border-l sm:border-t-0",
                index === 2 && "sm:border-t xl:border-t-0",
                index === 4 && "sm:border-t xl:border-t-0",
              )}
              key={metric.label}
            >
              <dt className="text-xs font-medium text-muted-foreground">{metric.label}</dt>
              <dd className="numeric mt-2 text-lg font-semibold text-foreground">{metric.value}</dd>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-md border border-border bg-card" aria-labelledby="evaluator-characteristics-title">
        <header className="border-b border-border-subtle px-5 py-4">
          <h2 id="evaluator-characteristics-title" className="text-base font-semibold tracking-tight">
            평가 성향 요약
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            제출 기록에서 확인되는 반복 경향만 정리하며 평가자 등급을 자동으로 매기지 않습니다.
          </p>
        </header>
        <ol className="grid gap-px bg-border-subtle lg:grid-cols-2">
          {model.characteristics.map((characteristic, index) => (
            <li className="flex gap-3 bg-card px-5 py-4 text-sm leading-6" key={characteristic}>
              <span aria-hidden className="numeric shrink-0 font-semibold text-primary">
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
