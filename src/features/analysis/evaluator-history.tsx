import type { EvaluatorRecentEvaluation } from "@/view-models/evaluator-detail"

import { AnalysisPanel } from "./analysis-panel"

function signed(value: number | null): string {
  if (value === null) return "비교 표본 없음"
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}점`
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "제출 시각 없음"
    : new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
}

export function EvaluatorHistory({
  data,
}: Readonly<{ data: readonly EvaluatorRecentEvaluation[] }>) {
  return (
    <AnalysisPanel
      title="최근 평가 이력"
      description="제출한 평가의 원점수와 같은 대상에 대한 동료 평균 차이를 최신순으로 확인합니다."
      isEmpty={data.length === 0}
    >
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">평가자 최근 제출 평가 이력</caption>
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs text-muted-foreground">
              <th className="px-3 py-3 font-medium">평가 대상</th>
              <th className="px-3 py-3 font-medium">과제</th>
              <th className="px-3 py-3 text-right font-medium">원점수</th>
              <th className="px-3 py-3 text-right font-medium">동료 평균</th>
              <th className="px-3 py-3 text-right font-medium">차이</th>
              <th className="px-3 py-3 font-medium">제출 시각</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((row) => (
              <tr className="border-b border-border-subtle last:border-b-0" key={row.assignmentId}>
                <td className="px-3 py-3">
                  <span className="font-medium">{row.engineerLabel}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{row.teamLabel}</span>
                </td>
                <td className="px-3 py-3">{row.taskLabel}</td>
                <td className="numeric px-3 py-3 text-right font-semibold">{row.score.toFixed(1)}</td>
                <td className="numeric px-3 py-3 text-right">{row.peerAverage?.toFixed(1) ?? "-"}</td>
                <td className="numeric px-3 py-3 text-right">
                  <span className={row.isOutlier ? "font-semibold text-destructive" : undefined}>
                    {signed(row.residual)}
                  </span>
                  {row.isOutlier ? <span className="mt-1 block text-xs text-destructive">10점 이상 이탈</span> : null}
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{formatDate(row.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="divide-y divide-border-subtle md:hidden">
        {data.slice(0, 20).map((row) => (
          <li className="py-4 first:pt-0 last:pb-0" key={row.assignmentId}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{row.engineerLabel} · {row.taskLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">{row.teamLabel} · {formatDate(row.submittedAt)}</p>
              </div>
              <p className="numeric shrink-0 text-base font-semibold">{row.score.toFixed(1)}점</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              동료 평균 {row.peerAverage?.toFixed(1) ?? "-"}점 · 차이 {signed(row.residual)}
            </p>
            {row.isOutlier ? <p className="mt-1 text-xs font-semibold text-destructive">10점 이상 이탈, 확인 필요</p> : null}
          </li>
        ))}
      </ol>
    </AnalysisPanel>
  )
}
