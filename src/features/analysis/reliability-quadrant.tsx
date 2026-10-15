"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import { AnalysisPanel } from "./analysis-panel"
import { AnalysisTable, type AnalysisTableColumn } from "./analysis-table"
import { formatCount, formatScore } from "./format"
import type { EvaluationReliabilityDatum } from "./types"

import "./analysis-summary-signal.css"

const X_AXIS_TICKS = [0, 20, 40, 60, 80, 100] as const
const PLOT = { left: 56, right: 580, top: 28, bottom: 308 } as const

const columns: readonly AnalysisTableColumn<EvaluationReliabilityDatum>[] = [
  { key: "engineer", header: "엔지니어", render: (row) => row.engineerLabel },
  { key: "consensus", header: "합의 평균", align: "end", render: (row) => formatScore(row.consensusScore) },
  { key: "deviation", header: "표준편차", align: "end", render: (row) => formatScore(row.standardDeviation) },
  { key: "range", header: "최고·최저 차", align: "end", render: (row) => formatScore(row.scoreRange) },
  { key: "evaluators", header: "평가자", align: "end", render: (row) => formatCount(row.evaluatorCount, "명") },
  {
    key: "status",
    header: "검토",
    render: (row) => row.isHighDisagreement ? "이견 확인" : "의견 유사",
  },
]

function domainMaximum(data: readonly EvaluationReliabilityDatum[]): number {
  const maximum = Math.max(0, ...data.map((entry) => entry.standardDeviation))
  return Math.max(10, Math.ceil(maximum / 5) * 5)
}

type ReliabilityQuadrantProps = Readonly<{
  data: readonly EvaluationReliabilityDatum[]
  taskLabel: string
  standardDeviationThreshold: number
  isLoading?: boolean
}>

export function ReliabilityQuadrant({
  data,
  taskLabel,
  standardDeviationThreshold,
  isLoading = false,
}: ReliabilityQuadrantProps) {
  const domainMax = domainMaximum(data)
  const yTicks = Array.from({ length: 5 }, (_, index) => domainMax * index / 4)
  const xPosition = (value: number) => PLOT.left + value / 100 * (PLOT.right - PLOT.left)
  const yPosition = (value: number) => PLOT.bottom - value / domainMax * (PLOT.bottom - PLOT.top)

  return (
    <div className="signal-analysis-panel signal-analysis-quadrant">
      <AnalysisPanel
        title="평가 신뢰도 사분면"
        description={`${taskLabel}의 합의 평균과 평가자 간 점수 이견 비교. 오른쪽 위는 고득점·추가 확인 대상`}
        isEmpty={data.length === 0}
        isLoading={isLoading}
      >
        <HorizontalScroll className="signal-analysis-scroll" role="region" aria-label="평가 신뢰도 산점도 가로 스크롤 영역" tabIndex={0}>
          <svg
            className="signal-analysis-quadrant-svg"
            viewBox="0 0 600 368"
            role="img"
            aria-label={`${taskLabel} 합의 평균과 평가자 점수 표준편차 산점도`}
            data-domain-max={domainMax}
          >
            <title>{`${taskLabel}: 비교 가능 대상 ${formatCount(data.length, "명")}, 이견 검토선 ${formatScore(standardDeviationThreshold)}`}</title>
            <text x="18" y="18" className="signal-analysis-axis-title">이견</text>
            {X_AXIS_TICKS.map((tick) => (
              <g key={tick} data-x-tick={tick}>
                <line x1={xPosition(tick)} x2={xPosition(tick)} y1={PLOT.top} y2={PLOT.bottom} stroke="#dededb" />
                <text x={xPosition(tick)} y={PLOT.bottom + 26} textAnchor="middle">{tick}</text>
              </g>
            ))}
            {yTicks.map((tick) => (
              <g key={tick} data-y-tick={tick}>
                <line x1={PLOT.left} x2={PLOT.right} y1={yPosition(tick)} y2={yPosition(tick)} stroke="#dededb" />
                <text x={PLOT.left - 14} y={yPosition(tick)} textAnchor="end" dominantBaseline="middle">{tick}</text>
              </g>
            ))}
            <line x1={PLOT.left} x2={PLOT.right} y1={PLOT.bottom} y2={PLOT.bottom} stroke="#1a1a18" />
            <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.bottom} stroke="#1a1a18" />
            <line
              data-mark="review-threshold"
              x1={PLOT.left}
              x2={PLOT.right}
              y1={yPosition(standardDeviationThreshold)}
              y2={yPosition(standardDeviationThreshold)}
              stroke="#777774"
              strokeDasharray="6 5"
            />
            <text x={PLOT.right - 8} y={yPosition(standardDeviationThreshold) - 12} textAnchor="end">이견 검토선</text>
            {data.map((entry) => (
              <circle
                key={entry.engineerId}
                data-engineer-id={entry.engineerId}
                data-disagreement={entry.isHighDisagreement}
                cx={xPosition(entry.consensusScore)}
                cy={yPosition(entry.standardDeviation)}
                r="7"
                fill={entry.isHighDisagreement ? "#e8cf4a" : "#b5b5b2"}
                stroke="#1a1a18"
                strokeWidth="1.2"
              >
                <title>{`${entry.engineerLabel}: 합의 평균 ${formatScore(entry.consensusScore)}, 표준편차 ${formatScore(entry.standardDeviation)}, 평가자 ${formatCount(entry.evaluatorCount, "명")}, ${entry.isHighDisagreement ? "이견 확인" : "의견 유사"}`}</title>
              </circle>
            ))}
            <text x={PLOT.right} y="362" textAnchor="end" className="signal-analysis-axis-title">합의 평균 점수</text>
          </svg>
        </HorizontalScroll>
        <section aria-label="사분면 점 범례" className="signal-analysis-quadrant-legend">
          <span><i aria-hidden="true" className="signal-analysis-point-stable" />의견 유사</span>
          <span><i aria-hidden="true" className="signal-analysis-point-review" />이견 확인</span>
        </section>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          이견 확인은 최고·최저 차, 표준편차, 다른 평가자 평균 대비 큰 편차를 함께 반영한 검토 신호입니다. 확정 판정이 아닙니다.
        </p>
        <AnalysisTable
          caption={`${taskLabel} 엔지니어별 합의 평균, 평가자 간 표준편차, 점수 범위와 검토 상태`}
          columns={columns}
          getRowKey={(row) => row.engineerId}
          rows={data}
        />
      </AnalysisPanel>
    </div>
  )
}
