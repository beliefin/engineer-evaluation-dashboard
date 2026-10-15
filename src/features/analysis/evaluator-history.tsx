import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import type { EvaluatorRecentEvaluation } from "@/view-models/evaluator-detail"

import { AnalysisPanel } from "./analysis-panel"
import "./evaluator-charts-signal.css"

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
    <div className="signal-evaluator-scene signal-evaluator-history-scene">
      <AnalysisPanel
        title="최근 평가 이력"
        description="제출 원점수와 동일 대상 동료 평균의 차이, 최신순 확인"
        isEmpty={data.length === 0}
      >
        <p className="signal-evaluator-table-band" aria-hidden="true">최근 평가 이력</p>
        <HorizontalScroll
          className="signal-evaluator-table-scroll signal-evaluator-history-scroll"
          role="region"
          aria-label="최근 평가 이력 상세 표, 가로 및 세로 스크롤"
          tabIndex={0}
        >
          <table className="signal-evaluator-evidence-table signal-evaluator-history-table">
            <caption className="sr-only">평가자 최근 제출 평가 이력</caption>
            <thead>
              <tr>
                <th scope="col">평가 대상</th>
                <th scope="col">과제</th>
                <th scope="col">원점수</th>
                <th scope="col">동료 평균</th>
                <th scope="col">차이</th>
                <th scope="col">제출 시각</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 20).map((row) => (
                <tr key={row.assignmentId}>
                  <th scope="row">
                    <span>{row.engineerLabel}</span>{" "}
                    <span className="signal-evaluator-history-team">({row.teamLabel})</span>
                  </th>
                  <td className="signal-evaluator-history-task">{row.taskLabel}</td>
                  <td className="numeric">{row.score.toFixed(1)}</td>
                  <td className="numeric">{row.peerAverage?.toFixed(1) ?? "-"}</td>
                  <td className="numeric">
                    <span className={row.isOutlier ? "signal-evaluator-history-outlier" : undefined}>
                      {signed(row.residual)}
                    </span>
                    {row.isOutlier ? <span className="signal-evaluator-history-outlier-note">10점 이상 이탈</span> : null}
                  </td>
                  <td className="signal-evaluator-history-date">{formatDate(row.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HorizontalScroll>
      </AnalysisPanel>
    </div>
  )
}
