"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import "./detail-analysis-signal.css"

import { scoreAxisMaximum, scoreAxisTicks } from "./chart-score-domain"
import { AnalysisPanel } from "./analysis-panel"
import { AnalysisTable, type AnalysisTableColumn } from "./analysis-table"
import { formatCount, formatScore } from "./format"
import type { AnalysisChartProps, TeamComparisonDatum } from "./types"

const columns: readonly AnalysisTableColumn<TeamComparisonDatum>[] = [
  { key: "team", header: "팀", render: (row) => row.teamLabel },
  {
    key: "score",
    header: "평균 점수",
    align: "end",
    render: (row) => formatScore(row.score),
  },
  {
    key: "count",
    header: "확정 인원",
    align: "end",
    render: (row) => formatCount(row.completedCount, "명"),
  },
]

type TeamComparisonChartProps = AnalysisChartProps<TeamComparisonDatum> &
  Readonly<{ categoryLabel: string }>

export function TeamComparisonChart({
  data,
  categoryLabel,
  isLoading = false,
}: TeamComparisonChartProps) {
  const maximum = scoreAxisMaximum(data.map((datum) => datum.score))
  return (
    <div className="signal-detail-panel signal-detail-team">
    <AnalysisPanel
      title="팀별 비교"
      description={`${categoryLabel} 기준 팀 평균. 확정 결과만 포함하며 점수 축은 0~${maximum}점`}
      isLoading={isLoading}
      isEmpty={data.length === 0}
    >
      <HorizontalScroll className="signal-detail-scroll" role="region" aria-label="평균 점수 차트 가로 스크롤 영역" tabIndex={0}>
        <div className="signal-detail-bars" role="img" aria-label={`${categoryLabel} 팀별 평균 점수 막대 차트`}>
          <div className="signal-detail-bar-axis" aria-hidden="true">
            {scoreAxisTicks(maximum).map((tick) => <span key={tick} style={{ left: `${tick / maximum * 100}%` }}>{tick}</span>)}
          </div>
          {data.map((datum) => (
            <div className="signal-detail-bar-row" key={datum.teamId}>
              <p>{datum.teamLabel}</p>
              <div className="signal-detail-bar-track">
                <span className="signal-detail-bar" data-score={datum.score} data-domain-max={maximum} style={{ width: `${datum.score / maximum * 100}%` }} />
                <strong className="signal-detail-bar-value numeric" style={{ left: `${datum.score / maximum * 100}%` }}>{formatScore(datum.score)}</strong>
              </div>
            </div>
          ))}
        </div>
      </HorizontalScroll>
      <AnalysisTable
        caption={`${categoryLabel} 팀별 평균 점수와 확정 인원`}
        rows={data}
        columns={columns}
        getRowKey={(row) => row.teamId}
      />
    </AnalysisPanel>
    </div>
  )
}
