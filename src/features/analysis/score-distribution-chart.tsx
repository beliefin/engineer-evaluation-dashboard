import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import { scoreAxisMaximum } from "./chart-score-domain"
import { AnalysisPanel } from "./analysis-panel"
import { AnalysisTable, type AnalysisTableColumn } from "./analysis-table"
import { formatCount, formatDecimal, formatScore } from "./format"
import type { AnalysisChartProps, ScoreDistributionDatum } from "./types"

import "./analysis-summary-signal.css"

const columns: readonly AnalysisTableColumn<ScoreDistributionDatum>[] = [
  { key: "task", header: "과제", render: (row) => row.taskLabel },
  { key: "minimum", header: "최소", align: "end", render: (row) => formatScore(row.minimum) },
  { key: "q1", header: "1사분위", align: "end", render: (row) => formatScore(row.firstQuartile) },
  { key: "median", header: "중앙값", align: "end", render: (row) => formatScore(row.median) },
  { key: "q3", header: "3사분위", align: "end", render: (row) => formatScore(row.thirdQuartile) },
  { key: "maximum", header: "최대", align: "end", render: (row) => formatScore(row.maximum) },
  {
    key: "count",
    header: "확정 인원",
    align: "end",
    render: (row) => formatCount(row.completedCount, "명"),
  },
]

function DistributionMark({ datum, maximum }: Readonly<{ datum: ScoreDistributionDatum; maximum: number }>) {
  const position = (value: number) => maximum === 100 ? value : value / maximum * 100
  const ticks = Array.from({ length: 5 }, (_, index) => maximum * index / 4)
  const summary = `${datum.taskLabel}: 최소 ${formatScore(datum.minimum)}, 1사분위 ${formatScore(datum.firstQuartile)}, 중앙값 ${formatScore(datum.median)}, 3사분위 ${formatScore(datum.thirdQuartile)}, 최대 ${formatScore(datum.maximum)}, 공통 점수 축 0~${maximum}점`

  return (
    <div className="signal-analysis-distribution-row" data-distribution-id={datum.taskId} data-domain-max={maximum}>
      <div className="signal-analysis-distribution-name">
        <p className="text-sm font-medium text-foreground">{datum.taskLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          중앙값 {formatScore(datum.median)} · {formatCount(datum.completedCount, "명")}
        </p>
      </div>
      <div role="img" aria-label={summary} className="signal-analysis-distribution-mark">
        <svg
          aria-hidden="true"
          className="signal-analysis-distribution-svg"
          preserveAspectRatio="none"
          viewBox="0 0 100 28"
        >
          {ticks.map((tick) => (
            <line
              key={tick}
              x1={position(tick)}
              x2={position(tick)}
              y1="2"
              y2="26"
              stroke="#dededb"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            x1={position(datum.minimum)}
            x2={position(datum.maximum)}
            y1="14"
            y2="14"
            stroke="#1a1a18"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            data-mark="range"
          />
          <rect
            x={position(datum.firstQuartile)}
            width={position(datum.thirdQuartile - datum.firstQuartile)}
            y="6"
            height="16"
            fill="#e8cf4a"
            data-mark="interquartile-range"
          />
          {([
            ["minimum", datum.minimum],
            ["maximum", datum.maximum],
          ] as const).map(([kind, value]) => (
            <line
              key={`${datum.taskId}-end-${kind}`}
              x1={position(value)}
              x2={position(value)}
              y1="9"
              y2="19"
              stroke="#1a1a18"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            x1={position(datum.median)}
            x2={position(datum.median)}
            y1="7"
            y2="21"
            stroke={datum.firstQuartile === datum.thirdQuartile ? "#e8cf4a" : "#1a1a18"}
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            data-mark="median"
          />
        </svg>
        <div aria-hidden="true" className="signal-analysis-distribution-axis numeric">
          {ticks.map((tick) => <span key={tick} style={{ left: `${position(tick)}%` }}>{tick}</span>)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          전체 {formatDecimal(datum.minimum)}–{formatDecimal(datum.maximum)}점 · 중앙 50% {formatDecimal(datum.firstQuartile)}–{formatDecimal(datum.thirdQuartile)}점
        </p>
      </div>
    </div>
  )
}

export function ScoreDistributionChart({
  data,
  isLoading = false,
}: AnalysisChartProps<ScoreDistributionDatum>) {
  const maximum = scoreAxisMaximum(data.flatMap((datum) => [datum.minimum, datum.firstQuartile, datum.median, datum.thirdQuartile, datum.maximum]))
  return (
    <div className="signal-analysis-panel signal-analysis-distribution">
      <AnalysisPanel
        title="과제별 점수 분포와 변별 폭"
        description="최소·사분위·중앙값·최대 기준 점수 분산 확인. 사분위는 선형 보간값"
        isLoading={isLoading}
        isEmpty={data.length === 0}
      >
        <HorizontalScroll className="signal-analysis-scroll" role="region" aria-label="과제별 점수 분포 가로 스크롤 영역" tabIndex={0}>
          <div className="signal-analysis-distribution-rows">
            {data.map((datum) => <DistributionMark key={datum.taskId} datum={datum} maximum={maximum} />)}
          </div>
        </HorizontalScroll>
        <AnalysisTable
          caption="과제별 최소, 사분위, 중앙값, 최대 점수와 확정 인원"
          rows={data}
          columns={columns}
          getRowKey={(row) => row.taskId}
        />
      </AnalysisPanel>
    </div>
  )
}
