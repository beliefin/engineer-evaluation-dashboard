"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import type { EvaluatorTaskTendency } from "@/view-models/evaluator-detail"

import { AnalysisPanel } from "./analysis-panel"
import { formatCount, formatScore } from "./format"
import "./evaluator-charts-signal.css"

const scoreTicks = [0, 20, 40, 60, 80, 100] as const

type ComparisonRow = Readonly<{
  id: string
  label: string
  evaluator: number
  peer: number | null
}>

function signed(value: number | null): string {
  if (value === null) return "-"
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`
}

/** Both the bars and the ticks use the same, unpadded 0–100 plot coordinates. */
export function EvaluatorComparisonChart({
  rows,
  label,
  peerLabel,
  variant,
}: Readonly<{
  rows: readonly ComparisonRow[]
  label: string
  peerLabel: string
  variant: "task" | "item"
}>) {
  return (
    <>
      <div className="signal-evaluator-chart-legend">
        <span><i aria-hidden="true" className="signal-evaluator-legend-primary" />평가자 평균</span>
        <span><i aria-hidden="true" className="signal-evaluator-legend-peer" />{peerLabel}</span>
      </div>
      <HorizontalScroll
        className="signal-evaluator-chart-scroll"
        role="region"
        aria-label={`${label}, 가로 스크롤`}
        tabIndex={0}
      >
        <div
          className={`signal-evaluator-comparison signal-evaluator-comparison-${variant}`}
          role="img"
          aria-label={`${label}. 0점부터 100점까지, 상세 수치는 아래 표에서 확인할 수 있습니다.`}
        >
          <div className="signal-evaluator-chart-grid" aria-hidden="true">
            {scoreTicks.map((tick) => (
              <span key={tick} className="signal-evaluator-chart-gridline" style={{ left: `${tick}%` }} />
            ))}
          </div>
          <div className="signal-evaluator-chart-axis" aria-hidden="true">
            {scoreTicks.map((tick) => (
              <span key={tick} className="signal-evaluator-chart-tick numeric" style={{ left: `${tick}%` }}>
                {tick}
              </span>
            ))}
          </div>
          <div className="signal-evaluator-chart-rows" aria-hidden="true">
            {rows.map((row) => (
              <div className="signal-evaluator-chart-row" key={row.id} data-comparison-id={row.id}>
                <span className="signal-evaluator-chart-category">{row.label}</span>
                <div className="signal-evaluator-chart-pair">
                  <div className="signal-evaluator-chart-series" data-series="evaluator">
                    <span className="signal-evaluator-chart-bar signal-evaluator-chart-bar-primary" style={{ width: `${row.evaluator}%` }} />
                    <span className="signal-evaluator-chart-value numeric" style={{ left: `${row.evaluator}%` }}>
                      {row.evaluator.toFixed(1)}{variant === "task" ? "점" : ""}
                    </span>
                  </div>
                  <div className="signal-evaluator-chart-series" data-series="peer">
                    {row.peer === null ? (
                      <span className="signal-evaluator-chart-missing">비교 표본 없음</span>
                    ) : (
                      <>
                        <span className="signal-evaluator-chart-bar signal-evaluator-chart-bar-peer" style={{ width: `${row.peer}%` }} />
                        <span className="signal-evaluator-chart-value numeric" style={{ left: `${row.peer}%` }}>
                          {row.peer.toFixed(1)}{variant === "task" ? "점" : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </HorizontalScroll>
    </>
  )
}

export function EvaluatorTaskProfile({
  data,
}: Readonly<{ data: readonly EvaluatorTaskTendency[] }>) {
  return (
    <div className="signal-evaluator-scene signal-evaluator-task-scene">
      <AnalysisPanel
        title="과제별 평가 성향"
        description="과제별 평균 원점수와 동일 대상 동료 평균 비교"
        isEmpty={data.length === 0}
      >
        <EvaluatorComparisonChart
          rows={data.map((row) => ({ id: row.taskId, label: row.taskLabel, evaluator: row.averageScore, peer: row.peerAverage }))}
          label="과제별 평가자 평균과 동료 평균 비교 막대 차트"
          peerLabel="동료 평균"
          variant="task"
        />
        <p className="signal-evaluator-table-band" aria-hidden="true">과제별 평가 성향</p>
        <HorizontalScroll className="signal-evaluator-table-scroll" role="region" aria-label="과제별 평가 성향 상세 표, 가로 스크롤" tabIndex={0}>
          <table className="signal-evaluator-evidence-table signal-evaluator-task-table">
            <caption className="sr-only">과제별 평가 횟수, 평균 점수, 동료 평균, 평균 차이와 이탈 건수</caption>
            <thead>
              <tr>
                <th scope="col">과제</th>
                <th scope="col">평가 수</th>
                <th scope="col">평균</th>
                <th scope="col">동료 평균</th>
                <th scope="col">동료 대비</th>
                <th scope="col">10점 이상 이탈</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.taskId}>
                  <th scope="row">{row.taskLabel}</th>
                  <td className="numeric">{formatCount(row.evaluationCount, "건")}</td>
                  <td className="numeric">{formatScore(row.averageScore)}</td>
                  <td className="numeric">{row.peerAverage === null ? "-" : formatScore(row.peerAverage)}</td>
                  <td className="numeric">{signed(row.meanResidual)}</td>
                  <td className="numeric">{formatCount(row.outlierCount, "건")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HorizontalScroll>
      </AnalysisPanel>
    </div>
  )
}
